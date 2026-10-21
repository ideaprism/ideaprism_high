import { cookies } from 'next/headers'
import { getSchoolBySlug, type SchoolProfile } from '@/config/schools'
import { SCHOOL_SESSION_COOKIE, verifySchoolSessionToken } from '@/lib/school-token'

export async function getSchoolSession(): Promise<SchoolProfile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SCHOOL_SESSION_COOKIE)?.value
  if (!token) return null

  const slug = await verifySchoolSessionToken(token)
  if (!slug) return null
  return getSchoolBySlug(slug)
}
