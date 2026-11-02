import { adminDb, CODE_COLUMNS, UUID_PATTERN, codeIsActive, type AdminCode } from './admin-db'
import { isAdminOrgType, type AdminSessionPayload } from './admin-session'

/** Disabling/expiring a code revokes existing administrator sessions immediately. */
export async function isActiveAdmin(session: AdminSessionPayload): Promise<boolean> {
  if (!session.codeId || !UUID_PATTERN.test(session.codeId)) return false
  const [code] = await adminDb<AdminCode[]>('access_codes', { select: CODE_COLUMNS, id: `eq.${session.codeId}`, limit: '1' })
  return Boolean(code && codeIsActive(code) && code.organization_id === session.orgId &&
    code.session_version === session.version &&
    isAdminOrgType(code.partner_organizations?.org_type))
}
