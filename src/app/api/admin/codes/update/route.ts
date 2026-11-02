import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { adminDb, UUID_PATTERN, CODE_PATTERN, codeIsActive, codeIsUsable, type AdminCode } from '@/lib/admin-db'
import { adminError, adminJson } from '@/lib/admin-response'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyAdminSessionToken, isAdminOrgType } from '@/lib/admin-session'

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || !('codeId' in body) || typeof body.codeId !== 'string' || !UUID_PATTERN.test(body.codeId)) {
    return adminJson({ error: '올바른 코드 ID가 필요합니다.' }, 400)
  }
  const patch: { code?: string; is_active?: boolean } = {}
  if ('newCode' in body) {
    if (typeof body.newCode !== 'string' || !CODE_PATTERN.test(body.newCode.trim().toUpperCase())) return adminJson({ error: '코드는 영문·숫자·_·- 4~128자로 입력해 주세요.' }, 400)
    patch.code = body.newCode.trim().toUpperCase()
  }
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') return adminJson({ error: '활성 상태를 확인해 주세요.' }, 400)
    patch.is_active = body.isActive
  }
  if (!Object.keys(patch).length) return adminJson({ error: '변경할 값이 없습니다.' }, 400)
  try {
    const rows = await adminDb<AdminCode[]>('access_codes', { id: 'eq.' + body.codeId }, { method: 'PATCH', body: JSON.stringify(patch) })
    if (!rows.length) return adminJson({ error: '코드를 찾을 수 없습니다.' }, 404)
    const session = await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '')
    const updated = rows[0]
    const ownAccount = session?.codeId === updated.id
    const org = updated.partner_organizations
    const stillActive = codeIsActive(updated) && org && isAdminOrgType(org.org_type)
    const response = adminJson({ success: true, loginAvailable: codeIsUsable(updated), requiresRelogin: ownAccount && !stillActive })
    if (ownAccount) {
      if (stillActive) {
        // Keep only this browser signed in after its own code change. Older cookies stay revoked.
        const token = await createAdminSessionToken({ codeId: updated.id, version: updated.session_version,
          orgId: org.id, orgName: org.name, orgType: org.org_type })
        response.cookies.set(ADMIN_SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 })
      } else response.cookies.delete(ADMIN_SESSION_COOKIE)
    }
    return response
  } catch (error) { return adminError(error) }
}
