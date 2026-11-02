// Server-only: read private files at runtime, never import the JSON into a client bundle.
import { readFileSync, realpathSync, existsSync } from 'node:fs'
import { resolve, relative, isAbsolute, extname } from 'node:path'
import { isSchoolSlug, type SchoolSlug } from '@/config/schools'
import { analyzeQuery, rankInventions } from './search-query'
import type { SearchNode } from './search-parser'
import type { InventionRaw, LookupItem } from '@/types/search'

export interface ServiceInvention extends InventionRaw {
  school_id: SchoolSlug; school_name: string; student_name: string;
  keyword: string; ipc_secondary: string[]; grade_year: string | number;
  search_terms: { problem: string[]; method: string[]; effect: string[] };
  image_path: string | null; exclude_from_demo: boolean;
}
interface Catalog {
  record_count: number; visible_count: number; image_count: number;
  grades: LookupItem[]; categories: LookupItem[]; problemTags: LookupItem[]; scamperTags: LookupItem[];
}
let cached: { root: string; rows: ServiceInvention[]; catalog: Catalog } | undefined

function inside(root: string, file: string) {
  const rel = relative(root, file)
  return rel !== '..' && !rel.startsWith(`..\\`) && !rel.startsWith('../') && !isAbsolute(rel)
}
function dataset() {
  if (typeof window !== 'undefined') throw Error('Server-only operation')
  const root = realpathSync(resolve(process.env.SERVICE_DATA_DIR || 'private/service-data'))
  const publicRoot = resolve('public')
  if (inside(existsSync(publicRoot) ? realpathSync(publicRoot) : publicRoot, root)) throw Error('Service data cannot be public')
  if (cached?.root === root) return cached
  const rows = JSON.parse(readFileSync(resolve(root, 'data/inventions.json'), 'utf8')) as ServiceInvention[]
  const catalog = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8')) as Catalog
  if (!Array.isArray(rows) || rows.length !== catalog.record_count || new Set(rows.map(row => row.id)).size !== rows.length ||
    rows.some(row => !isSchoolSlug(row.school_id) || !/^[\w-]{1,64}$/.test(row.id) || !row.student_name || typeof row.exclude_from_demo !== 'boolean')) throw Error('Invalid service dataset')
  if (rows.filter(row => !row.exclude_from_demo).length !== catalog.visible_count || rows.filter(row => row.image_path).length !== catalog.image_count) throw Error('Dataset counts differ')
  // Validate all image paths before serving any records, including symlink containment.
  for (const row of rows) if (row.image_path) {
    const file = realpathSync(resolve(root, row.image_path))
    if (!inside(resolve(root, 'images'), file) || !['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extname(file).toLowerCase())) throw Error('Invalid image path')
  }
  cached = { root, rows, catalog }
  return cached
}

function scoped(school: SchoolSlug) {
  return dataset().rows.filter(row => row.school_id === school && row.exclude_from_demo === false)
}
function matches(row: ServiceInvention, term: string) {
  const fields = [row.original_title, row.simple_title, row.simple_summary, row.detailed_summary, row.problem, row.solution, row.keyword, row.student_name]
  return fields.some(field => (field ?? '').toLowerCase().includes(term.toLowerCase()))
}
function matchesNode(row: ServiceInvention, node: SearchNode): boolean {
  if (node.type === 'TERM') return matches(row, node.value)
  if (node.type === 'AND') return matchesNode(row, node.left) && matchesNode(row, node.right)
  return matchesNode(row, node.left) || matchesNode(row, node.right)
}
function card(row: ServiceInvention) {
  return {
    id: row.id, school_id: row.school_id, original_title: row.original_title, simple_title: row.simple_title,
    simple_summary: row.simple_summary, grade_id: Number.parseInt(String(row.grade_year)), category_id: row.category_id,
    grade_year: row.grade_year, award_year: row.award_year,
    problem_tag: row.problem_tag, scamper: row.scamper, ipc: row.ipc,
    drawing_url: row.image_path ? `/api/inventions/${encodeURIComponent(row.id)}/image` : null,
  }
}
export function searchSchoolInventions(school: SchoolSlug, keyword = '', limit = 500) {
  const analyzed = analyzeQuery(keyword)
  const candidates = scoped(school).filter(row => !keyword || (analyzed.mode === 'boolean'
    ? matchesNode(row, analyzed.node) : analyzed.groups.some(group => group.some(term => matches(row, term)))))
  const all = keyword ? rankInventions(candidates, keyword, analyzed.groups) : candidates
  const { categories, problemTags, scamperTags } = dataset().catalog
  const grades = [1, 2, 3].map(id => ({ id, name: `${id}학년` }))
  const years = scoped(school).map(row => row.award_year).filter((year): year is number => Number.isInteger(year))
  const yearBounds = years.length ? { min: Math.min(...years), max: Math.max(...years) } : undefined
  return { allInventions: all.slice(0, limit).map(card), grades, categories, problemTags, scamperTags,
    yearBounds, totalCount: all.length, maxResults: limit, partialResults: false }
}
export function getSchoolInvention(school: SchoolSlug, id: string) {
  const row = scoped(school).find(row => row.id === id)
  if (!row) return null
  const { catalog } = dataset()
  // Explicit response projection: no internal filesystem paths or review flags.
  return { ...card(row), school_name: row.school_name, student_name: row.student_name, grade_year: row.grade_year,
    competition_name: '대한민국학생발명전시회', round: row.round, award: row.award, award_detail: row.award_detail,
    invention_motive: row.invention_motive, detailed_summary: row.detailed_summary, problem: row.problem,
    solution: row.solution, next_step: row.next_step, curriculum: row.curriculum, sdg: row.sdg,
    keyword: row.keyword, search_terms: row.search_terms, ipc_secondary: row.ipc_secondary,
    grades: { id: Number.parseInt(String(row.grade_year)), name: String(row.grade_year) },
    categories: catalog.categories.find(item => item.id === row.category_id) ?? null }
}
export function getSchoolImage(school: SchoolSlug, id: string) {
  const row = scoped(school).find(row => row.id === id)
  if (!row?.image_path) return null
  const root = dataset().root
  const file = realpathSync(resolve(root, row.image_path))
  if (!inside(resolve(root, 'images'), file)) return null
  const mime: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }
  return { bytes: readFileSync(file), contentType: mime[extname(file).toLowerCase()] }
}
