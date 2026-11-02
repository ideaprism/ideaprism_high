// Process-local protection; multi-instance deployments should also apply gateway limits.
export function createLoginLimiter(max = 10, windowMs = 60_000, capacity = 10_000) {
  const attempts = new Map<string, { count: number; until: number }>()
  return (client: string, now = Date.now()): number => {
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key)
    const current = attempts.get(client)
    if (!current) {
      if (attempts.size >= capacity) return Math.ceil(windowMs / 1000)
      attempts.set(client, { count: 1, until: now + windowMs })
      return 0
    }
    if (current.count >= max) return Math.ceil((current.until - now) / 1000)
    current.count++
    return 0
  }
}
export const adminLoginLimiter = createLoginLimiter()
