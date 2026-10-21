import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'
import { SCHOOL_SESSION_COOKIE, verifySchoolSessionToken } from '@/lib/school-token'

function isSchoolPath(pathname: string): boolean {
  return (
    pathname === '/search' ||
    pathname.startsWith('/search/') ||
    pathname === '/inventions' ||
    pathname.startsWith('/inventions/') ||
    pathname === '/api/search' ||
    pathname.startsWith('/api/search/') ||
    pathname.startsWith('/api/kipris/') ||
    pathname.startsWith('/api/chat/') ||
    pathname === '/test' ||
    pathname.startsWith('/test/')
  )
}

function unauthorizedForPath(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('adminAuth', 'required')
  return NextResponse.redirect(url)
}

function schoolRequired(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '학교 코드 인증이 필요합니다.' },
      { status: 401 }
    )
  }

  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.search = ''
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  if (isSchoolPath(request.nextUrl.pathname)) {
    const token = request.cookies.get(SCHOOL_SESSION_COOKIE)?.value
    const slug = token ? await verifySchoolSessionToken(token) : null
    if (!slug) {
      const response = schoolRequired(request)
      if (token) response.cookies.delete(SCHOOL_SESSION_COOKIE)
      return response
    }
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) {
    return unauthorizedForPath(request)
  }

  const session = await verifyAdminSessionToken(token)
  if (!session) {
    const response = unauthorizedForPath(request)
    response.cookies.delete(ADMIN_SESSION_COOKIE)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/search',
    '/search/:path*',
    '/inventions',
    '/inventions/:path*',
    '/api/search',
    '/api/search/:path*',
    '/api/kipris/:path*',
    '/api/chat/:path*',
    '/test',
    '/test/:path*',
  ],
}
