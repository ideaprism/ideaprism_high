import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFacetCounts, filterInventionsByFilters } from './useFilters';
import type { InventionRaw } from '@/types/search';

const inv = (id: string, grade_id: number, problem_tag: string, scamper: string): InventionRaw => ({
  id,
  original_title: id,
  simple_title: id,
  drawing_url: null,
  simple_summary: null,
  grade_id,
  category_id: null,
  problem_tag,
  scamper,
});

const data = [
  inv('1', 1, '안전(위험)', 'S'),
  inv('2', 1, '편의(불편)', 'C'),
  inv('3', 2, '안전(위험), 편의(불편)', 'S, C'),
  inv('4', 2, '안전(위험)', 'S'),
];

test('필터 없으면 전체 기준 집계', () => {
  const f = calculateFacetCounts(data);
  assert.deepEqual(f.grades, { 1: 2, 2: 2 });
  assert.deepEqual(f.problems, { '안전(위험)': 3, '편의(불편)': 2 });
});

test('faceted count: 학교급을 고르면 다른 그룹 숫자만 줄고 학교급 숫자는 유지', () => {
  const filters = { gradeIds: [2], problemTags: [], scamperTags: [] };
  const f = calculateFacetCounts(data, filters);
  assert.deepEqual(f.grades, { 1: 2, 2: 2 });
  assert.deepEqual(f.problems, { '안전(위험)': 2, '편의(불편)': 1 });
  assert.deepEqual(f.scampers, { S: 2, C: 1 });
});

test('버튼 숫자 = 그 버튼을 눌렀을 때 남는 건수', () => {
  const filters = { gradeIds: [2], problemTags: [], scamperTags: [] };
  const f = calculateFacetCounts(data, filters);
  const after = filterInventionsByFilters(data, { ...filters, problemTags: ['편의(불편)'] });
  assert.equal(f.problems['편의(불편)'], after.length);
});

test('전체 숫자: 세 그룹 모두 지금 선택된 필터를 다 적용한 결과 수', () => {
  assert.equal(calculateFacetCounts(data).total, 4);
  assert.equal(calculateFacetCounts(data, { gradeIds: [2], problemTags: [], scamperTags: [] }).total, 2);
  // 문제유형만 골라도 '전체'는 그 결과 수 (예전엔 문제유형 '전체'가 4로 남았음)
  assert.equal(calculateFacetCounts(data, { gradeIds: [], problemTags: ['편의(불편)'], scamperTags: [] }).total, 2);
  // 같은 그룹 여러 개 선택: 둘 다 해당하는 발명은 한 번만 (안전 3 + 편의 2 ≠ 5)
  assert.equal(calculateFacetCounts(data, { gradeIds: [], problemTags: ['안전(위험)', '편의(불편)'], scamperTags: [] }).total, 4);
  assert.equal(calculateFacetCounts(data, { gradeIds: [1, 2], problemTags: ['편의(불편)'], scamperTags: ['C'] }).total, 2);
});
