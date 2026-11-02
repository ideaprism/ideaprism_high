import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-session'

process.env.ADMIN_SESSION_SECRET = 'admin-write-test-only-0123456789'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SECRET_KEY = 'server-test-key'
const id = '11111111-1111-4111-8111-111111111111'
const orgId = '22222222-2222-4222-8222-222222222222'
const admin = { id, organization_id: orgId, is_active: true, expires_at: null, max_usage: null,
  partner_organizations: { id: orgId, name: 'Admin', org_type: 'admin', is_active: true } }
async function request(body: unknown, authenticated = true) {
  const token = await createAdminSessionToken({ codeId: id, orgId, orgName: 'Admin', orgType: 'admin' })
  return new NextRequest('http://localhost/api/admin/codes/update', { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: `${ADMIN_SESSION_COOKIE}=${token}` } : {}) }, body: JSON.stringify(body) })
}
test('admin writes reject unauthenticated requests before privileged access', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw Error('unexpected fetch') })
  assert.equal((await POST(await request({ codeId: id, newCode: 'HELLO' }, false))).status, 401)
  assert.equal(mock.mock.callCount(), 0)
})

test('deactivation revokes a previously signed admin cookie before mutation', async t => {
  const calls: string[] = []
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(init?.method ?? 'GET')
    return Response.json([{ ...admin, is_active:false }])
  })
  assert.equal((await POST(await request({codeId:id,isActive:true}))).status, 401)
  assert.deepEqual(calls, ['GET'])
})
test('invalid IDs/fields cannot enter a privileged filter or write', async t => {
  const methods: string[] = []
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => { methods.push(init?.method ?? 'GET'); return Response.json([admin]) })
  for (const body of [null, { codeId: 'x&is_active=eq.true', newCode: 'VALID' }, { codeId: id, isActive: 'true' }, { codeId: id, newCode: 'X&CODE' }]) {
    assert.equal((await POST(await request(body))).status, 400)
  }
  assert.equal(methods.includes('PATCH'), false)
})
test('updates handle missing records and uniqueness instead of reporting success', async t => {
  let writeResult: Response = Response.json([])
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => init?.method === 'PATCH' ? writeResult : Response.json([admin]))
  assert.equal((await POST(await request({ codeId: id, isActive: false }))).status, 404)
  writeResult = Response.json({ code: '23505' }, { status: 409 })
  assert.equal((await POST(await request({ codeId: id, newCode: 'VALID' }))).status, 409)
  writeResult = Response.json([{ id }])
  assert.equal((await POST(await request({ codeId: id, isActive: true }))).status, 200)
})
