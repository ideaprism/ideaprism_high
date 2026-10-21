import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  isAdminOrgType,
} from './admin-session';

test('admin session token validates a proper payload', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret';

  const token = await createAdminSessionToken({
    orgId: 'org-1',
    orgName: 'Admin Org',
    orgType: 'admin',
  });

  const payload = await verifyAdminSessionToken(token);
  assert.ok(payload);
  assert.equal(payload?.orgId, 'org-1');
  assert.equal(payload?.orgType, 'admin');
});

test('admin session token rejects tampered token', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret';

  const token = await createAdminSessionToken({
    orgId: 'org-1',
    orgName: 'Admin Org',
    orgType: 'admin',
  });

  const tampered = token.replace(/.$/, token.endsWith('a') ? 'b' : 'a');
  const payload = await verifyAdminSessionToken(tampered);
  assert.equal(payload, null);
});

test('admin org type whitelist is strict', () => {
  assert.equal(isAdminOrgType('admin'), true);
  assert.equal(isAdminOrgType('guest'), false);
});
