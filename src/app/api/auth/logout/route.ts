import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session'
import { SCHOOL_SESSION_COOKIE } from '@/lib/school-token'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(ADMIN_SESSION_COOKIE)
  response.cookies.delete(SCHOOL_SESSION_COOKIE)
  return response
}
