import { NextRequest, NextResponse } from 'next/server'
import { getRequestSchool } from '@/lib/school-route'
import { getSchoolImage } from '@/lib/service-data'

const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' }
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const school = await getRequestSchool(request)
    if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    const { id } = await params
    if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers })
    const image = getSchoolImage(school.slug, id)
    if (!image) return NextResponse.json({ error: 'Not Found' }, { status: 404, headers })
    return new Response(new Uint8Array(image.bytes), { headers: { ...headers, 'Content-Type': image.contentType } })
  } catch { return NextResponse.json({ error: 'Photo unavailable' }, { status: 503, headers }) }
}
