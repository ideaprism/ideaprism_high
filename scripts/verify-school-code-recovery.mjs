// Local browser regression. Credentials stay on this machine; temporary accounts are removed.
import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { DatabaseSync } from 'node:sqlite'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

config({ path: '.env.local', quiet: true })
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_DIR || 'playwright')
const base = 'http://127.0.0.1:3102'
const db = new DatabaseSync(process.env.LOCAL_AUTH_DB_PATH || 'private/accounts.sqlite')
db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000')
const inventions = JSON.parse(readFileSync('private/service-data/data/inventions.json', 'utf8'))
const report = { schools: [], workflow: [], consoleErrors: [] }
const temporary = []
const browser = await chromium.launch({ channel: 'msedge', headless: true })

function seed(name, school = null) {
  const orgId = randomUUID(), id = randomUUID(), code = 'REGRESSION-' + randomBytes(12).toString('hex').toUpperCase()
  db.exec('BEGIN IMMEDIATE')
  try {
    db.prepare('INSERT INTO partner_organizations(id,name,org_type,school_id,is_active) VALUES(?,?,?,?,1)').run(orgId, name, school ? 'school' : 'admin', school)
    db.prepare('INSERT INTO access_codes(id,code,organization_id,is_active) VALUES(?,?,?,?)').run(id, code, orgId, school ? 0 : 1)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  temporary.push({ id, orgId })
  return { id, orgId, code }
}
function shortCode() {
  let code
  do { code = randomBytes(2).toString('hex').toUpperCase() } while (db.prepare('SELECT id FROM access_codes WHERE code=?').get(code))
  return code
}
async function newPage(mobile = false) {
  const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {})
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort())
  const page = await context.newPage()
  page.on('pageerror', error => report.consoleErrors.push(error.message))
  return { page, context }
}
async function loginSchool(page, code, expected = 200) {
  await page.goto(base)
  await page.getByLabel('계정 코드', { exact: true }).fill(code.toLowerCase())
  const response = page.waitForResponse(response => response.url() === base + '/api/auth/school')
  await page.getByRole('button', { name: '들어가기' }).click()
  assert.equal((await response).status(), expected)
  if (expected === 200) await page.locator('html[data-school]').waitFor()
}
const api = (page, path, body) => page.evaluate(async ({ path, body }) => {
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  return { status: response.status, data: await response.json() }
}, { path, body })

