import { adminDb, codeIsActive, type AdminCode } from './admin-db'
import { verifySchoolSessionPayload } from './school-token'
import { getSchoolBySlug } from '@/config/schools'

/** The database is authoritative, including for already-issued signed cookies. */
export async function schoolForToken(token: string) {
  const session = await verifySchoolSessionPayload(token)
  if (!session) return null
  const [code] = await adminDb<AdminCode[]>('access_codes', { id: `eq.${session.codeId}`, limit: '1' })
  if (!code || !codeIsActive(code) || code.session_version !== session.version ||
    code.partner_organizations?.org_type !== 'school' || code.partner_organizations.school_id !== session.slug) return null
  return getSchoolBySlug(session.slug)
}
