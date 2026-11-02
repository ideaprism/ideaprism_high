import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { POST as schoolLogin } from '@/app/api/auth/school/route'
import { createAdminSessionToken, verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-session'
import { requireAdmin } from '@/lib/admin-route'
import { seedAccount, testStore } from '@/lib/test-accounts'
import { adminDb, type AdminCode } from '@/lib/admin-db'
process.env.ADMIN_SESSION_SECRET = 'admin-write-test-only-0123456789'
process.env.SCHOOL_SESSION_SECRET = 'school-write-test-only-0123456789'
testStore()
const admin=seedAccount('ADMIN-UPDATE-TEST')
async function request(body: unknown, authenticated=true, actor=admin) {
 const token=await createAdminSessionToken({codeId:actor.id,version:actor.session_version,orgId:actor.organization_id,orgName:'Admin',orgType:'admin'})
 return new NextRequest('http://localhost/api/admin/codes/update',{method:'POST',headers:{'Content-Type':'application/json',...(authenticated?{Cookie:`${ADMIN_SESSION_COOKIE}=${token}`}:{})},body:JSON.stringify(body)})
}
test('writes reject missing auth and invalid IDs or fields', async () => {
 assert.equal((await POST(await request({codeId:admin.id,isActive:false},false))).status,401)
 for(const body of [null,{codeId:'x&is_active=eq.true',newCode:'VALID'},{codeId:admin.id,isActive:'true'},{codeId:admin.id,newCode:'ABC'}]) assert.equal((await POST(await request(body))).status,400)
})

test('school codes can be changed to four memorable characters', async () => {
 const school=seedAccount('SCHOOL-SHORT-CODE-TEST','boseong')
 const response=await POST(await request({codeId:school.id,newCode:'1234'}))
 assert.equal(response.status,200)
 const [saved]=await adminDb<AdminCode[]>('access_codes',{id:`eq.${school.id}`})
 assert.equal(saved.code,'1234')
})

test('changing your admin code renews this browser session and revokes older cookies', async () => {
 const actor=seedAccount('ADMIN-SELF-ROTATION-TEST')
 const oldRequest=await request({codeId:actor.id,newCode:'adm1'},true,actor)
 const response=await POST(oldRequest)
 assert.equal(response.status,200)
 assert.match(response.headers.get('set-cookie')||'',/HttpOnly/)
 const newToken=response.cookies.get(ADMIN_SESSION_COOKIE)?.value
 assert.ok(newToken)
 assert.equal((await verifyAdminSessionToken(newToken))?.version,actor.session_version+1)
 const renewed=new NextRequest('http://localhost/api/admin/codes',{headers:{Cookie:`${ADMIN_SESSION_COOKIE}=${newToken}`}})
 assert.equal(await requireAdmin(renewed),null)
 assert.equal((await requireAdmin(oldRequest))?.status,401)
 const [saved]=await adminDb<AdminCode[]>('access_codes',{id:`eq.${actor.id}`})
 assert.equal(saved.code,'ADM1')
 const disabled=await POST(await request({codeId:saved.id,isActive:false},true,saved))
 assert.equal(disabled.status,200)
 assert.equal((await disabled.json()).requiresRelogin,true)
 assert.equal(disabled.cookies.get(ADMIN_SESSION_COOKIE)?.value,'')
 assert.equal((await requireAdmin(renewed))?.status,401)
})
test('editing a disabled school code reports its login status and explicit activation enables the new code', async () => {
 const school=seedAccount('DISABLED-SCHOOL-BEFORE','samil')
 await adminDb('access_codes',{id:`eq.${school.id}`},{method:'PATCH',body:JSON.stringify({is_active:false})})
 const login=(code:string)=>schoolLogin(new NextRequest('http://localhost/api/auth/school',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':'rotation-school'},body:JSON.stringify({code})}))
 const saved=await POST(await request({codeId:school.id,newCode:'SAM1'}))
 assert.equal(saved.status,200)
 assert.equal((await saved.json()).loginAvailable,false)
 const denied=await login('SAM1')
 assert.equal(denied.status,401)
 assert.match((await denied.json()).message,/비활성/)
 const enabled=await POST(await request({codeId:school.id,newCode:'SAM2',isActive:true}))
 assert.equal(enabled.status,200)
 assert.equal((await enabled.json()).loginAvailable,true)
 const accepted=await login('sam2')
 assert.equal(accepted.status,200)
 assert.equal((await accepted.json()).school.slug,'samil')
 assert.equal((await login('SAM1')).status,401)
})

test('code updates report missing/duplicate records and revoke old sessions', async () => {
 const school=seedAccount('SCHOOL-UPDATE-TEST','mirae')
 assert.equal((await POST(await request({codeId:'11111111-1111-4111-8111-111111111111',isActive:false}))).status,404)
 assert.equal((await POST(await request({codeId:school.id,newCode:admin.code}))).status,409)
 assert.equal((await POST(await request({codeId:school.id,newCode:'ROTATED-SCHOOL-ACCOUNT'}))).status,200)
 const [saved]=await adminDb<AdminCode[]>('access_codes',{id:`eq.${school.id}`})
 assert.equal(saved.session_version,school.session_version+1)
 await adminDb('access_codes',{id:`eq.${admin.id}`},{method:'PATCH',body:JSON.stringify({is_active:false})})
 assert.equal((await POST(await request({codeId:school.id,isActive:false}))).status,401)
})
