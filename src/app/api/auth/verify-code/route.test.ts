import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'

process.env.ADMIN_SESSION_SECRET = 'admin-tests-only-0123456789012345'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SECRET_KEY = 'server-test-key'
const request = (body: unknown) => new NextRequest('http://localhost/api/auth/verify-code', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
const record = { id: '11111111-1111-4111-8111-111111111111', code: 'ADMIN-TEST', is_active: true,
  organization_id: '22222222-2222-4222-8222-222222222222', expires_at: null, max_usage: null, usage_count: 0,
  partner_organizations: { id: '22222222-2222-4222-8222-222222222222', name: 'Admin', org_type: 'admin', is_active: true, region: null } }

test('admin login rejects malformed input without database access', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw Error('Unexpected fetch') })
  for (const body of [null, [], {}, { code: 1 }, { code: 'x'.repeat(129) }]) assert.equal((await POST(request(body))).status, 400)
  assert.equal(mock.mock.callCount(), 0)
})
test('only an active admin organization may log in, and cookies are HttpOnly', async t => {
  let current = record
  t.mock.method(globalThis, 'fetch', async () => Response.json([current]))
  const allowed = await POST(request({ code: 'ADMIN-TEST' }))
  assert.equal(allowed.status, 200)
  assert.match(allowed.headers.get('set-cookie') ?? '', /HttpOnly/)
  for (const changes of [{ is_active: false }, { expires_at: '2000-01-01' }, { max_usage: 0 },
    { partner_organizations: { ...record.partner_organizations, org_type: 'school' } }]) {
    current = { ...record, ...changes } as typeof record
    assert.equal((await POST(request({ code: 'ADMIN-TEST' }))).status, 401)
  }
})

test('administrator login consumes a use with a conditional atomic update', async t => {
  let patch: { url: URL; body: Record<string, number> } | undefined
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    if(init?.method === 'PATCH') patch = { url: new URL(String(url)), body: JSON.parse(init.body as string) }
    return Response.json([record])
  })
  const response = await POST(request({ code: 'ADMIN-TEST' }))
  assert.equal(response.status, 200)
  assert.equal(patch?.body.usage_count, 1)
  assert.equal(patch?.url.searchParams.get('usage_count'), 'eq.0')
})

test('concurrent logins cannot both consume the last available use', async t => {
  let usage = 0
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    if (init?.method !== 'PATCH') return Response.json([{ ...record, max_usage: 1, usage_count: 0 }])
    if (new URL(String(url)).searchParams.get('usage_count') !== `eq.${usage}`) return Response.json([])
    usage++
    return Response.json([{ id: record.id }])
  })
  const results = await Promise.all([POST(request({ code: 'ADMIN-TEST' })), POST(request({ code: 'ADMIN-TEST' }))])
  assert.deepEqual(results.map(x => x.status).sort(), [200, 409])
  assert.equal(usage, 1)
})
