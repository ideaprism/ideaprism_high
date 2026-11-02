/**
 * Hooks 모듈 배럴 파일
 * 
 * 클라이언트에서 사용 가능한 커스텀 훅을 이 파일에서 export합니다.
 * 
 * @example
 * ```tsx
 * import { useFilters, usePagination } from '@/hooks'
 * ```
 * 
 * 주의: useInventions는 서버 전용 쿼리를 사용하므로 
 * 직접 './useInventions'에서 import해야 합니다.
 */

// 필터 관련 훅 (문자열 기반)
export {
    useFilters,
    filterInventionsByFilters,
    calculateFacetCounts
} from './useFilters'

// 필터 관련 훅 (ID 기반)
export { useFiltersById } from './useFiltersById'

// 페이지네이션 훅
export {
    usePagination,
    useResetPageOnChange
} from './usePagination'

// 검색 훅
export { useSearchInventions } from './useSearchInventions'

// 참고: useInventions, useInventionDetail은 서버 전용 쿼리(next/headers)를 사용하므로
// 클라이언트 컴포넌트에서는 직접 import할 수 없습니다.
// 필요 시 '@/hooks/useInventions'에서 직접 import하세요.
