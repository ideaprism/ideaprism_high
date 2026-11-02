import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { createSchoolSessionToken, SCHOOL_SESSION_COOKIE } from '@/lib/school-token';

for (const body of [null, [], { keyword: 123 }, { keyword: [] }, { keyword: '우산', limit: -1 },
  { keyword: '우산', limit: 1.5 }, { keyword: '우산', limit: 501 }, { keyword: '우산', guestMode: 'false' },
  { keyword: '가'.repeat(501) }, { keyword: '우산*' }, { keyword: '(우산+의자' }]) {
  test(`search rejects invalid input before querying the DB: ${JSON.stringify(body).slice(0, 70)}`, async () => {
    const response = await POST(await schoolRequest('http://localhost/api/search', {
      method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'Invalid request body');
  });
}

test('missing keyword retains the empty-search response', async () => {
  const response = await POST(await schoolRequest('http://localhost/api/search', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).totalCount, 0);
});

process.env.SCHOOL_SESSION_SECRET = 'school-api-test-secret-0123456789';
async function schoolRequest(url: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  const token = await createSchoolSessionToken('mirae');
  const headers = new Headers(init.headers);
  headers.set('Cookie', SCHOOL_SESSION_COOKIE + '=' + token);
  return new NextRequest(url, { ...init, headers });
}
