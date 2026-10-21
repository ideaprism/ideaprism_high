/**
 * 필터 관련 상수 통합 모듈
 * - 여러 컴포넌트에서 중복 정의되던 상수들을 한 곳에서 관리
 */

// 학교 구분 (Grade 필터용)
export const GRADES = ['초등학교', '중학교', '고등학교'] as const
export type Grade = typeof GRADES[number]

// 문제 유형 6종 (Problem Tag 필터용)
// 순서: 성능 → 편의 → 안전 → 환경 → 경제성 → 기타
export const PROBLEM_TAGS = [
    '성능(불완전)',
    '편의(불편)',
    '안전(위험)',
    '환경(환경오염)',
    '경제성(낭비)',
    '기타'
] as const
export type ProblemTag = typeof PROBLEM_TAGS[number]

// 문제 유형 정렬 순서 맵 (정렬 시 사용)
export const PROBLEM_TAG_ORDER: Record<string, number> = {
    '성능(불완전)': 0,
    '편의(불편)': 1,
    '안전(위험)': 2,
    '환경(환경오염)': 3,
    '경제성(낭비)': 4,
    '기타': 5
}

// SCAMPER 기법 7종 (SCAMPER Tag 필터용)
// 순서: S → C → A → M → P → E → R
export const SCAMPER_TAGS = [
    '대체하기',    // Substitute
    '결합하기',    // Combine
    '적용하기',    // Adapt
    '변형하기',    // Modify
    '다른용도로',  // Put to other uses
    '제거하기',    // Eliminate
    '거꾸로하기'   // Reverse
] as const
export type ScamperTag = typeof SCAMPER_TAGS[number]

// SCAMPER 정렬 순서 맵 (정렬 시 사용)
export const SCAMPER_TAG_ORDER: Record<string, number> = {
    '대체하기': 0,
    '결합하기': 1,
    '적용하기': 2,
    '변형하기': 3,
    '다른용도로': 4,
    '제거하기': 5,
    '거꾸로하기': 6
}

// 기본 페이지네이션 설정
export const DEFAULT_PAGE_LIMIT = 15
export const MAX_FETCH_LIMIT = 500
