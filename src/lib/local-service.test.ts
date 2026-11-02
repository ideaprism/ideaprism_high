import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { adminDb } from './admin-db'
import { POST as login } from '@/app/api/auth/school/route'
import { POST as search } from '@/app/api/search/route'
import { GET as detail } from '@/app/api/inventions/[id]/route'

process.env.LOCAL_AUTH_DB_PATH = join(mkdtempSync(join(tmpdir(), 'high-local-')), 'accounts.sqlite')
process.env.SCHOOL_SESSION_SECRET = 'local-service-school-test-secret-0123456789'
const req = (path: string, body?: unknown, cookie = '') => new NextRequest(`http://localhost${path}`, {
  method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

test('local issued accounts isolate search/details and revoke signed sessions', async () => {
  const ids: Record<string, string> = {}, cookies: Record<string, string> = {}
  for (const school of ['mirae', 'boseong', 'samil', 'daegwang']) {
    const orgId = randomUUID()
    await assert.doesNotReject(async () => {
      await adminDb('partner_organizations', {}, { method: 'POST', body: JSON.stringify({ id: orgId, name: school, org_type: 'school', school_id: school, is_active: true }) })
    }, 'account storage works without Supabase settings')
    const [code] = await adminDb<{id:string}[]>('access_codes', {}, { method: 'POST', body: JSON.stringify({ organization_id: orgId, code: `TEST-${school.toUpperCase()}-ACCOUNT`, is_active: true }) })
    ids[school] = code.id
    const response = await login(req('/api/auth/school', { code: `TEST-${school.toUpperCase()}-ACCOUNT` }))
    assert.equal(response.status, 200)
    cookies[school] = response.headers.get('set-cookie')!.split(';')[0]
    const results = await search(req('/api/search', { keyword: '', limit: 500, school_id: 'other-school' }, cookies[school]))
    assert.equal(results.status, 200)
    const data = await results.json()
    assert.equal(data.totalCount, { mirae: 167, boseong: 82, samil: 70, daegwang: 5 }[school])
    assert.ok(data.allInventions.every((x: {school_id:string}) => x.school_id === school))
    assert.ok(!data.allInventions.some((x: {id:string}) => x.id === 'sie-33-211'))
    const ownId = data.allInventions[0].id
    const own = await detail(req(`/api/inventions/${ownId}`, undefined, cookies[school]), { params: Promise.resolve({ id: ownId }) })
    assert.equal(own.status, 200)
    assert.ok((await own.json()).student_name)
    if (school !== 'mirae') {
      const foreign = await detail(req(`/api/inventions/${ownId}`, undefined, cookies.mirae), { params: Promise.resolve({ id: ownId }) })
      assert.equal(foreign.status, 404)
    }
  }
  assert.equal((await login(req('/api/auth/school', { code: 'MIRAE' }))).status, 401)
  await adminDb('access_codes', { id: `eq.${ids.mirae}` }, { method: 'PATCH', body: JSON.stringify({ is_active: false }) })
  assert.equal((await search(req('/api/search', { keyword: '우산' }, cookies.mirae))).status, 401)
})
