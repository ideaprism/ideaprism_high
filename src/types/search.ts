/**
 * 검색 페이지 관련 타입 정의
 * - 인벤션 데이터, 필터, Facet 카운트 등 검색 기능에서 사용하는 모든 타입 정의
 */

// ============================================
// 기본 데이터 타입
// ============================================

/** 인벤션 원시 데이터 (Supabase에서 받은 형태) */
export interface InventionRaw {
    id: string
    original_title: string
    simple_title: string | null
    drawing_url: string | null
    simple_summary: string | null
    grade_id: number | null
    category_id: number | null
    ipc?: string | null
    curriculum?: string | null
    sdg?: string | null
    invention_motive?: string | null
    detailed_summary?: string | null
    problem?: string | null
    solution?: string | null
    next_step?: string | null
    problem_tag?: string | null
    scamper?: string | null
    error?: string | null
}

/** 룩업 테이블 아이템 (grades, categories, tags 등) */
export interface LookupItem {
    id: number
    name: string
}

/** 검색 API 응답 데이터 */
export interface SearchData {
    allInventions: InventionRaw[]
    grades: LookupItem[]
    categories: LookupItem[]
    problemTags: LookupItem[]
    scamperTags: LookupItem[]
    totalCount: number
}

// ============================================
// 필터 관련 타입
// ============================================

/** 문자열 기반 필터 상태 (ClientSearchPage에서 사용) */
export interface Filters {
    gradeIds: number[]
    problemTags: string[]
    scamperTags: string[]
}

/** ID 기반 필터 상태 (fast-search에서 사용) */
export interface FiltersById {
    gradeIds: number[]
    problemTagIds: number[]
    scamperTagIds: number[]
}

/** 필터 토글 핸들러 타입 */
export interface FilterHandlers {
    toggleGrade: (id: number) => void
    toggleProblem: (value: string | number) => void
    toggleScamper: (value: string | number) => void
    clearGrades: () => void
    clearProblems: () => void
    clearScampers: () => void
    clearAll: () => void
}

// ============================================
// Facet (집계) 관련 타입
// ============================================

/** Facet 카운트 (문자열 키 기반 - 태그 이름) */
export interface FacetCounts {
    grades: Record<number, number>
    problems: Record<string, number>
    scampers: Record<string, number>
}

/** Facet 카운트 (ID 기반) */
export interface FacetCountsById {
    grades: Record<number, number>
    problems: Record<number, number>
    scampers: Record<number, number>
}

// ============================================
// 검색 상태 관련 타입
// ============================================

/** 검색 로딩/에러 상태 */
export interface SearchState {
    isLoading: boolean
    error: Error | null
}

/** 페이지네이션 상태 */
export interface PaginationState {
    page: number
    limit: number
    totalPages: number
}

/** useFilters 훅 반환 타입 */
export interface UseFiltersReturn<T extends Filters | FiltersById> {
    filters: T
    setFilters: React.Dispatch<React.SetStateAction<T>>
    handlers: FilterHandlers
    filteredInventions: InventionRaw[]
    facetCounts: FacetCounts | FacetCountsById
}
