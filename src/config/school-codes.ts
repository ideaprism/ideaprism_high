import type { SchoolSlug } from '@/config/schools'

/** 대문에서 입력하는 학교 코드. 화면 번들에는 넣지 않는다. */
export const SCHOOL_ACCESS_CODES: Record<SchoolSlug, string> = {
  daegwang: 'DAEGWANG',
  mirae: 'MIRAE',
  samil: 'SAMIL',
  boseong: 'BOSEONG',
}
