// Production verification: credentials are read locally and sent only to this project's service.
import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes, createHash } from 'node:crypto'
import { resolve } from 'node:path'
config({ path: '.env.local', quiet: true })
const base = 'https://ideaprism-high.vercel.app'
const db = new DatabaseSync(process.env.LOCAL_AUTH_DB_PATH || 'private/accounts.sqlite', { readOnly: true })
const accounts = db.prepare('SELECT c.*, o.org_type, o.school_id FROM access_codes c JOIN partner_organizations o ON o.id=c.organization_id WHERE c.is_active=1 AND o.is_active=1 ORDER BY c.created_at').all()
db.close()
const rows = JSON.parse(readFileSync('private/service-data/data/inventions.json', 'utf8'))
const report = { base, schools: [], checks: [], patent: null }
const cookie = response => response.headers.get('set-cookie')?.split(';')[0] || ''
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function request(path, { body, cookie: session = '', status = 200 } = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Origin: base, ...(session ? { Cookie: session } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  assert.equal(response.status, status, `${path}: expected HTTP ${status}, got ${response.status}`)
  return response
}
const json = async (path, options) => (await request(path, options)).json()
let adminCookie = '', temporaryId
try {
  await request('/')
  for (const path of ['/api/search', '/api/inventions/sie-28-009', '/api/inventions/sie-28-009/image']) {
    await request(path, { status: 401, ...(path === '/api/search' ? { body: {} } : {}) })
  }
  for (const path of ['/data/inventions.json', '/private/service-data/data/inventions.json', '/private/accounts.sqlite', '/server-data/service-data.enc', '/server-data/accounts-seed.enc']) await request(path, { status: 404 })
  report.checks.push('anonymous data requests and direct private-file paths are denied')
  const cookies = {}, samples = {}
  for (const school of ['mirae', 'boseong', 'samil', 'daegwang']) {
    const account = accounts.find(account => account.school_id === school)
    assert.ok(account, `No active local account for ${school}`)
    const login = await request('/api/auth/school', { body: { code: account.code.toLowerCase() } })
    assert.equal((await login.json()).school.slug, school)
    const session = cookies[school] = cookie(login)
    assert.ok(session)
    const search = await json('/api/search', { cookie: session, body: { keyword: '', limit: 500, school_id: 'foreign' } })
    const expected = rows.filter(row => row.school_id === school && !row.exclude_from_demo)
    assert.equal(search.totalCount, expected.length)
    assert.ok(search.allInventions.every(row => row.school_id === school && !('student_name' in row) && !('image_path' in row)))
    samples[school] = expected.find(row => row.image_path)
    const searched = await json('/api/search', { cookie: session, body: { keyword: '우산', limit: 500 } })
    assert.ok(searched.allInventions.every(row => row.school_id === school))
    report.schools.push({ school, login: 200, visibleCount: search.totalCount, keywordCount: searched.totalCount })
  }
  for (const [school, session] of Object.entries(cookies)) for (const [owner, source] of Object.entries(samples)) {
    const status = school === owner ? 200 : 404
    const detail = await request('/api/inventions/' + source.id, { cookie: session, status })
    const photo = await request('/api/inventions/' + source.id + '/image', { cookie: session, status })
    if (status === 200) {
      const data = await detail.json()
      assert.equal(data.student_name, source.student_name)
      assert.equal(data.award_year, source.award_year)
      assert.equal(data.award, source.award)
      assert.equal(data.award_detail, source.award_detail)
      assert.equal(hash(Buffer.from(await photo.arrayBuffer())), hash(readFileSync(resolve('private/service-data', source.image_path))))
      assert.ok(photo.headers.get('cache-control')?.includes('no-store'))
    }
  }
  report.checks.push('4x4 school detail/photo matrix; student and award fields; original photo hashes')
  for (const suffix of ['', '/image']) await request('/api/inventions/sie-33-211' + suffix, { cookie: cookies.mirae, status: 404 })
  assert.equal((await json('/api/inventions/sie-33-257', { cookie: cookies.samil })).drawing_url, null)
  await request('/api/inventions/sie-33-257/image', { cookie: cookies.samil, status: 404 })
  report.checks.push('excluded invention and missing-photo handling preserved')
  const admin = accounts.find(account => ['admin', 'master_admin', 'super_admin'].includes(account.org_type))
  assert.ok(admin)
  adminCookie = cookie(await request('/api/auth/verify-code', { body: { code: admin.code } }))
  assert.ok(adminCookie)
  const initial = await json('/api/admin/overview', { cookie: adminCookie })
  assert.equal(initial.success, true)
  const code = 'VERIFY-' + randomBytes(12).toString('hex').toUpperCase()
  const body = { schoolId: 'mirae', orgName: '배포 검증 전용 · 사용하지 않음', customCode: code }
  const issued = await json('/api/admin/codes/direct-issue', { cookie: adminCookie, body })
  temporaryId = issued.data.code.id
  const beforeDuplicate = await json('/api/admin/overview', { cookie: adminCookie })
  await request('/api/admin/codes/direct-issue', { cookie: adminCookie, body, status: 409 })
  const afterDuplicate = await json('/api/admin/overview', { cookie: adminCookie })
  assert.equal(afterDuplicate.organizations, beforeDuplicate.organizations)
  assert.equal(afterDuplicate.codes, beforeDuplicate.codes)
  const oldCookie = cookie(await request('/api/auth/school', { body: { code } }))
  const replacement = 'V' + randomBytes(5).toString('hex').toUpperCase()
  const saved = await json('/api/admin/codes/update', { cookie: adminCookie, body: { codeId: temporaryId, newCode: replacement } })
  assert.equal(saved.loginAvailable, true)
  await request('/api/auth/school', { body: { code }, status: 401 })
  await request('/api/search', { cookie: oldCookie, body: {}, status: 401 })
  const newCookie = cookie(await request('/api/auth/school', { body: { code: replacement.toLowerCase() } }))
  assert.equal((await json('/api/search', { cookie: newCookie, body: {} })).totalCount, 167)
  await json('/api/admin/codes/update', { cookie: adminCookie, body: { codeId: temporaryId, isActive: false } })
  await request('/api/auth/school', { body: { code: replacement }, status: 401 })
  await request('/api/search', { cookie: newCookie, body: {}, status: 401 })
  report.checks.push('Neon account issuance; duplicate rollback; code change persists; old code/session revoked; disable denies login')
  const patent = await request('/api/kipris/search?q=' + encodeURIComponent('우산') + '&inventionId=' + samples.mirae.id, { cookie: cookies.mirae })
  const patentData = await patent.json()
  assert.equal(patentData.success, true)
  report.patent = { status: patent.status, success: true, totalCount: patentData.totalCount }
  writeFileSync('docs/deployment-validation.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (temporaryId && adminCookie) await request('/api/admin/codes/update', { cookie: adminCookie, body: { codeId: temporaryId, isActive: false } })
}
