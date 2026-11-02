import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { seedAccount, testStore } from '@/lib/test-accounts'
import { adminDb, type AdminCode } from '@/lib/admin-db'
process.env.ADMIN_SESSION_SECRET = 'admin-tests-only-0123456789012345'
testStore()
let client = 0
const request = (body: unknown) => new NextRequest('http://localhost/api/auth/verify-code', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `test-${client++}` }, body: JSON.stringify(body),
})
test('admin login validates input and rejects school accounts', async () => {
  for (const body of [null, [], {}, { code: 1 }, { code: 'x'.repeat(129) }]) assert.equal((await POST(request(body))).status, 400)
  seedAccount('SCHOOL-NOT-ADMIN', 'mirae')
  assert.equal((await POST(request({ code: 'SCHOOL-NOT-ADMIN' }))).status, 401)
})
test('admin login consumes usage atomically and respects expiry/activity/quota', async () => {
  const code = seedAccount('ADMIN-TEST-LOCAL')
  const response = await POST(request({ code: code.code }))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('set-cookie') || '', /HttpOnly/)
  const [saved] = await adminDb<AdminCode[]>('access_codes', { id: `eq.${code.id}` })
  assert.equal(saved.usage_count, 1)
  for (const patch of [{ is_active:false }, { is_active:true, expires_at:'2000-01-01' }, { expires_at:null, max_usage:1 }]) {
    await adminDb('access_codes', { id: `eq.${code.id}` }, { method:'PATCH', body:JSON.stringify(patch) })
    assert.equal((await POST(request({code:code.code}))).status, 401)
  }
})
test('concurrent logins cannot both consume the last use', async () => {
  const code = seedAccount('ADMIN-LAST-LOGIN')
  await adminDb('access_codes', {id:`eq.${code.id}`}, {method:'PATCH',body:JSON.stringify({max_usage:1})})
  const results = await Promise.all([POST(request({code:code.code})), POST(request({code:code.code}))])
  assert.equal(results.filter(r=>r.status===200).length,1)
  assert.ok(results.some(r=>[401,409].includes(r.status)))
})