try {
  // Verify the user's current codes, without rotating or deactivating any existing account.
  for (const school of ['mirae', 'boseong', 'samil', 'daegwang']) {
    const account = db.prepare("SELECT c.code FROM access_codes c JOIN partner_organizations o ON o.id=c.organization_id WHERE o.school_id=? AND o.org_type='school' AND c.is_active=1 AND o.is_active=1 ORDER BY c.created_at LIMIT 1").get(school)
    assert.ok(account, `No active account for ${school}`)
    const { page, context } = await newPage()
    await loginSchool(page, account.code)
    assert.equal(await page.locator('html').getAttribute('data-school'), school)
    const search = await api(page, '/api/search', {})
    const visible = inventions.filter(row => row.school_id === school && !row.exclude_from_demo)
    assert.equal(search.status, 200)
    assert.equal(search.data.totalCount, visible.length)
    assert.ok(search.data.allInventions.every(row => visible.some(source => source.id === row.id)))
    const own = visible.find(row => row.image_path)
    assert.ok(own)
    await page.goto(base + '/inventions/' + own.id)
    await page.getByText(`학생명: ${own.student_name} ·`, { exact: false }).waitFor()
    await page.waitForFunction(id => [...document.images].some(image => image.getAttribute('src')?.includes(`/api/inventions/${id}/image`) && image.complete && image.naturalWidth > 0), own.id)
    const other = inventions.find(row => row.school_id !== school && !row.exclude_from_demo && row.image_path)
    assert.equal((await api(page, '/api/inventions/' + other.id)).status, 404)
    const blockedImage = await page.evaluate(async id => (await fetch(`/api/inventions/${id}/image`)).status, other.id)
    assert.equal(blockedImage, 404)
    report.schools.push({ school, login: 200, visibleCount: visible.length, studentAndPhoto: true, otherSchoolDetail: 404, otherSchoolImage: 404 })
    await context.close()
  }

  const admin = seed('학교 로그인 회귀 검증 관리자')
  seed('학교 코드 변경 회귀 검증', 'samil')
  const { page: adminPage } = await newPage(true)
  const { page: schoolPage } = await newPage()
  await adminPage.goto(base + '/admin-login')
  await adminPage.getByLabel('관리자 코드').fill(admin.code)
  await adminPage.getByRole('button', { name: '관리자 로그인', exact: true }).click()
  await adminPage.waitForURL(base + '/admin')
  await adminPage.goto(base + '/admin/codes')
  const card = adminPage.locator('div.group').filter({ has: adminPage.getByRole('heading', { name: '학교 코드 변경 회귀 검증', exact: true }) })
  await card.getByText('로그인 불가', { exact: true }).waitFor()
  await card.getByText('비활성 계정입니다.', { exact: false }).waitFor()
  const firstCode = shortCode()
  await card.getByRole('button', { name: '코드 수정', exact: true }).click()
  await card.getByLabel('새 기관 코드').fill(firstCode)
  await card.getByRole('button', { name: '코드만 저장', exact: true }).click()
  await adminPage.getByRole('status').filter({ hasText: '현재 로그인할 수 없는 계정' }).waitFor()
  await loginSchool(schoolPage, firstCode, 401)
  await schoolPage.getByRole('alert').filter({ hasText: '비활성화된 학교 계정' }).waitFor()
  report.workflow.push('saving a disabled code preserves its disabled state and displays the reason')

  const secondCode = shortCode()
  await card.getByRole('button', { name: '코드 수정', exact: true }).click()
  await card.getByLabel('새 기관 코드').fill(secondCode)
  mkdirSync('private/school-code-validation', { recursive: true })
  await card.screenshot({ path: 'private/school-code-validation/save-and-activate-mobile.png' })
  await card.getByRole('button', { name: '저장하고 활성화', exact: true }).click()
  await card.getByText('로그인 가능', { exact: true }).waitFor()
  await loginSchool(schoolPage, secondCode)
  assert.equal(await schoolPage.locator('html').getAttribute('data-school'), 'samil')
  assert.equal((await api(schoolPage, '/api/auth/school', { code: firstCode })).status, 401)
  report.workflow.push('save and activate enables the new code; the old code is rejected')

  const thirdCode = shortCode()
  await card.getByRole('button', { name: '코드 수정', exact: true }).click()
  await card.getByLabel('새 기관 코드').fill(thirdCode)
  await card.getByRole('button', { name: '저장', exact: true }).click()
  await card.getByText(thirdCode, { exact: true }).waitFor()
  assert.equal((await api(schoolPage, '/api/search', {})).status, 401)
  await loginSchool(schoolPage, thirdCode)
  assert.equal((await api(schoolPage, '/api/search', {})).data.totalCount, 70)
  report.workflow.push('editing an active code revokes the previous session and the new code logs in')
  assert.deepEqual(report.consoleErrors, [])
  writeFileSync('docs/school-code-recovery-validation.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  // Remove only the records created by this run, so test accounts do not clutter the real admin UI.
  db.exec('BEGIN IMMEDIATE')
  try {
    for (const { id, orgId } of temporary) {
      db.prepare('DELETE FROM access_codes WHERE id=? AND organization_id=?').run(id, orgId)
      db.prepare('DELETE FROM partner_organizations WHERE id=? AND NOT EXISTS(SELECT 1 FROM access_codes WHERE organization_id=?)').run(orgId, orgId)
    }
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  db.close()
  await browser.close()
}
