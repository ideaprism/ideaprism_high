/**
 * 검색 페이지 관련 타입 정의
 * - 인벤션 데이터, 필터, Facet 카운트 등 검색 기능에서 사용하는 모든 타입 정의
 */

// ============================================
// 기본 데이터 타입
// ============================================

/** 인벤션 원시 데이터 (Supabase에서 받은 형태) */
export interface InventionRaw {
    round?: number | null
    award?: string | null
    award_detail?: string | null
    grade_year?: string | number
    award_year?: number | null
    school_id?: string
    student_name?: string
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
    yearBounds?: { min: number; max: number }
    allInventions: InventionRaw[]
    grades: LookupItem[]
    categories: LookupItem[]
    problemTags: LookupItem[]
    scamperTags: LookupItem[]
    totalCount: number
    /** 일부 조회가 실패했지만 나머지 결과를 표시하는 경우 */
    partialResults?: boolean
    /** 이 응답에서 반환할 수 있는 후보 수 상한 */
    maxResults?: number
}

// ============================================
// 필터 관련 타입
// ============================================

/** 문자열 기반 필터 상태 (ClientSearchPage에서 사용) */
export interface Filters {
    yearRange?: [number, number]
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
    /** 모든 그룹 '전체' 버튼 숫자 = 지금 선택된 필터를 모두 적용한 결과 수 */
    total: number
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
