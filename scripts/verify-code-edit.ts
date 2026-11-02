// Local-only browser regression. Uses disposable accounts; never changes the owner's administrator.
import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { authTransaction, localAdminQuery } from '../src/lib/local-auth-store'
import { cleanupVerificationAccount } from './cleanup-verification-account.mjs'
const loadModule = createRequire(resolve('package.json'))
const { chromium } = loadModule(process.env.PLAYWRIGHT_MODULE_DIR || 'playwright')
config({ path:'.env.local', quiet:true })
async function main() {
const base='http://127.0.0.1:3102'
const originalCode='EDIT-TEST-'+randomBytes(16).toString('hex').toUpperCase()
const accountName='코드 수정 UI 검증 '+randomBytes(4).toString('hex')
function unusedShortCode() {
  let code: string
  do { code=randomBytes(2).toString('hex').toUpperCase() } while (localAdminQuery('access_codes',{code:`eq.${code}`}).length)
  return code
}
const shortCode=unusedShortCode()
const temporary=authTransaction(()=>{
  const [org]=localAdminQuery('partner_organizations',{}, {method:'POST',body:JSON.stringify({name:accountName,org_type:'admin',is_active:true})})
  const [code]=localAdminQuery('access_codes',{}, {method:'POST',body:JSON.stringify({code:originalCode,organization_id:org.id,label:'임시 UI 검증',is_active:true})})
  return {org,code}
})
const browser=await chromium.launch({channel:'msedge',headless:true})
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
const page=await context.newPage()
const errors:string[]=[]
page.on('pageerror',(error:Error)=>errors.push(error.message))
await context.route('**/*',(route:{request:()=>{url:()=>string};continue:()=>Promise<void>;abort:()=>Promise<void>})=>new URL(route.request().url()).origin===base?route.continue():route.abort())
let issuedId:string|undefined
try {
  await page.goto(base+'/admin-login')
  await page.getByLabel('관리자 코드').fill(originalCode)
  await page.getByRole('button',{name:'관리자 로그인',exact:true}).click()
  await page.waitForURL(base+'/admin')
  const oldCookie=(await context.cookies()).find((cookie:{name:string})=>cookie.name==='ideaprism_admin_session')
  assert.ok(oldCookie)
  await page.goto(base+'/admin/codes')
  const card=page.locator('div.group').filter({has:page.getByRole('heading',{name:accountName,exact:true})})
  const edit=card.getByRole('button',{name:'코드 수정',exact:true})
  await edit.waitFor()
  assert.equal(await edit.evaluate((element:HTMLElement)=>getComputedStyle(element).opacity),'1')
  await edit.click()
  await card.getByLabel('새 기관 코드').fill(shortCode)
  await card.getByRole('button',{name:'저장',exact:true}).click()
  await page.getByRole('status').filter({hasText:'코드가 저장되었고 로그인할 수 있습니다.'}).waitFor()
  await card.getByText(shortCode,{exact:true}).waitFor()
  const current=await page.evaluate(async()=> (await fetch('/api/admin/overview')).status)
  assert.equal(current,200)
  const old=await fetch(base+'/api/admin/codes',{headers:{Cookie:`${oldCookie.name}=${oldCookie.value}`}})
  assert.equal(old.status,401)
  mkdirSync('private/code-edit-validation',{recursive:true})
  await card.screenshot({path:'private/code-edit-validation/mobile-admin-edit.png'})
  // Log out and verify the newly chosen short code in a fresh login.
  await page.evaluate(()=>fetch('/api/auth/logout',{method:'POST'}))
  await page.goto(base+'/admin-login')
  await page.getByLabel('관리자 코드').fill(shortCode)
  await page.getByRole('button',{name:'관리자 로그인',exact:true}).click()
  await page.waitForURL(base+'/admin')
  await page.goto(base+'/admin/codes')
  await page.getByRole('button',{name:'새 코드 직접 발급'}).click()
  const dialog=page.getByRole('dialog')
  const schoolCode=unusedShortCode()
  await dialog.getByLabel('소속 학교').selectOption('mirae')
  await dialog.getByLabel('계정 이름',{exact:true}).fill('짧은 학교 코드 검증')
  await dialog.getByLabel('지정 코드',{exact:false}).fill(schoolCode)
  const issuedResponse=page.waitForResponse((response:{url:()=>string})=>response.url().endsWith('/api/admin/codes/direct-issue'))
  await dialog.getByRole('button',{name:'학교 계정 발급',exact:true}).click()
  const issued=await (await issuedResponse).json()
  assert.equal(issued.success,true)
  issuedId=issued.data.code.id
  const login=await fetch(base+'/api/auth/school',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:schoolCode})})
  assert.equal(login.status,200)
  assert.deepEqual(errors,[])
  const report={checks:['mobile edit button visible without hover','active administrator code edited to 4 characters','current session renewed; old cookie rejected','new short administrator code logs in','four-character school code issued through UI and login succeeds'],consoleErrors:errors,ownerAdministratorChanged:false}
  writeFileSync('docs/code-edit-validation.json',JSON.stringify(report,null,2)+'\n')
  console.log(JSON.stringify(report,null,2))
} finally {
  cleanupVerificationAccount(String(temporary.code.id))
  if(issuedId) cleanupVerificationAccount(issuedId)
  await browser.close()
}
}
main().catch(error=>{ console.error(error); process.exitCode=1 })
