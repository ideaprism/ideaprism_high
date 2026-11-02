import { NextRequest, NextResponse } from 'next/server'
import { getRequestSchool } from '@/lib/school-route'
import { getSchoolInvention } from '@/lib/service-data'
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' }
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const school = await getRequestSchool(request)
    if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    const { id } = await params
    if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers })
    const data = getSchoolInvention(school.slug, id)
    if (!data) return NextResponse.json({ error: 'Not Found' }, { status: 404, headers })
    return NextResponse.json(data, { headers })
  } catch { return NextResponse.json({ error: 'Service data unavailable' }, { status: 503, headers }) }
}
