import assert from 'node:assert/strict'
import test from 'node:test'
import { createLoginLimiter } from './login-rate-limit'
test('login attempts are bounded per client and expire without unlimited storage', () => {
  const limiter = createLoginLimiter(2, 60_000, 2)
  assert.equal(limiter('a', 0), 0)
  assert.equal(limiter('a', 0), 0)
  assert.equal(limiter('a', 0), 60)
  assert.equal(limiter('b', 0), 0)
  assert.equal(limiter('c', 0), 60)
  assert.equal(limiter('a', 60_000), 0)
})
