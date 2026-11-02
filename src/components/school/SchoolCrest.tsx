import { getSchoolBySlug, type SchoolSlug } from '@/config/schools'

interface SchoolCrestProps {
  slug: SchoolSlug
  size?: number
  className?: string
}

export function SchoolCrest({ slug, size = 42, className }: SchoolCrestProps) {
  const school = getSchoolBySlug(slug)
  if (!school) return null

  return (
    <img
      src={school.logoSrc}
      alt={school.name}
      className={className}
      style={{ height: size, width: 'auto', maxWidth: '100%' }}
    />
  )
}
