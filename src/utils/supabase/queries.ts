import { createClient } from '@/utils/supabase/server'

export type InventionSearchParams = {
  q?: string
  grade?: string | string[]
  problem?: string | string[]
  scamper?: string | string[]
  page?: string
}

export async function getInventions(params: InventionSearchParams) {
  const supabase = await createClient()
  const page = Number(params.page) || 1
  const limit = 12
  const from = (page - 1) * limit
  const to = from + limit - 1

  // 1. Fetch Inventions
  // New columns: id (text), ipc, problem_tag, scamper, error
  let query = supabase.from('inventions').select('*', { count: 'exact' })

  if (params.q) {
    query = query.or(`original_title.ilike.%${params.q}%,simple_summary.ilike.%${params.q}%`)
  }

  // 2. Apply Filters
  if (params.grade) {
    const grades = Array.isArray(params.grade) ? params.grade : [params.grade]
    // Need to find IDs from Grade names first because inventions still uses grade_id (int)
    const { data: gradeRecords } = await supabase.from('grades').select('id').in('name', grades)

    if (gradeRecords && gradeRecords.length > 0) {
      const gradeIds = gradeRecords.map((g: any) => g.id)
      query = query.in('grade_id', gradeIds)
    } else {
      return { data: [], count: 0, page, limit }
    }
  }

  if (params.problem) {
    const tags = Array.isArray(params.problem) ? params.problem : [params.problem]
    // Filter by string containment in 'problem_tag' column
    // Since we can have multiple tags selected, we need to check if ANY of them match.
    // PostgREST doesn't have a simple "contains any substring from array" for a single column easily without ORs.
    // We can construct an OR filter: problem_tag.ilike.%tag1%,problem_tag.ilike.%tag2%...
    const filters = tags.map(tag => `problem_tag.ilike.%${tag}%`).join(',')
    query = query.or(filters)
  }

  if (params.scamper) {
    const tags = Array.isArray(params.scamper) ? params.scamper : [params.scamper]
    const filters = tags.map(tag => `scamper.ilike.%${tag}%`).join(',')
    query = query.or(filters)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Supabase Query Error:', error)
    return { data: [], count: 0, page, limit }
  }

  // Enrich with Grade/Category names if needed (UI likely needs names)
  // We can do this efficiently by fetching distinct grade_ids/category_ids
  // Or just fetching all grades/categories if list is small. 
  // For simplicity and matching previous behavior, let's fetch individual relations or map them.
  // Actually, since we removed the manual enrichment function, we should add basic enrichment back for the returned object.

  const { data: grades } = await supabase.from('grades').select('id, name')
  const { data: categories } = await supabase.from('categories').select('id, name')

  const enriched = data?.map((inv: any) => {
    const grade = grades?.find((g: any) => g.id === inv.grade_id)
    const category = categories?.find((c: any) => c.id === inv.category_id)

    // Parse tags for consistency with InventionV2 interface?
    // InventionCardV2 now expects strings in problem_tag/scamper, so raw data is fine.
    // But we might want to attach grade name.

    return {
      ...inv,
      grades: grade ? { name: grade.name } : null,
      categories: category ? { name: category.name } : null,
    }
  })

  return { data: enriched || [], count: count || 0, page, limit }
}

export async function getInventionFacets(searchQuery: string = '') {
  const supabase = await createClient()

  // 1. Get base query for inventions matching the search term
  let baseQuery = supabase.from('inventions').select('id, grade_id, problem_tag, scamper')
  if (searchQuery) {
    baseQuery = baseQuery.or(`original_title.ilike.%${searchQuery}%,simple_summary.ilike.%${searchQuery}%`)
  }

  const { data: inventions, error } = await baseQuery

  if (error || !inventions) {
    console.error('Error fetching facets base:', error)
    return {
      grades: {},
      problems: {},
      scampers: {}
    }
  }

  // 2. Aggregate Grades
  const { data: allGrades } = await supabase.from('grades').select('id, name').order('display_order', { ascending: true })
  const gradeCounts: Record<string, number> = {}

  allGrades?.forEach(g => { gradeCounts[g.name] = 0 })

  inventions.forEach((inv: any) => {
    if (inv.grade_id) {
      const gName = allGrades?.find(g => g.id === inv.grade_id)?.name
      if (gName) {
        gradeCounts[gName] = (gradeCounts[gName] || 0) + 1
      }
    }
  })

  // 3. Aggregate Problem Tags (Dynamically from data)
  const problemCounts: Record<string, number> = {}

  inventions.forEach((inv: any) => {
    if (inv.problem_tag) {
      const tags = inv.problem_tag.split(',').map((t: string) => t.trim())
      tags.forEach((tag: string) => {
        if (tag && tag !== '-') {
          problemCounts[tag] = (problemCounts[tag] || 0) + 1
        }
      })
    }
  })

  // 4. Aggregate SCAMPER Tags (Dynamically from data)
  const scamperCounts: Record<string, number> = {}

  inventions.forEach((inv: any) => {
    if (inv.scamper) {
      const tags = inv.scamper.split(',').map((t: string) => t.trim())
      tags.forEach((tag: string) => {
        if (tag && tag !== '-') {
          scamperCounts[tag] = (scamperCounts[tag] || 0) + 1
        }
      })
    }
  })

  return {
    grades: gradeCounts,
    problems: problemCounts,
    scampers: scamperCounts,
    totalCount: inventions.length
  }
}

export async function getInventionById(id: string) {
  const supabase = await createClient()

  // Fetch base invention (using text id)
  const { data: invention, error } = await supabase
    .from('inventions')
    .select('*')
    .eq('id', id) // id is now string
    .single()

  if (error || !invention) {
    console.error('Fetch Invention Error:', error)
    return null
  }

  // Manual Enrichment for Grade/Category
  let grades = null
  if (invention.grade_id) {
    const { data } = await supabase.from('grades').select('name').eq('id', invention.grade_id).single()
    grades = data
  }

  let categories = null
  if (invention.category_id) {
    const { data } = await supabase.from('categories').select('name').eq('id', invention.category_id).single()
    categories = data
  }

  // Tags are now in invention.problem_tag and invention.scamper as strings
  // No need to join.

  return {
    ...invention,
    grades: grades,
    categories: categories,
    // Provide parsed tags if needed, or just let valid properties exist
    // InventionCardV2 handles string splitting.
    // But if we want to match old return signature strictly:
    // invention_problem_tags: ... (No longer needed by updated V2 card, but maybe used elsewhere?)
    // Let's rely on updated V2 component that uses 'problem_tag' string property.
  }
}
