import { getSchoolSession } from '@/lib/school-session'
import { redirect } from 'next/navigation'

export async function generateMetadata() {
  const school = await getSchoolSession()
  return {
    title: school ? `${school.shortName} 발명품 검색` : '발명품 검색',
  }
}

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  if (!await getSchoolSession()) redirect('/')
  return children
}
