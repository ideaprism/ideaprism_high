import { requireSchool } from '@/lib/school-route';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  analyzeQuery,
  buildBooleanFilter,
  buildTermsFilter,
  rankInventions,
  SEARCH_COLUMNS,
} from '@/lib/search-query';
import { POPULAR_KEYWORDS } from '@/constants/home';
import { parseSearchRequest } from '@/lib/search-request';

// DB에서 가져오는 컬럼: 카드 표시 + 필터 + 관련도 점수 계산용 (본문 일부 포함)
const SELECT_COLUMNS =
  'id, grade_id, category_id, original_title, simple_title, simple_summary, detailed_summary, problem, solution, drawing_url, ipc, problem_tag, scamper';

/**
 * 응답(브라우저로 보내는) 데이터는 카드·필터에 필요한 필드만.
 * 본문(동기·상세요약·문제·해결·다음단계·교과·SDG)은 상세 모달을 열 때 /api/inventions/[id]로 따로 조회.
 * 예전: 18개 컬럼 전부를 최대 500건 반환 → '우산' 331KB, '비 오는 날 교실 바닥' 850KB
 */
type SearchRow = {
  id: string;
  grade_id: number | null;
  category_id: number | null;
  original_title: string;
  simple_title: string;
  simple_summary: string | null;
  detailed_summary: string | null;
  drawing_url: string | null;
  ipc: string | null;
  problem_tag: string | null;
  scamper: string | null;
};

function toCard(row: SearchRow) {
  // 쉬운 요약이 비어 있으면 상세 요약 앞부분으로 대신 (카드가 예전에 하던 대체 표시를 서버에서)
  const summary =
    row.simple_summary?.trim() ||
    (row.detailed_summary ? row.detailed_summary.replace(/\s*\/\/\s*/g, ' ').slice(0, 160) : null);
  return {
    id: row.id,
    grade_id: row.grade_id,
    category_id: row.category_id,
    original_title: row.original_title,
    simple_title: row.simple_title,
    simple_summary: summary,
    drawing_url: row.drawing_url,
    ipc: row.ipc,
    problem_tag: row.problem_tag,
    scamper: row.scamper,
  };
}

/** 문장 검색에서 쓰는 단어 수 상한 (조회 개수 = 단어 수 + 2) */
const MAX_GROUPS = 5;

const EMPTY_RESULT = {
  allInventions: [],
  grades: [],
  categories: [],
  problemTags: [],
  scamperTags: [],
  totalCount: 0,
};

