import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { localAdminQuery } from './local-auth-store'
import { createSchoolSessionToken } from './school-token'
import type { SchoolSlug } from '@/config/schools'
import type { AdminCode } from './admin-db'

export function testStore() {
  process.env.LOCAL_AUTH_DB_PATH = join(mkdtempSync(join(tmpdir(), 'high-test-')), 'accounts.sqlite')
}
export function seedAccount(code: string, school: SchoolSlug | null = null): AdminCode {
  const [org] = localAdminQuery('partner_organizations', {}, { method: 'POST', body: JSON.stringify({ name: school || 'Test administrator', org_type: school ? 'school' : 'admin', school_id: school, is_active: true }) })
  return localAdminQuery('access_codes', {}, { method: 'POST', body: JSON.stringify({ code, organization_id: org.id, is_active: true }) })[0] as unknown as AdminCode
}
export async function testSchoolToken(school: SchoolSlug = 'mirae') {
  const code = seedAccount(`TEST-${school}-${crypto.randomUUID()}`.toUpperCase(), school)
  return createSchoolSessionToken(school, code.id, code.session_version)
}
