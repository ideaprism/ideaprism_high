// Compatibility for server-rendered pages. Every entry point derives school from the issued account.
import { getSchoolSession } from '@/lib/school-session'
import { getSchoolInvention, searchSchoolInventions } from '@/lib/service-data'
export type InventionSearchParams = { q?: string; grade?: string | string[]; problem?: string | string[]; scamper?: string | string[]; page?: string }
const list = (value?: string | string[]) => value ? (Array.isArray(value) ? value : [value]) : []
export async function getInventions(params: InventionSearchParams) {
  const school = await getSchoolSession()
  const page = Math.max(1, Number(params.page) || 1), limit = 12
  if (!school) return { data: [], count: 0, page, limit }
  const result = searchSchoolInventions(school.slug, params.q || '')
  const rows = result.allInventions.filter(row => {
    const grades = list(params.grade), problems = list(params.problem), scampers = list(params.scamper)
    return (!grades.length || grades.includes(result.grades.find(g => g.id === row.grade_id)?.name || '')) &&
      (!problems.length || problems.some(tag => row.problem_tag?.split(',').map(s => s.trim()).includes(tag))) &&
      (!scampers.length || scampers.some(tag => row.scamper?.split(',').map(s => s.trim()).includes(tag)))
  }).map(row => ({ ...row, grades: result.grades.find(g => g.id === row.grade_id), categories: result.categories.find(c => c.id === row.category_id) }))
  return { data: rows.slice((page - 1) * limit, page * limit), count: rows.length, page, limit }
}
export async function getInventionById(id: string) {
  const school = await getSchoolSession()
  return school ? getSchoolInvention(school.slug, id) : null
}
export async function getInventionFacets(searchQuery = '') {
  const school = await getSchoolSession()
  const counts = { grades: {} as Record<string, number>, problems: {} as Record<string, number>, scampers: {} as Record<string, number>, totalCount: 0 }
  if (!school) return counts
  const result = searchSchoolInventions(school.slug, searchQuery)
  for (const row of result.allInventions) {
    const grade = result.grades.find(g => g.id === row.grade_id)?.name
    if (grade) counts.grades[grade] = (counts.grades[grade] || 0) + 1
    for (const tag of new Set(row.problem_tag?.split(',').map(s => s.trim()).filter(Boolean))) counts.problems[tag] = (counts.problems[tag] || 0) + 1
    for (const tag of new Set(row.scamper?.split(',').map(s => s.trim()).filter(Boolean))) counts.scampers[tag] = (counts.scampers[tag] || 0) + 1
  }
  counts.totalCount = result.totalCount
  return counts
}
