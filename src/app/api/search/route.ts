import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { parseSearchQuery, buildPostgrestFilter } from '@/lib/search-parser';
import { POPULAR_KEYWORDS } from '@/constants/home';
import { getSchoolSession } from '@/lib/school-session';

interface SearchRequestBody {
  keyword?: string;
  page?: number;
  limit?: number;
  guestMode?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getSchoolSession())) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '학교 코드 인증이 필요합니다.' },
        { status: 401 }
      )
    }

    let body: SearchRequestBody;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        {
          error: 'Invalid request body',
          message: '요청 데이터가 올바르지 않습니다. 다시 시도해 주세요.',
        },
        { status: 400 }
      );
    }

    const keyword = (body.keyword ?? '').trim();
    const limit = body.limit ?? 15;
    const guestMode = body.guestMode ?? false;
    const maxLimit = Math.min(limit, 500);

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

    const supabase = await createClient();

    let baseQuery = supabase
      .from('inventions')
      .select(
        'id, grade_id, original_title, simple_title, drawing_url, simple_summary, invention_motive, detailed_summary, problem, solution, next_step, category_id, ipc, curriculum, sdg, problem_tag, scamper, error'
      );

    const searchNode = parseSearchQuery(keyword);
    if (searchNode) {
      const filterStr = buildPostgrestFilter(searchNode, [
        'original_title',
        'simple_title',
        'simple_summary',
        'detailed_summary',
      ]);
      baseQuery = baseQuery.or(filterStr);
    } else {
      baseQuery = baseQuery.or(
        `original_title.ilike.%${keyword}%,simple_title.ilike.%${keyword}%,simple_summary.ilike.%${keyword}%,detailed_summary.ilike.%${keyword}%`
      );
    }

    const { data: allInventions, error } = await baseQuery
      .order('created_at', { ascending: false })
      .limit(maxLimit);

    if (error) {
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
          details: error.message,
          code: error.code,
          hint: error.hint,
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
      allInventions,
      grades: gradesRes.data ?? [],
      categories: categoriesRes.data ?? [],
      problemTags,
      scamperTags,
      totalCount: allInventions.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

