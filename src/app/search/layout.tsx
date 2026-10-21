import { getSchoolSession } from '@/lib/school-session'

export async function generateMetadata() {
  const school = await getSchoolSession()
  return {
    title: school ? `${school.shortName} 발명품 검색` : '발명품 검색',
  }
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
