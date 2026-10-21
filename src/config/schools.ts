export const SCHOOL_SLUGS = ['daegwang', 'mirae', 'samil', 'boseong'] as const

export type SchoolSlug = (typeof SCHOOL_SLUGS)[number]

export interface SchoolProfile {
  slug: SchoolSlug
  name: string
  shortName: string
  region: string
  englishName: string
  motto: string
  established: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  accent: string
  background: string
  ink: string
}

export const SCHOOLS: SchoolProfile[] = [
  {
    slug: 'daegwang',
    name: '대광고등학교',
    shortName: '대광고',
    region: '부산',
    englishName: 'Daegwang High School',
    motto: '학문 · 발명 · 봉사',
    established: '1972',
    primary: '#0C7A43',
    onPrimary: '#FFFFFF',
    primaryContainer: '#DDF3E6',
    onPrimaryContainer: '#08331C',
    secondary: '#8E1D24',
    accent: '#C4161C',
    background: '#F3F7F4',
    ink: '#14241C',
  },
  {
    slug: 'mirae',
    name: '미래산업과학고등학교',
    shortName: '미래산업과학고',
    region: '서울',
    englishName: 'Mirae High School of Science & Technology',
    motto: '기술 · 창조 · 봉사',
    established: '1994',
    primary: '#17233F',
    onPrimary: '#F7F4EC',
    primaryContainer: '#E4E8F0',
    onPrimaryContainer: '#10182C',
    secondary: '#2F6B4F',
    accent: '#C45C4A',
    background: '#F4F5F7',
    ink: '#12151C',
  },
  {
    slug: 'samil',
    name: '삼일공업고등학교',
    shortName: '삼일공고',
    region: '수원',
    englishName: 'Samil Technical High School',
    motto: '사랑과 봉사',
    established: '1988',
    primary: '#6E2B55',
    onPrimary: '#FFF8FB',
    primaryContainer: '#F8E8F1',
    onPrimaryContainer: '#3A1028',
    secondary: '#8A5A10',
    accent: '#E2B423',
    background: '#FBF7F8',
    ink: '#24141C',
  },
  {
    slug: 'boseong',
    name: '보성고등학교',
    shortName: '보성고',
    region: '서울',
    englishName: 'Boseong High School',
    motto: '스스로 배우고 몸소 행하며 힘차게 앞서자',
    established: '1906',
    primary: '#7C1E2B',
    onPrimary: '#FFF8F3',
    primaryContainer: '#F8E7E4',
    onPrimaryContainer: '#3D0E14',
    secondary: '#1E3A4C',
    accent: '#B8923A',
    background: '#F7F3EE',
    ink: '#1C1412',
  },
]

const SCHOOL_BY_SLUG = new Map(SCHOOLS.map((school) => [school.slug, school]))

export function getSchoolBySlug(slug: string | null | undefined): SchoolProfile | null {
  if (!slug) return null
  return SCHOOL_BY_SLUG.get(slug as SchoolSlug) ?? null
}

export function isSchoolSlug(slug: string): slug is SchoolSlug {
  return SCHOOL_BY_SLUG.has(slug as SchoolSlug)
}

function hexToRgb(hex: string): string {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `${red}, ${green}, ${blue}`
}

export function schoolCssVars(school: SchoolProfile): Record<string, string> {
  return {
    '--primary': school.primary,
    '--on-primary': school.onPrimary,
    '--primary-container': school.primaryContainer,
    '--on-primary-container': school.onPrimaryContainer,
    '--secondary': school.secondary,
    '--on-secondary': '#ffffff',
    '--secondary-container': school.primaryContainer,
    '--on-secondary-container': school.onPrimaryContainer,
    '--tertiary': school.accent,
    '--on-tertiary': school.ink,
    '--tertiary-container': school.primaryContainer,
    '--on-tertiary-container': school.onPrimaryContainer,
    '--background': school.background,
    '--on-background': school.ink,
    '--surface': '#fffcf8',
    '--on-surface': school.ink,
    '--surface-variant': school.primaryContainer,
    '--on-surface-variant': school.secondary,
    '--outline': school.secondary,
    '--outline-variant': school.primaryContainer,
    '--primary-rgb': hexToRgb(school.primary),
  }
}
