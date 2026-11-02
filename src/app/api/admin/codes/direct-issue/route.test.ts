import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-session'
import { seedAccount, testStore } from '@/lib/test-accounts'
import { adminCount, adminDb, type AdminCode } from '@/lib/admin-db'
process.env.ADMIN_SESSION_SECRET = 'direct-issue-test-only-0123456789'
testStore()
const admin = seedAccount('ADMIN-DIRECT-ISSUE-TEST')
async function request(body: unknown, authenticated = true) {
  const token = await createAdminSessionToken({codeId:admin.id,version:admin.session_version,orgId:admin.organization_id,orgName:'Admin',orgType:'admin'})
  return new NextRequest('http://localhost/api/admin/codes/direct-issue',{method:'POST',headers:{'Content-Type':'application/json',...(authenticated?{Cookie:`${ADMIN_SESSION_COOKIE}=${token}`}:{})},body:JSON.stringify(body)})
}
test('issuance requires an administrator and a valid school binding', async () => {
  assert.equal((await POST(await request({orgName:'Test',schoolId:'mirae'},false))).status,401)
  for(const schoolId of [undefined,'other','mirae&school=other']) assert.equal((await POST(await request({orgName:'Test',schoolId}))).status,400)
})

test('issuance accepts a memorable four-character school code',async()=>{
  const response=await POST(await request({orgName:'Short code demo',schoolId:'mirae',customCode:'demo'}))
  assert.equal(response.status,200)
  assert.equal((await response.json()).data.code.code,'DEMO')
})

test('automatic school codes use the school name and four digits',async()=>{
  const response=await POST(await request({orgName:'Automatic demo',schoolId:'samil'}))
  assert.equal(response.status,200)
  assert.match((await response.json()).data.code.code,/^SAMIL-\d{4}$/)
})
test('account issuance is atomic on duplicate credentials and retains contacts', async () => {
  const body={orgName:'Test school',schoolId:'mirae',customCode:'TEST-ISSUED-ACCOUNT',contactName:'Contact',contactEmail:'contact@example.com'}
  assert.equal((await POST(await request(body))).status,200)
  const before=await adminCount('partner_organizations')
  assert.equal((await POST(await request(body))).status,409)
  assert.equal(await adminCount('partner_organizations'),before)
  const [saved]=await adminDb<AdminCode[]>('access_codes',{code:`eq.${body.customCode}`})
  assert.equal(saved.partner_organizations?.school_id,'mirae')
  assert.equal((saved.partner_organizations as unknown as {contact_name:string}).contact_name,'Contact')
})