export async function POST(request: NextRequest) {
  const denied = await requireSchool(request);
  if (denied) return denied;
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          message: '요청 데이터가 올바르지 않습니다. 다시 시도해 주세요.',
        },
        { status: 400 }
      );
    }

    const body = parseSearchRequest(input);
    if (!body) {
      return NextResponse.json({
        error: 'Invalid request body',
        message: '검색어는 500자 이하의 문자열, 조회 개수는 1~500의 정수로 입력해 주세요. 검색식의 괄호와 연산자도 확인해 주세요.',
      }, { status: 400 });
    }
    const { keyword, limit: maxLimit, guestMode } = body;

    if (keyword.length < 2) {
      return NextResponse.json({
        allInventions: [],
        grades: [],
        categories: [],
        problemTags: [],
        scamperTags: [],
        totalCount: 0,
        message: '검색어를 2글자 이상 입력해 주세요.',
      });
    }

    if (guestMode && !POPULAR_KEYWORDS.includes(keyword)) {
      return NextResponse.json(
        {
          allInventions: [],
          grades: [],
          categories: [],
          problemTags: [],
          scamperTags: [],
          totalCount: 0,
          error: 'Guest mode limited',
          message: '체험 모드에서는 인기 검색어만 검색할 수 있습니다.',
        },
        { status: 403 }
      );
    }

    const analyzed = analyzeQuery(keyword);
    if (analyzed.groups.length === 0) {
      return NextResponse.json({ ...EMPTY_RESULT, message: '검색할 단어를 입력해 주세요.' });
    }

    const supabase = await createClient();
    const runQuery = (filter: string) =>
      supabase.from('inventions').select(SELECT_COLUMNS).or(filter).limit(maxLimit);

    // 검색 실행
    // - Boolean 식: 식 그대로 1회
    // - 일반 입력 1단어: 1회
    // - 일반 입력 여러 단어: '모두 포함', '하나만 빠진 조합'(3단어 이상), '하나라도 포함'을
    //   동시에 조회해 합침. '하나라도 포함'은 limit에서 임의로 잘리므로, 단어를 많이 포함한
    //   발명이 빠지지 않게 하려면 앞의 조회가 필요함
    //   (예: '비 오는 날 교실 바닥' → 빗물·교실·바닥 모두 0건, 빗물·바닥 32건이 '하나라도'에서 누락됐음)
    let filters: string[];
    if (analyzed.mode === 'boolean') {
      filters = [buildBooleanFilter(analyzed.node, SEARCH_COLUMNS)];
    } else if (analyzed.groups.length === 1) {
      filters = [buildTermsFilter(analyzed.groups, SEARCH_COLUMNS, 'any')];
    } else {
      const groups = analyzed.groups.slice(0, MAX_GROUPS);
      const leaveOneOut =
        groups.length >= 3 ? groups.map((_, i) => groups.filter((__, j) => j !== i)) : [];
      filters = [
        buildTermsFilter(groups, SEARCH_COLUMNS, 'all'),
        ...leaveOneOut.map((g) => buildTermsFilter(g, SEARCH_COLUMNS, 'all')),
        buildTermsFilter(groups, SEARCH_COLUMNS, 'any'),
      ];
    }

    const results = await Promise.all(filters.map(runQuery));

    // 한동안 쉬던 DB의 첫 조회는 실행 시간 제한(57014)에 걸리기 쉬움 (2026-10-27 실측: 첫 '우산' 504,
    // 바로 다시 하면 1.6~2초 성공). 시간초과 난 조회만 서버에서 한 번 더 시도한다.
    const timedOut = results
      .map((r, i) => (r.error?.code === '57014' ? i : -1))
      .filter((i) => i >= 0);
    if (timedOut.length > 0) {
      console.warn(`[Search] statement timeout on ${timedOut.length} query(s), retrying once`);
      const retried = await Promise.all(timedOut.map((i) => runQuery(filters[i])));
      timedOut.forEach((idx, k) => {
        results[idx] = retried[k];
      });
    }

    const error = results.find((r) => r.error)?.error ?? null;

    const merged = new Map<string, NonNullable<(typeof results)[number]['data']>[number]>();
    for (const r of results) {
      for (const row of r.data ?? []) {
        if (!merged.has(row.id)) merged.set(row.id, row);
      }
    }

    // 관련도 순 정렬 (예전: 생성일 역순 → '우산' 1위가 훌라후프였던 원인)
    const allInventions = rankInventions([...merged.values()], keyword, analyzed.groups).slice(0, maxLimit);

    if (error && allInventions.length === 0) {
      console.error('Search query error:', error);
      if (error.code === '57014') {
        return NextResponse.json(
          {
            error: 'Query timeout',
            message: '검색 시간이 초과되었습니다. 다시 시도해 주세요.',
            retryable: true,
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        {
          error: 'Search failed',
          message: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        },
        { status: 500 }
      );
    }

    if (!allInventions || allInventions.length === 0) {
      return NextResponse.json({
        allInventions: [],
        grades: [],
        categories: [],
        problemTags: [],
        scamperTags: [],
        totalCount: 0,
      });
    }

    const [gradesRes, categoriesRes] = await Promise.all([
      supabase.from('grades').select('id, name').order('display_order', { ascending: true }),
      supabase.from('categories').select('id, name'),
    ]);

    const uniqueProblemTags = new Set<string>();
    const uniqueScamperTags = new Set<string>();

    allInventions.forEach((inv) => {
      if (inv.problem_tag) {
        inv.problem_tag.split(',').forEach((t) => {
          const tag = t.trim();
          if (tag && tag !== '-') uniqueProblemTags.add(tag);
        });
      }
      if (inv.scamper) {
        inv.scamper.split(',').forEach((t) => {
          const tag = t.trim();
          if (tag && tag !== '-') uniqueScamperTags.add(tag);
        });
      }
    });

    const problemTags = Array.from(uniqueProblemTags).map((tag, i) => ({ id: i + 1, name: tag }));
    const scamperTags = Array.from(uniqueScamperTags).map((tag, i) => ({ id: i + 1, name: tag }));

    return NextResponse.json({
      allInventions: (allInventions as SearchRow[]).map(toCard),
      grades: gradesRes.data ?? [],
      categories: categoriesRes.data ?? [],
      problemTags,
      scamperTags,
      totalCount: allInventions.length,
      partialResults: Boolean(error),
      maxResults: maxLimit,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

