import { NextRequest } from 'next/server'
import { adminDb, adminDbConfigured, CODE_COLUMNS, CODE_PATTERN, codeIsUsable, type AdminCode } from '@/lib/admin-db'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, isAdminOrgType } from '@/lib/admin-session'
import { adminError, adminJson } from '@/lib/admin-response'
import { adminLoginLimiter } from '@/lib/login-rate-limit'

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || !('code' in body) || typeof body.code !== 'string' ||
    !CODE_PATTERN.test(body.code.trim().toUpperCase())) return adminJson({ error: '관리자 코드를 확인해 주세요.' }, 400)
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) return adminJson({ error: 'Forbidden' }, 403)
  if (!adminDbConfigured()) return adminJson({ error: '관리자 DB 연결 설정이 필요합니다.' }, 503)
  const client = (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local').slice(0, 128)
  const retryAfter = adminLoginLimiter(client)
  if (retryAfter) {
    const response = adminJson({ error: '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.' }, 429)
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }
  try {
    const codes = await adminDb<AdminCode[]>('access_codes', { select: CODE_COLUMNS, code: `eq.${body.code.trim().toUpperCase()}`, limit: '1' })
    const code = codes[0]
    const org = code?.partner_organizations
    if (!code || !org || !codeIsUsable(code) || !isAdminOrgType(org.org_type)) {
      return adminJson({ valid: false, error: '유효한 관리자 코드가 아닙니다.' }, 401)
    }
    const token = await createAdminSessionToken({ codeId: code.id, orgId: org.id, orgName: org.name, orgType: org.org_type })
    // Compare-and-set avoids lost increments or exceeding a finite admission quota.
    const consumed = await adminDb<{ id: string }[]>('access_codes', {
      id: `eq.${code.id}`, is_active: 'eq.true', select: 'id',
      usage_count: code.usage_count === null ? 'is.null' : `eq.${code.usage_count}`,
      max_usage: code.max_usage === null ? 'is.null' : `eq.${code.max_usage}`,
      expires_at: code.expires_at === null ? 'is.null' : `eq.${code.expires_at}`,
    }, { method: 'PATCH', body: JSON.stringify({ usage_count: (code.usage_count ?? 0) + 1 }) })
    if (consumed.length !== 1) return adminJson({ error: '코드 상태가 바뀌었습니다. 다시 로그인해 주세요.' }, 409)
    const response = adminJson({ valid: true, organization: { id: org.id, name: org.name, orgType: org.org_type, region: org.region } })
    response.cookies.set(ADMIN_SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 })
    return response
  } catch (error) { return adminError(error) }
}
