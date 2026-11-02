import { cookies } from 'next/headers'
import { type SchoolProfile } from '@/config/schools'
import { SCHOOL_SESSION_COOKIE } from '@/lib/school-token'
import { schoolForToken } from './issued-school-session'

export async function getSchoolSession(): Promise<SchoolProfile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SCHOOL_SESSION_COOKIE)?.value
  if (!token) return null

  return schoolForToken(token)
}
