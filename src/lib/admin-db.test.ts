import assert from 'node:assert/strict'
import test from 'node:test'
import { adminDb, adminCount, codeIsActive, codeIsUsable, type AdminCode } from './admin-db'
import { seedAccount, testStore } from './test-accounts'
testStore()
test('accounts persist without network and enforce unique credentials', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw Error('Unexpected network') })
  const code = seedAccount('LOCAL-ACCOUNT-TEST', 'mirae')
  const [saved] = await adminDb<AdminCode[]>('access_codes', { id: `eq.${code.id}` })
  assert.equal(saved.partner_organizations?.school_id, 'mirae')
  assert.equal(await adminCount('access_codes'), 1)
  await assert.rejects(adminDb('access_codes', {}, { method: 'POST', body: JSON.stringify({ code: code.code, organization_id: code.organization_id }) }), { code: '23505' })
})
test('a final permitted login stays valid while additional logins are refused', () => {
  const code = { is_active:true, expires_at:null, max_usage:1, usage_count:1,
    partner_organizations:{ is_active:true } } as AdminCode
  assert.equal(codeIsUsable(code), false)
  assert.equal(codeIsActive(code), true)
  assert.equal(codeIsActive({ ...code, is_active:false }), false)
})
