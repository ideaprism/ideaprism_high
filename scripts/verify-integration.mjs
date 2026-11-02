// Start built Revise on 3100 and High on 3101 before running this read-only check.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const revise = process.env.REVISE_BASE_URL || 'http://127.0.0.1:3100';
const high = process.env.HIGH_BASE_URL || 'http://127.0.0.1:3101';
const schoolCode = process.env.HIGH_TEST_SCHOOL_CODE || 'DAEGWANG';
const login = await fetch(`${high}/api/auth/school`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: schoolCode }),
});
assert.equal(login.status, 200, 'school login');
const cookie = login.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie, 'session cookie issued');
const keywords = ['우산', '자전거', '태양광', '의자', '청소기', '비 오는 날 교실 바닥',
  '급식 잔반', '휠체어', '소화기', '분리수거', '우산*물기', 'qzxjkvn2026noresults'];
const search = async (base, keyword, authenticated = false) => {
  const start = performance.now();
  const response = await fetch(`${base}/api/search`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ keyword, limit: 500 }),
  });
  assert.equal(response.status, 200, `${base}: ${keyword}`);
  const data = await response.json();
  return { data, milliseconds: Math.round(performance.now() - start) };
};
const results = [];
for (const keyword of keywords) {
  const [a, b] = await Promise.all([search(revise, keyword), search(high, keyword, true)]);
  assert.equal(b.data.totalCount, a.data.totalCount, `${keyword}: count`);
  assert.deepEqual(b.data.allInventions.map(x => x.id), a.data.allInventions.map(x => x.id), `${keyword}: ranked IDs`);
  results.push({ keyword, count: b.data.totalCount, sameRankedIds: true,
    reviseMs: a.milliseconds, highMs: b.milliseconds,
    topTitles: b.data.allInventions.slice(0, 3).map(x => x.simple_title) });
  console.log(JSON.stringify(results.at(-1)));
}
for (const path of ['/api/search', '/api/inventions/elem-10001', '/api/kipris/search?q=우산', '/api/chat']) {
  const method = path === '/api/search' || path === '/api/chat' ? 'POST' : 'GET';
  assert.equal((await fetch(high + path, { method })).status, 401, `unauthenticated ${path}`);
  assert.equal((await fetch(high + path, { method, headers: { Cookie: cookie + '.tampered' } })).status, 401, `tampered ${path}`);
}
const detail = await fetch(`${high}/api/inventions/elem-10001`, { headers: { Cookie: cookie } });
assert.equal(detail.status, 200);
assert.match(detail.headers.get('cache-control'), /private.*no-store/);
assert.equal((await fetch(`${high}/api/chat`, { method: 'POST', headers: { Cookie: cookie } })).status, 404);
assert.equal((await fetch(`${high}/test/fast-search`, { headers: { Cookie: cookie } })).status, 404);
const patent = await fetch(`${high}/api/kipris/search?q=${encodeURIComponent('IPC=[A47G]*우산꽂이')}`, { headers: { Cookie: cookie } });
assert.equal(patent.status, 200);
const patents = await patent.json();
assert.equal(patents.success, true);
const logout = await fetch(`${high}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
assert.equal(logout.status, 200);
assert.match(logout.headers.get('set-cookie'), /ideaprism_school_session=;/);
const report = { checkedAt: new Date().toISOString(), results, accessChecks: 'passed', detail: 'private, no-store', patents: patents.totalCount };
writeFileSync(new URL('../docs/integration-api-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log('Integration API checks passed.');
