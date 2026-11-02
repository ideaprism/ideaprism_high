import { requireSchool } from '@/lib/school-route';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/inventions/[id]
 * 상세 모달용 본문 필드 단건 조회. 목록 API(/api/search)는 카드 필드만 보내므로
 * 모달을 열 때 이 API로 나머지(동기·상세요약·문제·해결·다음단계·교과·SDG)를 가져온다.
 */
const DETAIL_COLUMNS =
  'id, invention_motive, detailed_summary, problem, solution, next_step, curriculum, sdg';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSchool(_request);
  if (denied) return denied;
  const { id } = await params;

  // id 형식 검사 (영문·숫자·하이픈·밑줄, 64자 이하)
  if (!/^[\w-]{1,64}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventions')
      .select(DETAIL_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[Invention detail] query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // 학교 인증 뒤의 응답은 공유 캐시에 저장하지 않는다.
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    console.error('[Invention detail] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
