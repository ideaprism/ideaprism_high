import { randomInt } from 'node:crypto'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { CODE_PATTERN, adminDb, AdminDbError } from '@/lib/admin-db'
import { postgresTransaction } from '@/lib/postgres-auth-store'
import { authTransaction, localAdminQuery } from '@/lib/local-auth-store'
import { isSchoolSlug } from '@/config/schools'
import { adminError, adminJson } from '@/lib/admin-response'

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return adminJson({ error: '입력 내용을 확인해 주세요.' }, 400)
  const input = body as Record<string, unknown>
  if (typeof input.schoolId !== 'string' || !isSchoolSlug(input.schoolId)) return adminJson({ error: '소속 학교를 선택해 주세요.' }, 400)
  for (const [key, max] of Object.entries({ orgName: 200, contactName: 100, contactEmail: 254, customCode: 128 })) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || (input[key] as string).length > max)) return adminJson({ error: '입력 형식이나 길이를 확인해 주세요.' }, 400)
  }
  const orgName = (input.orgName as string | undefined)?.trim()
  if (!orgName) return adminJson({ error: '계정 이름을 입력해 주세요.' }, 400)
  const customCode = (input.customCode as string | undefined)?.trim().toUpperCase()
  if (customCode && !CODE_PATTERN.test(customCode)) return adminJson({ error: '계정 코드는 영문·숫자·_·- 4~128자로 입력해 주세요.' }, 400)
  try {
    if (process.env.DATABASE_URL) {
      const data = await postgresTransaction(async () => {
        let code = customCode || ''
        if (!code) for (let attempt = 0; attempt < 20; attempt++) {
          code = `${String(input.schoolId).toUpperCase()}-${randomInt(1000, 10000)}`
          if (!(await adminDb<unknown[]>('access_codes', { code: `eq.${code}`, limit: '1' })).length) break
        }
        const [org] = await adminDb<{ id: string }[]>('partner_organizations', {}, { method: 'POST', body: JSON.stringify({
          name: orgName, org_type: 'school', school_id: input.schoolId, is_active: true,
          contact_name: input.contactName || null, contact_email: input.contactEmail || null,
        }) })
        const [issued] = await adminDb<{ id: string; code: string }[]>('access_codes', {}, { method: 'POST', body: JSON.stringify({ code, organization_id: org.id, label: orgName + ' 계정', is_active: true }) })
        return { org, code: { id: issued.id, code: issued.code } }
      })
      return adminJson({ success: true, data })
    }
    const data = authTransaction(() => {
      let code = customCode || ''
      if (!code) {
        // Short school-prefixed codes are easier to read aloud during a demonstration.
        for (let attempt = 0; attempt < 20; attempt++) {
          code = `${String(input.schoolId).toUpperCase()}-${randomInt(1000, 10000)}`
          if (!localAdminQuery('access_codes', { code: `eq.${code}`, limit: '1' }).length) break
        }
      }
      const [org] = localAdminQuery('partner_organizations', {}, { method: 'POST', body: JSON.stringify({
        name: orgName, org_type: 'school', school_id: input.schoolId, is_active: true,
        contact_name: input.contactName || null, contact_email: input.contactEmail || null,
      }) })
      const [issued] = localAdminQuery('access_codes', {}, { method: 'POST', body: JSON.stringify({
        code, organization_id: org.id, label: orgName + ' 계정', is_active: true,
      }) })
      return { org, code: { id: issued.id, code: issued.code } }
    })
    return adminJson({ success: true, data })
  } catch (error) {
    if (error instanceof AdminDbError && error.status === 409) return adminJson({ error: '이미 사용 중인 코드입니다.' }, 409)
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) return adminJson({ error: '이미 사용 중인 코드입니다.' }, 409)
    return adminError(error)
  }
}
