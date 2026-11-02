import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseFormula,
  toOperatorQuery,
  toRepresentativeQueries,
  ipcMatches,
  describeQuery,
  toOperatorCandidates,
} from './kipris-query';

test('표시식에서 IPC와 AND/OR 그룹을 분리한다', () => {
  assert.deepEqual(parseFormula('IPC=[A47G]*우산꽂이*(서랍+빗물받이)'), {
    ipc: 'A47G',
    groups: [['우산꽂이'], ['서랍', '빗물받이']],
  });
});

test('IPC 없이 키워드만', () => {
  assert.deepEqual(parseFormula('접시콘*(회수+수거)*허리'), {
    ipc: null,
    groups: [['접시콘'], ['회수', '수거'], ['허리']],
  });
});

test('IPC만 있거나 빈 식', () => {
  assert.deepEqual(parseFormula('IPC=[A45B 25/00]'), { ipc: 'A45B 25/00', groups: [] });
  assert.deepEqual(parseFormula(''), { ipc: null, groups: [] });
});

test('따옴표 구문은 하나의 키워드로 유지', () => {
  assert.deepEqual(parseFormula('("우산 거치대"+거치대)*접이식').groups, [['우산 거치대', '거치대'], ['접이식']]);
});

test('연산자 방식 질의는 표시식과 같은 구조', () => {
  assert.equal(toOperatorQuery([['우산꽂이'], ['서랍', '빗물받이']]), '우산꽂이*(서랍+빗물받이)');
});

test('대표어 방식은 엄격 → 완화 순서', () => {
  assert.deepEqual(toRepresentativeQueries([['우산꽂이'], ['서랍', '빗물받이'], ['화분']]), [
    '우산꽂이 서랍 화분',
    '우산꽂이 서랍',
    '우산꽂이',
  ]);
  assert.deepEqual(toRepresentativeQueries([]), []);
});

test('IPC 일치 판정', () => {
  assert.equal(ipcMatches('A47G 25/12|A45B 25/00', 'A47G'), true);
  assert.equal(ipcMatches('A47G 25/12|A45B 25/00', 'A45B 25/00'), true);
  assert.equal(ipcMatches('A45C 13/00', 'A45B'), false);
  assert.equal(ipcMatches('', 'A45B'), false);
  assert.equal(ipcMatches('A45B 25/00', null), false);
});

test('표시용 설명', () => {
  assert.equal(describeQuery('우산꽂이 서랍', false), '우산꽂이 AND 서랍');
  assert.equal(describeQuery('우산꽂이*(서랍+빗물받이)', true), '우산꽂이*(서랍+빗물받이)');
});

test('연산자 방식 후보: IPC 포함 전체식 → IPC 제외 → 뒤쪽 항목 제외', () => {
  const parsed = parseFormula('IPC=[A47G]*우산꽂이*(서랍+빗물받이)');
  assert.deepEqual(toOperatorCandidates(parsed), [
    { word: 'IPC=[A47G]*우산꽂이*(서랍+빗물받이)', ipcApplied: true },
    { word: '우산꽂이*(서랍+빗물받이)', ipcApplied: false },
    { word: '우산꽂이', ipcApplied: false },
  ]);
  assert.deepEqual(toOperatorCandidates(parseFormula('우산')), [{ word: '우산', ipcApplied: false }]);
});

test('OR 안의 AND는 의미를 바꾸어 전송하지 않고 명시적으로 거부한다', () => {
  assert.throws(() => parseFormula('(우산*자전거)+의자'), /AND.*OR|지원하지/);
});

test('불완전한 특허 검색식은 거부한다', () => {
  for (const formula of ['우산*', '(우산+의자', '우산)', '"우산', 'IPC=[A47G]*우산+',
    'IPC=[A47G*우산', 'IPC=[A47G]*IPC=[A45B]*우산']) {
    assert.throws(() => parseFormula(formula), /검색식/);
  }
});
