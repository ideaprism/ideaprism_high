import { NextRequest, NextResponse } from 'next/server'
import { requireSchool } from '@/lib/school-route'

// External chat behavior has not been verified for school use.
export async function POST(request: NextRequest) {
  const denied = await requireSchool(request)
  if (denied) return denied
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
