import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { cleanupVerificationAccount } from './cleanup-verification-account.mjs'

const base = process.env.LOCAL_VERIFY_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw Error('Local verification only')
const root = resolve(process.env.SERVICE_DATA_DIR || 'private/service-data')
const rows = JSON.parse(readFileSync(resolve(root, 'data/inventions.json'), 'utf8'))
const adminCode = readFileSync('private/initial-admin-code.txt','utf8').match(/^Code: (.+)$/m)?.[1].trim()
assert.ok(adminCode)
const report = { base, schoolCounts: {}, checks: [], patent: null }
const accounts = [], cookies = {}, sample = {}
let adminCookie = ''
async function request(path, { body, cookie = '', status = 200 } = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Cookie: cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  assert.equal(response.status, status, path)
  return response
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
try {
  const login = await request('/api/auth/verify-code', { body: { code: adminCode } })
  adminCookie = login.headers.get('set-cookie').split(';')[0]
  for (const school of ['mirae','boseong','samil','daegwang']) {
    const credential = 'VERIFY-' + randomBytes(16).toString('hex').toUpperCase()
    const issued = await (await request('/api/admin/codes/direct-issue', { cookie: adminCookie,
      body: { orgName: '로컬 검증 ' + school, schoolId: school, customCode: credential } })).json()
    accounts.push({ school, id: issued.data.code.id, code: credential })
    const login = await request('/api/auth/school', { body: { code: credential } })
    const cookie = cookies[school] = login.headers.get('set-cookie').split(';')[0]
    assert.match(login.headers.get('set-cookie'), /HttpOnly/)
    const response = await request('/api/search', { cookie, body: { keyword: '', limit:500, school_id:'foreign' } })
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    const all = await response.json()
    const expected = rows.filter(row=>row.school_id===school&&!row.exclude_from_demo)
    assert.equal(all.totalCount, expected.length)
    assert.ok(all.allInventions.every(row=>row.school_id===school && !('student_name' in row) && !('image_path' in row)))
    report.schoolCounts[school] = all.totalCount
    sample[school] = expected.find(row=>row.image_path)
    for (const query of ['우산','우산+빗물','우산*빗물','비 오는 날 교실 바닥']) {
      const result = await (await request('/api/search', { cookie, body:{keyword:query,limit:500} })).json()
      assert.ok(result.allInventions.every(row=>row.school_id===school))
    }
  }
  for (const [school, cookie] of Object.entries(cookies)) for (const [owner, row] of Object.entries(sample)) {
    const status = school === owner ? 200 : 404
    const response = await request('/api/inventions/'+row.id, {cookie,status})
    const photo = await request('/api/inventions/'+row.id+'/image', {cookie,status})
    if (status===200) {
      const detail=await response.json()
      assert.equal(detail.student_name,row.student_name)
      assert.equal(detail.school_name,row.school_name)
      assert.equal('image_path' in detail,false)
      assert.equal(hash(Buffer.from(await photo.arrayBuffer())),hash(readFileSync(resolve(root,row.image_path))))
    }
  }
  report.checks.push('4x4 HTTP detail/photo access matrix, student names, original photo hashes')
  for (const path of ['/api/search','/api/inventions/'+sample.mirae.id,'/api/inventions/'+sample.mirae.id+'/image','/api/kipris/search?q=우산']) {
    await request(path,{status:401,...(path==='/api/search'?{body:{keyword:'우산'}}:{})})
  }
  for (const path of ['/data/inventions.json','/data/catalog.json','/private/service-data/data/inventions.json','/'+sample.mirae.image_path,'/private/service-data/'+sample.mirae.image_path]) await request(path,{status:404})
  const optimizer=await fetch(base+'/_next/image?url='+encodeURIComponent('/api/inventions/'+sample.mirae.id+'/image')+'&w=640&q=75')
  assert.ok([400,401,404].includes(optimizer.status),'optimizer must not bypass auth')
  report.checks.push('anonymous API, raw JSON/photos, private paths and Next image optimizer denied')
  for (const suffix of ['', '/image']) await request('/api/inventions/sie-33-211'+suffix,{cookie:cookies.mirae,status:404})
  const missing=rows.find(row=>row.id==='sie-33-257')
  const missingDetail=await (await request('/api/inventions/'+missing.id,{cookie:cookies[missing.school_id]})).json()
  assert.equal(missingDetail.drawing_url,null)
  await request('/api/inventions/'+missing.id+'/image',{cookie:cookies[missing.school_id],status:404})
  await request('/api/inventions/'+sample.boseong.id,{cookie:cookies.mirae,status:404})
  await request('/inventions/'+sample.boseong.id,{cookie:cookies.mirae,status:404})
  report.checks.push('excluded record denied, missing photo remains null, foreign server-rendered detail denied')
  await request('/api/kipris/search?q=우산&inventionId='+sample.boseong.id,{cookie:cookies.mirae,status:404})
  const patentResponse=await fetch(base+'/api/kipris/search?q='+encodeURIComponent('우산')+'&inventionId='+sample.mirae.id,{headers:{Cookie:cookies.mirae}})
  const patent=await patentResponse.json()
  report.patent={status:patentResponse.status,success:patent.success,totalCount:patent.totalCount,error:patent.error||null}
  // Verify code rotation and disable/re-enable never revive an earlier cookie.
  const account=accounts[0]
  await request('/api/admin/codes/update',{cookie:adminCookie,body:{codeId:account.id,newCode:'ROTATED-'+randomBytes(16).toString('hex').toUpperCase()}})
  await request('/api/search',{cookie:cookies.mirae,body:{keyword:'우산'},status:401})
  for (const isActive of [false,true]) {
    await request('/api/admin/codes/update',{cookie:adminCookie,body:{codeId:accounts[1].id,isActive}})
    await request('/api/search',{cookie:cookies.boseong,body:{keyword:'우산'},status:401})
  }
  report.checks.push('issued-account rotation and disable/re-enable revoke previous cookies')
  console.log(JSON.stringify(report,null,2))
  writeFileSync('docs/local-data-api-results.json',JSON.stringify(report,null,2)+'\n')
} finally {
  for (const account of accounts) {
    cleanupVerificationAccount(account.id)
  }
}
