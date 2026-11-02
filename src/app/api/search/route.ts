import { NextRequest, NextResponse } from 'next/server'
import { getRequestSchool } from '@/lib/school-route'
import { searchSchoolInventions } from '@/lib/service-data'
import { parseSearchRequest } from '@/lib/search-request'
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' }
export async function POST(request: NextRequest) {
  try {
    const school = await getRequestSchool(request)
    if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    const body = parseSearchRequest(await request.json().catch(() => null))
    if (!body) return NextResponse.json({ error: 'Invalid request body', message: '검색어·검색식·조회 개수를 확인해 주세요.' }, { status: 400, headers })
    return NextResponse.json(searchSchoolInventions(school.slug, body.keyword, body.limit), { headers })
  } catch {
    return NextResponse.json({ error: 'Service data unavailable', message: '계정 저장소와 데이터 패키지를 확인해 주세요.' }, { status: 503, headers })
  }
}
