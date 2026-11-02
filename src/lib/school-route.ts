import { NextRequest, NextResponse } from 'next/server'
import { SCHOOL_SESSION_COOKIE, verifySchoolSessionToken } from './school-token'

/** Route handlers also enforce school access independently of middleware. */
export async function requireSchool(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(SCHOOL_SESSION_COOKIE)?.value
  if (token && await verifySchoolSessionToken(token)) return null
  const response = NextResponse.json(
    { error: 'Unauthorized', message: '학교 코드 인증이 필요합니다.' },
    { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
  )
  if (token) response.cookies.delete(SCHOOL_SESSION_COOKIE)
  return response
}
