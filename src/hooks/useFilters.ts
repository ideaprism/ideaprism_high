'use client'

import { useState, useCallback } from 'react'
import type { InventionRaw, Filters, FacetCounts } from '@/types/search'

/**
 * useFilters 옵션
 */
interface UseFiltersOptions {
    /** URL 파라미터에서 초기 필터값 가져올지 여부 */
    initialProblem?: string
    /** 초기 gradeIds */
    initialGradeIds?: number[]
    /** 초기 problemTags */
    initialProblemTags?: string[]
    /** 초기 scamperTags */
    initialScamperTags?: string[]
}

/**
 * useFilters 반환 타입
 */
interface UseFiltersReturn {
    setYearRange: (range: [number, number]) => void
    // 필터 상태
    filters: Filters

    // 필터 핸들러
    toggleGrade: (id: number) => void
    toggleProblem: (tag: string) => void
    toggleScamper: (tag: string) => void
    clearGrades: () => void
    clearProblems: () => void
    clearScampers: () => void
    clearAll: () => void

    // 필터링 결과 (인벤션 배열과 데이터를 제공하면 필터링된 결과 반환)
    filterInventions: (inventions: InventionRaw[]) => InventionRaw[]

    // Facet 카운트 계산
    calculateFacets: (inventions: InventionRaw[]) => FacetCounts
}

/**
 * 필터 관리 커스텀 훅
 * 
 * 검색 페이지에서 사용하는 필터 상태와 핸들러를 통합 관리합니다.
 * 
 * @example
 * ```tsx
 * const { filters, toggleGrade, filterInventions, calculateFacets } = useFilters()
 * 
 * const filtered = filterInventions(allInventions)
 * const facets = calculateFacets(allInventions)
 * ```
 */
export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
    const {
        initialProblem = '',
        initialGradeIds = [],
        initialProblemTags = [],
        initialScamperTags = []
    } = options

    // 필터 상태
    const [filters, setFilters] = useState<Filters>({
        gradeIds: initialGradeIds,
        problemTags: initialProblem
            ? [...new Set([...initialProblemTags, initialProblem])]
            : initialProblemTags,
        scamperTags: initialScamperTags
    })

    // ========================================
    // 필터 토글 핸들러
    // ========================================

    const toggleGrade = useCallback((id: number) => {
        setFilters(prev => ({
            ...prev,
            gradeIds: prev.gradeIds.includes(id)
                ? prev.gradeIds.filter(x => x !== id)
                : [...prev.gradeIds, id]
        }))
    }, [])

    const toggleProblem = useCallback((tag: string) => {
        setFilters(prev => ({
            ...prev,
            problemTags: prev.problemTags.includes(tag)
                ? prev.problemTags.filter(x => x !== tag)
                : [...prev.problemTags, tag]
        }))
    }, [])

    const toggleScamper = useCallback((tag: string) => {
        setFilters(prev => ({
            ...prev,
            scamperTags: prev.scamperTags.includes(tag)
                ? prev.scamperTags.filter(x => x !== tag)
                : [...prev.scamperTags, tag]
        }))
    }, [])

    const clearGrades = useCallback(() => {
        setFilters(prev => ({ ...prev, gradeIds: [] }))
    }, [])

    const clearProblems = useCallback(() => {
        setFilters(prev => ({ ...prev, problemTags: [] }))
    }, [])

    const clearScampers = useCallback(() => {
        setFilters(prev => ({ ...prev, scamperTags: [] }))
    }, [])

    const clearAll = useCallback(() => {
        setFilters({
            gradeIds: [],
            problemTags: [],
            scamperTags: []
        })
    }, [])

    // ========================================
    // 필터링 로직 (순수 함수)
    // ========================================

    const filterInventions = useCallback((inventions: InventionRaw[]): InventionRaw[] => {
        return filterInventionsByFilters(inventions, filters)
    }, [filters])

    // ========================================
    // Facet 집계 로직 (순수 함수)
    // ========================================

    // 버튼 숫자 = "이 버튼을 누르면 남는 건수".
    // 각 그룹의 숫자는 '다른 그룹' 필터만 적용한 결과로 센다 (faceted count).
    // 예: 학교급 '중등'을 고르면 문제유형·SCAMPER 숫자는 중등 안에서의 건수로 바뀌고,
    //     학교급 버튼 숫자는 그대로 유지돼 다른 학교급으로 바꿔 볼 수 있다.
    const calculateFacets = useCallback((inventions: InventionRaw[]): FacetCounts => {
        return calculateFacetCounts(inventions, filters)
    }, [filters])

    return {
        setYearRange: (yearRange) => setFilters(prev => ({ ...prev, yearRange })),
        filters,
        toggleGrade,
        toggleProblem,
        toggleScamper,
        clearGrades,
        clearProblems,
        clearScampers,
        clearAll,
        filterInventions,
        calculateFacets
    }
}

