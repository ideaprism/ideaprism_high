import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSearchQuery } from './search-parser';

for (const query of ['우산*', '+우산', '우산)', '(우산+의자', '우산++의자', '"우산', '()', '우산*()']) {
  test(`incomplete Boolean syntax is rejected: ${query}`, () => {
    assert.equal(parseSearchQuery(query), null);
  });
}

test('nested Boolean expressions and implicit AND remain supported', () => {
  assert.deepEqual(parseSearchQuery('(우산*자전거)+의자'), {
    type: 'OR', left: { type: 'AND', left: { type: 'TERM', value: '우산' }, right: { type: 'TERM', value: '자전거' } },
    right: { type: 'TERM', value: '의자' },
  });
  assert.equal(parseSearchQuery('우산 거치대')?.type, 'AND');
});
