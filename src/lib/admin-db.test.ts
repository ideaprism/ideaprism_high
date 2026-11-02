import assert from 'node:assert/strict'
import test from 'node:test'
import { adminDb, codeIsActive, codeIsUsable, type AdminCode } from './admin-db'

test('modern secret keys use apikey, legacy JWT keys additionally use Bearer', async t => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  let headers = new Headers()
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
    headers = new Headers(init?.headers); return Response.json([])
  })
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_test_only'
  await adminDb('access_codes')
  assert.equal(headers.get('apikey'), 'sb_secret_test_only')
  assert.equal(headers.get('authorization'), null)
  process.env.SUPABASE_SECRET_KEY = 'legacy-test-key'
  await adminDb('access_codes')
  assert.equal(headers.get('authorization'), 'Bearer legacy-test-key')
})
test('a final permitted login stays valid while additional logins are refused', () => {
  const code = { is_active:true, expires_at:null, max_usage:1, usage_count:1,
    partner_organizations:{ is_active:true } } as AdminCode
  assert.equal(codeIsUsable(code), false)
  assert.equal(codeIsActive(code), true)
  assert.equal(codeIsActive({ ...code, is_active:false }), false)
})