/**
 * 필터링/Facet 계산만 하는 유틸리티 함수들
 * (훅 외부에서 사용 가능)
 */

/** 인벤션 필터링 유틸리티 */
export function filterInventionsByFilters(
    inventions: InventionRaw[],
    filters: Filters
): InventionRaw[] {
    return inventions.filter(inv => {
        if (filters.yearRange && (inv.award_year == null || inv.award_year < filters.yearRange[0] || inv.award_year > filters.yearRange[1])) return false
        if (filters.gradeIds.length > 0) {
            if (!inv.grade_id || !filters.gradeIds.includes(inv.grade_id)) {
                return false
            }
        }

        if (filters.problemTags.length > 0) {
            const invTags = inv.problem_tag
                ? inv.problem_tag.split(',').map(t => t.trim())
                : []
            const hasMatch = filters.problemTags.some(tag => invTags.includes(tag))
            if (!hasMatch) return false
        }

        if (filters.scamperTags.length > 0) {
            const invTags = inv.scamper
                ? inv.scamper.split(',').map(t => t.trim())
                : []
            const hasMatch = filters.scamperTags.some(tag => invTags.includes(tag))
            if (!hasMatch) return false
        }

        return true
    })
}

/** Facet 카운트 계산 유틸리티
 *
 * filters를 주면 faceted count: 각 그룹의 숫자는 '자기 그룹을 뺀 나머지 필터'를 적용한 결과로 센다.
 * filters를 생략하면 전체 결과 기준 단순 집계.
 */
export function calculateFacetCounts(inventions: InventionRaw[], filters?: Filters): FacetCounts {
    const f: Filters = filters ?? { gradeIds: [], problemTags: [], scamperTags: [] }

    const baseForGrades = filterInventionsByFilters(inventions, { ...f, gradeIds: [] })
    const baseForProblems = filterInventionsByFilters(inventions, { ...f, problemTags: [] })
    const baseForScampers = filterInventionsByFilters(inventions, { ...f, scamperTags: [] })

    const gradeCounts: Record<number, number> = {}
    baseForGrades.forEach(inv => {
        if (inv.grade_id) gradeCounts[inv.grade_id] = (gradeCounts[inv.grade_id] || 0) + 1
    })

    return {
        grades: gradeCounts,
        problems: countTags(baseForProblems, 'problem_tag'),
        scampers: countTags(baseForScampers, 'scamper'),
        // '전체'는 선택된 것 전체 (학교·문제유형·SCAMPER 모두 같은 숫자 = 현재 결과 수)
        total: filterInventionsByFilters(inventions, f).length,
    }
}

function countTags(inventions: InventionRaw[], field: 'problem_tag' | 'scamper'): Record<string, number> {
    const counts: Record<string, number> = {}
    inventions.forEach(inv => {
        const raw = inv[field]
        if (!raw) return
        // 한 발명에 같은 태그가 두 번 적혀 있어도 1건으로 셈
        new Set(raw.split(',').map(t => t.trim()).filter(Boolean)).forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1
        })
    })
    return counts
}
