import assert from 'node:assert/strict'
import test from 'node:test'
import { findSchoolSlugByCode, normalizeSchoolCode } from './school-access'

const CODES = {
  daegwang: 'DAEGWANG',
  mirae: 'MIRAE',
  samil: 'SAMIL',
  boseong: 'BOSEONG',
}

test('normalizeSchoolCode trims, uppercases, and drops spaces and hyphens', () => {
  assert.equal(normalizeSchoolCode('  dae-gwang '), 'DAEGWANG')
})

test('findSchoolSlugByCode matches a school regardless of case', () => {
  assert.equal(findSchoolSlugByCode('mirae', CODES), 'mirae')
  assert.equal(findSchoolSlugByCode('Bo-Seong', CODES), 'boseong')
})

test('findSchoolSlugByCode rejects an empty or unknown code', () => {
  assert.equal(findSchoolSlugByCode('   ', CODES), null)
  assert.equal(findSchoolSlugByCode('UNKNOWN', CODES), null)
})
