import assert from 'node:assert/strict';
import test from 'node:test';
import { parseKiprisKeywords, keywordsToTemplateFields, templateFieldsToFormula } from './opsme-keywords';
import { parseFormula, toOperatorCandidates } from '../lib/kipris-query';

test('expert keywords preserve multiword alternatives through generation and API serialization', () => {
  const keywords = parseKiprisKeywords('[Expert]O:우산꽂이+"우산 거치대"+거치대 @ S:경첩+힌지');
  const formula = templateFieldsToFormula(keywordsToTemplateFields('A47G', keywords.expert));
  assert.ok(formula.includes('"우산 거치대"'));
  const parsed = parseFormula(formula);
  assert.deepEqual(parsed.groups, [['우산꽂이', '우산 거치대', '거치대'], ['경첩', '힌지']]);
  assert.equal(toOperatorCandidates(parsed)[0].word, formula);
});
