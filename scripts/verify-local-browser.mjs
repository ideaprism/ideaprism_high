// Runs the browser and credential handling on this machine; no browser plugin or remote driver.
import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import { cleanupVerificationAccount } from './cleanup-verification-account.mjs'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_DIR || 'playwright')
const base = process.env.LOCAL_VERIFY_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw Error('Local browser verification only')
const adminCode = readFileSync('private/initial-admin-code.txt','utf8').match(/^Code: (.+)$/m)[1].trim()
const rows = JSON.parse(readFileSync('private/service-data/data/inventions.json','utf8'))
const credential = 'UI-' + randomBytes(16).toString('hex').toUpperCase()
const browser = await chromium.launch({ channel:'msedge', headless:true })
const adminContext = await browser.newContext()
const schoolContext = await browser.newContext({ viewport:{width:1440,height:1000} })
const report = { checks:[], patentRequestValid:false, patentStatus:null, consoleErrors:[] }
let accountId
let missingPhotoAccountId
mkdirSync('private/browser-validation',{recursive:true})
const admin = await adminContext.newPage()
const page = await schoolContext.newPage()
const adminApi = (path, body) => admin.evaluate(async ({path,body}) => {
  const response=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})})
  return {status:response.status,data:await response.json()}
},{path,body})
// Browser credentials and page contents only travel to the local app.
for(const context of [adminContext,schoolContext]) await context.route('**/*',route=> {
  const url = new URL(route.request().url())
  return url.origin === base ? route.continue() : route.abort()
})
page.on('pageerror', error=>report.consoleErrors.push(error.message))
try {
  await admin.goto(base+'/admin-login')
  await admin.getByLabel('관리자 코드').fill(adminCode)
  const loginResponse = admin.waitForResponse(r=>r.url().endsWith('/api/auth/verify-code'))
  await admin.getByRole('button',{name:'관리자 로그인',exact:true}).click()
  assert.equal((await loginResponse).status(), 200, 'administrator browser login response')
  assert.ok((await adminContext.cookies()).some(cookie=>cookie.name==='ideaprism_admin_session'), 'administrator cookie stored by local browser')
  await admin.waitForURL(base+'/admin')
  await admin.goto(base+'/admin/codes')
  await admin.getByRole('button',{name:'새 코드 직접 발급'}).click()
  const dialog=admin.getByRole('dialog')
  await dialog.getByLabel('소속 학교').selectOption('mirae')
  await dialog.getByLabel('계정 이름').fill('로컬 브라우저 검증')
  await dialog.getByLabel('지정 코드',{exact:false}).fill(credential)
  await dialog.getByRole('button',{name:'학교 계정 발급',exact:true}).click()
  await dialog.waitFor({state:'hidden'})
  const codes=await adminApi('/api/admin/codes')
  assert.equal(codes.status,200)
  accountId=codes.data.data.find(code=>code.code===credential).id
  report.checks.push('administrator UI issues a school-bound account')
  await page.goto(base)
  await page.getByLabel('계정 코드',{exact:true}).fill(credential)
  await page.getByRole('button',{name:'들어가기'}).click()
  await page.getByRole('heading',{name:'미래산업과학고등학교',exact:true,level:1}).waitFor()
  report.checks.push('issued code logs into the associated school')
  const allResponse=page.waitForResponse(r=>r.url().endsWith('/api/search')&&r.status()===200)
  await page.goto(base+'/search')
  const all=await (await allResponse).json()
  assert.equal(all.totalCount,167)
  await page.getByRole('button',{name:/^위생 \(/}).click()
  await page.getByRole('button',{name:/^S\(대체\)/}).click()
  await page.screenshot({path:'private/browser-validation/filters.png',fullPage:true})
  report.checks.push('catalog hygiene/SCAMPER filters are selectable')
  await page.goto(base+'/search')
  await page.getByRole('button',{name:/^위생 \(/}).waitFor()
  await page.getByPlaceholder('어떤 발명품을 찾고 계신가요?').fill('우산')
  const searchResponse=page.waitForResponse(r=>r.url().endsWith('/api/search')&&r.status()===200)
  await page.getByRole('button',{name:'검색',exact:true}).click()
  const searched=await (await searchResponse).json()
  assert.ok(searched.totalCount>0)
  const row=searched.allInventions.find(row=>row.drawing_url)
  const source=rows.find(item=>item.id===row.id)
  await page.getByRole('heading',{name:row.simple_title||row.original_title,exact:true}).click()
  await page.getByText(source.student_name,{exact:true}).waitFor()
  assert.equal((await page.locator('body').innerText()).includes('학년학년'),false)
  await page.waitForFunction(src=>[...document.images].some(image=>image.getAttribute('src')===src&&image.complete&&image.naturalWidth>0),row.drawing_url)
  await page.screenshot({path:'private/browser-validation/student-photo.png',fullPage:true})
  report.checks.push('keyword search, detail student name and original photo render')
  const patentResponse=page.waitForResponse(r=>r.url().includes('/api/kipris/search?'),{timeout:60000})
  await page.getByRole('button',{name:'특허 검색',exact:true}).click()
  const patent=await patentResponse
  const url=new URL(patent.url())
  assert.equal(url.searchParams.get('inventionId'),row.id)
  assert.ok(url.searchParams.get('q').replace(/IPC=\[[^\]]*\]/,'').replace(/[*\s]/g,'').length>0)
  report.patentRequestValid=true
  report.patentStatus=patent.status()
  assert.equal(patent.status(),200)
  await page.screenshot({path:'private/browser-validation/patent.png',fullPage:true})
  report.checks.push('patent auto-search sends package terms on its first request')
  const missing=rows.find(row=>row.id==='sie-33-257')
  const missingCredential='UI-'+randomBytes(16).toString('hex').toUpperCase()
  const missingIssued=await adminApi('/api/admin/codes/direct-issue',{orgName:'로컬 사진 누락 검증',schoolId:missing.school_id,customCode:missingCredential})
  assert.equal(missingIssued.status,200)
  missingPhotoAccountId=missingIssued.data.data.code.id
  await page.evaluate(()=>fetch('/api/auth/logout',{method:'POST'}))
  await page.goto(base)
  await page.getByLabel('계정 코드',{exact:true}).fill(missingCredential)
  const missingLogin=page.waitForResponse(r=>r.url().endsWith('/api/auth/school')&&r.status()===200)
  await page.getByRole('button',{name:'들어가기'}).click()
  await missingLogin
  await page.waitForLoadState('networkidle')
  await page.goto(base+'/inventions/'+missing.id)
  await page.getByText('이미지가 없습니다',{exact:true}).waitFor()
  assert.ok((await page.locator('body').innerText()).includes(missing.student_name))
  await page.setViewportSize({width:390,height:844})
  await page.screenshot({path:'private/browser-validation/missing-photo-mobile.png',fullPage:true})
  report.checks.push('missing-photo fallback and student name render at mobile size')
  const disabled=await adminApi('/api/admin/codes/update',{codeId:missingPhotoAccountId,isActive:false})
  assert.equal(disabled.status,200)
  await page.goto(base+'/search')
  await page.getByLabel('계정 코드',{exact:true}).waitFor()
  report.checks.push('disabled account returns to login on page access')
  assert.deepEqual(report.consoleErrors,[])
  writeFileSync('docs/local-data-browser-results.json',JSON.stringify(report,null,2)+'\n')
  console.log(JSON.stringify(report,null,2))
} catch(error) {
  console.error('Browser failure location:',new URL(admin.url()).pathname, new URL(page.url()).pathname)
  console.error('Admin alert:',await admin.getByRole('alert').allTextContents())
  await admin.screenshot({path:'private/browser-validation/admin-failure.png',fullPage:true}).catch(()=>{})
  await page.screenshot({path:'private/browser-validation/failure.png',fullPage:true}).catch(()=>{})
  throw error
} finally {
  if(!accountId) {
    const codes=await adminApi('/api/admin/codes').catch(()=>null)
    accountId=codes?.data?.data?.find(code=>code.code===credential)?.id
  }
  if(accountId) cleanupVerificationAccount(accountId)
  if(missingPhotoAccountId) cleanupVerificationAccount(missingPhotoAccountId)
  await browser.close()
}
