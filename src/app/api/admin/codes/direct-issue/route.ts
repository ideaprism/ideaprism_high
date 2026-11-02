import { randomBytes, randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-route'
import { adminDb, CODE_PATTERN } from '@/lib/admin-db'
import { adminError, adminJson } from '@/lib/admin-response'

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return adminJson({ error: '입력 내용을 확인해 주세요.' }, 400)
  const input = body as Record<string, unknown>
  const limits = { orgName: 200, contactName: 100, contactEmail: 254, contactPhone: 40, customCode: 128 }
  for (const [key, max] of Object.entries(limits)) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || (input[key] as string).length > max)) return adminJson({ error: '입력 형식이나 길이를 확인해 주세요.' }, 400)
  }
  const orgName = (input.orgName as string | undefined)?.trim()
  if (!orgName) return adminJson({ error: '기관명을 입력해 주세요.' }, 400)
  const code = (input.customCode as string | undefined)?.trim().toUpperCase() || 'PRISM-' + randomBytes(8).toString('hex').toUpperCase()
  if (!CODE_PATTERN.test(code)) return adminJson({ error: '코드 형식을 확인해 주세요.' }, 400)
  let createdOrgId: string | undefined
  try {
    const existing = await adminDb<{ id: string }[]>('access_codes', { code: 'eq.' + code, select: 'id', limit: '1' })
    if (existing.length) return adminJson({ error: '이미 사용 중인 코드입니다.' }, 409)
    createdOrgId = randomUUID()
    const [org] = await adminDb<{ id: string; name: string }[]>('partner_organizations', {}, { method: 'POST', body: JSON.stringify({
      id: createdOrgId, name: orgName, org_type: 'school', is_active: true, contact_name: input.contactName || null, contact_email: input.contactEmail || null,
    }) })
    if (!org?.id) throw new Error('Organization not created')
    const [issued] = await adminDb<{ id: string; code: string }[]>('access_codes', {}, { method: 'POST', body: JSON.stringify({
      code, organization_id: org.id, label: orgName + ' 기관 코드', is_active: true, max_usage: null,
    }) })
    if (!issued?.id) throw new Error('Code not created')
    return adminJson({ success: true, data: { org, code: issued } })
  } catch (error) {
    if (createdOrgId) {
      // Compensate only this request's new organization; never touch existing organizations.
      try { await adminDb('partner_organizations', { id: 'eq.' + createdOrgId }, { method: 'DELETE' }) }
      catch { console.error('[Direct issue] Organization cleanup requires reconciliation:', createdOrgId) }
    }
    return adminError(error)
  }
}
