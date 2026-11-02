import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeQuery,
  buildTermsFilter,
  buildBooleanFilter,
  rankInventions,
  tokenizePlainQuery,
  SEARCH_COLUMNS,
} from './search-query';
import { parseSearchQuery, sanitizeTerm } from './search-parser';

const COLS = ['a', 'b'];

test('문장은 불용어·1글자·조사를 걸러 핵심 단어만 남긴다', () => {
  assert.deepEqual(tokenizePlainQuery('비 오는 날 교실 바닥 젖음'), ['빗물', '교실', '바닥', '젖음']);
  assert.deepEqual(tokenizePlainQuery('교실에서 바닥이 젖는 문제'), ['교실', '바닥', '젖는']);
  assert.deepEqual(tokenizePlainQuery('급식 잔반'), ['급식', '잔반']);
  assert.deepEqual(tokenizePlainQuery('의자'), ['의자']); // '자'로 끝나도 조사 아님
  assert.deepEqual(tokenizePlainQuery('우산'), ['우산']);
  assert.deepEqual(tokenizePlainQuery('비'), ['비']); // 1글자만 입력하면 유지
});

test('연산자가 없으면 plain, 있으면 boolean 모드', () => {
  assert.equal(analyzeQuery('자전거 안전').mode, 'plain');
  const b = analyzeQuery('우산*(서랍+빗물)');
  assert.equal(b.mode, 'boolean');
  assert.deepEqual(b.groups.flat().sort(), ['빗물', '서랍', '우산'].sort());
});

test('sanitizeTerm은 PostgREST 필터 구문 문자를 제거한다', () => {
  assert.equal(sanitizeTerm('우산,id.eq.1'), '우산id eq 1');
  assert.equal(sanitizeTerm('a(b)c%_*"\''), 'abc');
  assert.equal(sanitizeTerm('   '), '');
});

test('여러 단어 all 필터는 단어별 OR 묶음을 AND로 감싼다', () => {
  assert.equal(
    buildTermsFilter([['x'], ['y']], COLS, 'all'),
    'and(or(a.ilike.%x%,b.ilike.%x%),or(a.ilike.%y%,b.ilike.%y%))'
  );
  assert.equal(
    buildTermsFilter([['x'], ['y']], COLS, 'any'),
    'or(a.ilike.%x%,b.ilike.%x%),or(a.ilike.%y%,b.ilike.%y%)'
  );
  assert.equal(buildTermsFilter([['x']], COLS, 'any'), 'a.ilike.%x%,b.ilike.%x%');
});

test('Boolean 식 AND는 "모든 컬럼이 모든 단어 포함"이 아니라 단어별 OR 묶음의 AND', () => {
  // 예전 버그: and(a.x,b.x,a.y,b.y) → 모든 컬럼이 두 단어를 다 포함해야 매칭 → 사실상 0건
  const node = parseSearchQuery('x*y')!;
  assert.equal(buildBooleanFilter(node, COLS), 'and(or(a.ilike.%x%,b.ilike.%x%),or(a.ilike.%y%,b.ilike.%y%))');
  const node2 = parseSearchQuery('x*(y+z)')!;
  assert.equal(
    buildBooleanFilter(node2, COLS),
    'and(or(a.ilike.%x%,b.ilike.%x%),or(or(a.ilike.%y%,b.ilike.%y%),or(a.ilike.%z%,b.ilike.%z%)))'
  );
});

test('검색 컬럼 기본값', () => {
  assert.deepEqual([...SEARCH_COLUMNS], ['original_title', 'simple_title', 'simple_summary', 'detailed_summary']);
});

test("'우산': 제목에 우산이 있는 발명이 본문에만 있는 발명보다 위", () => {
  const items = [
    { id: '1', simple_title: '바퀴 베어링으로 훌라후프 회전을 돕는 장치', detailed_summary: '우산 살 구조에서 착안' },
    { id: '2', simple_title: '자립형 위생 건조 대걸레', simple_summary: '우산처럼 펼쳐 말린다' },
    { id: '3', simple_title: '길이별 분류 가능한 서랍식 3단 우산꽂이 겸 화분대' },
    { id: '4', simple_title: '우산', original_title: '우산' },
    { id: '5', simple_title: '우산 물기 제거 장치', simple_summary: '젖은 우산의 물기를 털어낸다' },
  ];
  const ranked = rankInventions(items, '우산', ['우산']).map((x) => x.id);
  assert.equal(ranked[0], '4'); // 제목 완전 일치
  assert.ok(ranked.indexOf('5') < ranked.indexOf('1'));
  assert.ok(ranked.indexOf('3') < ranked.indexOf('1'));
  assert.ok(ranked.indexOf('3') < ranked.indexOf('2'));
  assert.deepEqual(ranked.slice(-2).sort(), ['1', '2']);
});

test('문장 검색: 단어를 많이 포함한 발명이 위', () => {
  const terms = tokenizePlainQuery('비 오는 날 교실 바닥 젖음');
  const items = [
    { id: 'a', simple_title: '교실 사물함 정리대' },
    { id: 'b', simple_title: '빗물로 젖은 교실 바닥 자동 건조 매트' },
    { id: 'c', simple_title: '현관 바닥 미끄럼 방지 패드' },
  ];
  const ranked = rankInventions(items, '비 오는 날 교실 바닥 젖음', terms).map((x) => x.id);
  assert.equal(ranked[0], 'b');
});

test("동의어: '잔반'은 DB 표현 '음식물 쓰레기'까지 찾는다", () => {
  const a = analyzeQuery('급식 잔반');
  assert.equal(a.mode, 'plain');
  assert.deepEqual(a.groups[0], ['급식']);
  assert.ok(a.groups[1].includes('음식물 쓰레기'));
  assert.equal(
    buildTermsFilter([['x'], ['y', 'z']], COLS, 'all'),
    'and(or(a.ilike.%x%,b.ilike.%x%),or(a.ilike.%y%,b.ilike.%y%,a.ilike.%z%,b.ilike.%z%))'
  );
});

test("'비'는 날씨 문맥일 때만 '빗물'로 바뀐다", () => {
  assert.deepEqual(tokenizePlainQuery('비가 내리는 운동장'), ['빗물', '운동장']);
  assert.deepEqual(tokenizePlainQuery('비 용'), ['비', '용']); // 날씨 문맥 아님 → 그대로
});

test('두 단어를 모두 포함한 발명이 한 단어만 포함한 발명보다 위', () => {
  const groups = analyzeQuery('급식 잔반').groups;
  const items = [
    { id: 'pet', simple_title: '움직여야 열리는 단계별 스마트 애견 급식기' },
    { id: 'tray', simple_title: '급식 후 음식물 쓰레기를 줄이는 식판', simple_summary: '급식 잔반 감소' },
    { id: 'bin', simple_title: '음식물 쓰레기 압착 탈수 장치' },
  ];
  const ranked = rankInventions(items, '급식 잔반', groups).map((x) => x.id);
  assert.equal(ranked[0], 'tray');
});
