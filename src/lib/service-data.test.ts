import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest } from 'next/server'
import { getSchoolInvention, getSchoolImage, searchSchoolInventions, type ServiceInvention } from './service-data'
import { GET as image } from '@/app/api/inventions/[id]/image/route'
import { schoolForToken } from './issued-school-session'
import { createSchoolSessionToken } from './school-token'
import { seedAccount, testStore } from './test-accounts'
import { adminDb } from './admin-db'
import { calculateFacetCounts, filterInventionsByFilters } from '@/hooks/useFilters'
import { templateFieldsToFormula } from '@/utils/opsme-keywords'
import { parseFormula } from './kipris-query'

testStore()
process.env.SCHOOL_SESSION_SECRET = 'private-package-test-secret-0123456789'
const root = resolve(process.env.SERVICE_DATA_DIR || 'private/service-data')
const rows = JSON.parse(readFileSync(resolve(root, 'data/inventions.json'), 'utf8')) as ServiceInvention[]
const schools = ['mirae', 'boseong', 'samil', 'daegwang'] as const

test('school search exposes actual student grades and award years with stable school year bounds', () => {
  for (const school of schools) {
    const result = searchSchoolInventions(school)
    assert.deepEqual(result.grades.map(item => item.name), ['1학년', '2학년', '3학년'])
    const own = rows.filter(row => row.school_id === school && !row.exclude_from_demo)
    assert.deepEqual(result.yearBounds, { min: Math.min(...own.map(row => row.award_year!)), max: Math.max(...own.map(row => row.award_year!)) })
    for (const card of result.allInventions) {
      const source = own.find(row => row.id === card.id)!
      assert.equal(card.grade_id, Number.parseInt(String(source.grade_year)))
      assert.equal(card.award_year, source.award_year)
    }
    assert.deepEqual(searchSchoolInventions(school, '존재하지않는검색어').yearBounds, result.yearBounds)
  }
})

test('every detail and original image is isolated across all school pairs', () => {
  assert.equal(rows.length, 325)
  assert.equal(rows.filter(row=>row.image_path).length, 324)
  for (const row of rows) for (const school of schools) {
    const allowed = row.school_id === school && !row.exclude_from_demo
    const detail = getSchoolInvention(school, row.id)
    assert.equal(Boolean(detail), allowed, `${row.id}/${school}`)
    if (allowed) {
      assert.equal(detail!.student_name, row.student_name)
      assert.equal(detail!.competition_name, '대한민국학생발명전시회')
      assert.equal(detail!.round, row.round)
      assert.equal(detail!.award_year, row.award_year)
      assert.equal(detail!.award, row.award)
      assert.equal(detail!.award_detail, row.award_detail)
      assert.equal('image_path' in detail!, false)
    }
    const photo = getSchoolImage(school, row.id)
    assert.equal(Boolean(photo), allowed && Boolean(row.image_path), `photo ${row.id}/${school}`)
    if (photo) assert.deepEqual(photo.bytes, readFileSync(resolve(root, row.image_path!)))
  }
  assert.equal(getSchoolInvention('mirae','sie-33-211'), null)
  const missing = rows.find(row=>row.id==='sie-33-257')!
  assert.equal(getSchoolInvention(missing.school_id, missing.id)!.drawing_url, null)
})
test('JSON search preserves natural language, Boolean, catalog filters and patent material', () => {
  for (const school of schools) {
    const all = searchSchoolInventions(school)
    assert.equal(all.allInventions.length, rows.filter(row=>row.school_id===school&&!row.exclude_from_demo).length)
    assert.ok(all.problemTags.some(tag=>tag.name==='위생'))
    assert.ok(all.problemTags.some(tag=>tag.name==='환경(오염)'))
    assert.ok(all.scamperTags.some(tag=>tag.name==='S(대체)'))
    const and = searchSchoolInventions(school, '우산*빗물').allInventions
    const or = searchSchoolInventions(school, '우산+빗물').allInventions
    assert.ok(and.every(row=>or.some(other=>other.id===row.id)))
    for (const tag of all.problemTags) {
      const filters={gradeIds:[],problemTags:[tag.name],scamperTags:[]}
      const filtered=filterInventionsByFilters(all.allInventions,filters)
      assert.equal(calculateFacetCounts(all.allInventions, filters).total, filtered.length)
      assert.ok(filtered.every(row=>row.problem_tag?.split(',').map(s=>s.trim()).includes(tag.name)))
    }
    for (const row of all.allInventions) {
      const detail=getSchoolInvention(school,row.id)!
      const formula=templateFieldsToFormula({ipc:detail.ipc||'',object:detail.keyword,problem:detail.search_terms.problem.join(', '),solution:'',method:detail.search_terms.method.join(', '),effect:detail.search_terms.effect.join(', ')},['O','M'])
      assert.ok(parseFormula(formula).groups.length>0, row.id)
    }
  }
  assert.ok(searchSchoolInventions('mirae','비 오는 날 교실 바닥').totalCount > 0)
})
test('photo handler independently rejects anonymous, foreign and excluded requests', async () => {
  const account=seedAccount('PHOTO-ACCOUNT-TEST','boseong')
  const token=await createSchoolSessionToken('boseong',account.id)
  const own=rows.find(row=>row.school_id==='boseong'&&row.image_path)!
  const other=rows.find(row=>row.school_id==='samil')!
  for(const [id,auth,status] of [[own.id,false,401],[own.id,true,200],[other.id,true,404],['sie-33-211',true,404]] as const) {
    const response=await image(new NextRequest(`http://localhost/api/inventions/${id}/image`,{headers:auth?{Cookie:`ideaprism_school_session=${token}`}:{}}),{params:Promise.resolve({id})})
    assert.equal(response.status,status)
    assert.equal(response.headers.get('cache-control'),'private, no-store')
  }
})
test('revocation, account school mismatch, expiry and organization disable deny existing cookies', async () => {
  const account=seedAccount('REVOCATION-ACCOUNT-TEST','mirae')
  const token=await createSchoolSessionToken('mirae',account.id)
  assert.ok(await schoolForToken(token))
  assert.equal(await schoolForToken(await createSchoolSessionToken('samil',account.id)),null)
  for (const patch of [{code:'ROTATED-ACCOUNT-TEST'},{is_active:false},{is_active:true}]) {
    await adminDb('access_codes',{id:`eq.${account.id}`},{method:'PATCH',body:JSON.stringify(patch)})
    assert.equal(await schoolForToken(token),null)
  }
  const expiring=seedAccount('EXPIRED-ACCOUNT-TEST','mirae')
  const expiryToken=await createSchoolSessionToken('mirae',expiring.id)
  await adminDb('access_codes',{id:`eq.${expiring.id}`},{method:'PATCH',body:JSON.stringify({expires_at:'2000-01-01'})})
  assert.equal(await schoolForToken(expiryToken),null)
  const org=seedAccount('ORG-DISABLED-ACCOUNT','mirae')
  const orgToken=await createSchoolSessionToken('mirae',org.id)
  await adminDb('partner_organizations',{id:`eq.${org.organization_id}`},{method:'PATCH',body:JSON.stringify({is_active:false})})
  assert.equal(await schoolForToken(orgToken),null)
})
