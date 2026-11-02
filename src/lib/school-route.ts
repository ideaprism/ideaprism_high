import { NextRequest, NextResponse } from 'next/server'
import { SCHOOL_SESSION_COOKIE } from './school-token'
import { schoolForToken } from './issued-school-session'

export async function getRequestSchool(request: NextRequest) {
  const token = request.cookies.get(SCHOOL_SESSION_COOKIE)?.value
  return token ? schoolForToken(token) : null
}

/** Route handlers also enforce school access independently of middleware. */
export async function requireSchool(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(SCHOOL_SESSION_COOKIE)?.value
  try { if (await getRequestSchool(request)) return null }
  catch { return NextResponse.json({ error: '계정 저장소를 확인해 주세요.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } }) }
  const response = NextResponse.json(
    { error: 'Unauthorized', message: '학교 코드 인증이 필요합니다.' },
    { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
  )
  if (token) response.cookies.delete(SCHOOL_SESSION_COOKIE)
  return response
}
