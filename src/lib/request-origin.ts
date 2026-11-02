import type { NextRequest } from 'next/server'

/** Next can normalize loopback URLs to localhost. Host retains the browser-facing authority. */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // Non-browser API clients do not send Origin.
  const host = request.headers.get('host') || request.nextUrl.host
  return origin === `${request.nextUrl.protocol}//${host}`
}
