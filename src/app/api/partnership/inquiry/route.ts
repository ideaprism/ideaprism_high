import { NextResponse } from 'next/server'

// High uses /api/auth/school; the former organization flow is disabled.
export async function POST() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
