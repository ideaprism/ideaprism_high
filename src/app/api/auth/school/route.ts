import { NextRequest, NextResponse } from 'next/server'
import { getSchoolBySlug, isSchoolSlug } from '@/config/schools'
import { adminDb, codeIsUsable, type AdminCode } from '@/lib/admin-db'
import { createLoginLimiter } from '@/lib/login-rate-limit'
import { isSameOriginRequest } from '@/lib/request-origin'
import { SCHOOL_SESSION_COOKIE, SCHOOL_SESSION_MAX_AGE, createSchoolSessionToken } from '@/lib/school-token'

const limitLogin = createLoginLimiter()
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return json({ ok: false, message: 'Forbidden' }, 403)
  const retry = limitLogin((request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local').slice(0, 128))
  if (retry) {
    const response = json({ ok: false, message: '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.' }, 429)
    response.headers.set('Retry-After', String(retry)); return response
  }
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body) || !('code' in body) ||
    typeof body.code !== 'string' || !body.code.trim() || body.code.length > 128) return json({ ok: false, message: '발급받은 계정 코드를 입력해 주세요.' }, 400)
  try {
    const [code] = await adminDb<AdminCode[]>('access_codes', { code: `eq.${body.code.trim().toUpperCase()}`, limit: '1' })
    const org = code?.partner_organizations
    if (!code || org?.org_type !== 'school' || !org.school_id || !isSchoolSlug(org.school_id)) {
      return json({ ok: false, message: '유효한 계정 코드가 아닙니다.' }, 401)
    }
    if (!code.is_active || !org.is_active) {
      return json({ ok: false, message: '비활성화된 학교 계정입니다. 관리자에게 계정 활성화를 요청해 주세요.' }, 401)
    }
    if (!codeIsUsable(code)) return json({ ok: false, message: '사용 기간 또는 로그인 횟수가 만료된 계정입니다. 관리자에게 확인해 주세요.' }, 401)
    const school = getSchoolBySlug(org.school_id)!
    const token = await createSchoolSessionToken(school.slug, code.id, code.session_version)
    const consumed = await adminDb<AdminCode[]>('access_codes', {
      id: `eq.${code.id}`, is_active: 'eq.true', session_version: `eq.${code.session_version}`,
      usage_count: `eq.${code.usage_count ?? 0}`,
    }, { method: 'PATCH', body: JSON.stringify({ usage_count: (code.usage_count ?? 0) + 1 }) })
    if (consumed.length !== 1) return json({ ok: false, message: '계정 상태가 바뀌었습니다. 다시 로그인해 주세요.' }, 409)
    const response = json({ ok: true, school: { slug: school.slug, name: school.name, shortName: school.shortName } })
    response.cookies.set(SCHOOL_SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SCHOOL_SESSION_MAX_AGE })
    return response
  } catch {
    return json({ ok: false, message: '계정 저장소 또는 세션 설정을 확인해 주세요.' }, 503)
  }
}
