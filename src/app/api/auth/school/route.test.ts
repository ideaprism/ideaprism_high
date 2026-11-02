import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { seedAccount, testStore } from '@/lib/test-accounts'
import { adminDb } from '@/lib/admin-db'
process.env.SCHOOL_SESSION_SECRET = 'school-login-test-secret-0123456789'
testStore()
let client = 0
const request = (body: unknown) => new NextRequest('http://localhost/api/auth/school', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `test-${client++}` },
})
test('school login rejects malformed input', async () => {
  for (const body of [null, [], {}, { code: 123 }, { code: 'a'.repeat(129) }]) assert.equal((await POST(request(body))).status, 400)
})
test('only issued, active, school-bound accounts may log in', async () => {
  assert.equal((await POST(request({ code: 'MIRAE' }))).status, 401)
  for (const school of ['mirae', 'boseong', 'samil', 'daegwang'] as const) {
    const code = seedAccount(`ISSUED-${school.toUpperCase()}`, school)
    const response = await POST(request({ code: code.code }))
    assert.equal(response.status, 200)
    assert.equal((await response.json()).school.slug, school)
    assert.match(response.headers.get('set-cookie') ?? '', /HttpOnly/)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    await adminDb('access_codes', { id: `eq.${code.id}` }, { method: 'PATCH', body: JSON.stringify({ is_active: false }) })
    assert.equal((await POST(request({ code: code.code }))).status, 401)
  }
  const admin = seedAccount('ADMIN-CANNOT-BE-SCHOOL')
  assert.equal((await POST(request({ code: admin.code }))).status, 401)
})
test('login denies cross-origin requests and rate-limits repeated attempts', async () => {
  const origin = new NextRequest('http://localhost/api/auth/school', { method: 'POST', headers: { Origin: 'https://other.test' }, body: '{}' })
  assert.equal((await POST(origin)).status, 403)
  let response: Response | undefined
  for (let i=0;i<11;i++) response = await POST(new NextRequest('http://localhost/api/auth/school', { method: 'POST', headers: { 'x-forwarded-for': 'same-test' }, body: JSON.stringify({code:'WRONG-CREDENTIAL'}) }))
  assert.equal(response?.status, 429)
  assert.ok(response?.headers.get('retry-after'))
})

test('same-origin login uses the real Host even if Next normalizes its internal hostname', async () => {
  const account=seedAccount('HOST-BOUND-ACCOUNT','mirae')
  const request=new NextRequest('http://localhost:3102/api/auth/school',{method:'POST',headers:{Host:'127.0.0.1:3102',Origin:'http://127.0.0.1:3102','x-forwarded-for':'host-test'},body:JSON.stringify({code:account.code})})
  assert.equal((await POST(request)).status,200)
})
