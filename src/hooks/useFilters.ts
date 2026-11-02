'use client'

import { useState, useMemo, useCallback } from 'react'
import type { InventionRaw, Filters, FacetCounts, LookupItem } from '@/types/search'

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
        return inventions.filter(inv => {
            // Grade 필터
            if (filters.gradeIds.length > 0) {
                if (!inv.grade_id || !filters.gradeIds.includes(inv.grade_id)) {
                    return false
                }
            }

            // Problem Tag 필터
            if (filters.problemTags.length > 0) {
                const invTags = inv.problem_tag
                    ? inv.problem_tag.split(',').map(t => t.trim())
                    : []
                const hasMatch = filters.problemTags.some(tag => invTags.includes(tag))
                if (!hasMatch) return false
            }

            // SCAMPER Tag 필터
            if (filters.scamperTags.length > 0) {
                const invTags = inv.scamper
                    ? inv.scamper.split(',').map(t => t.trim())
                    : []
                const hasMatch = filters.scamperTags.some(tag => invTags.includes(tag))
                if (!hasMatch) return false
            }

            return true
        })
    }, [filters])

    // ========================================
    // Facet 집계 로직 (순수 함수)
    // ========================================

    const calculateFacets = useCallback((inventions: InventionRaw[]): FacetCounts => {
        const gradeCounts: Record<number, number> = {}
        const problemCounts: Record<string, number> = {}
        const scamperCounts: Record<string, number> = {}

        inventions.forEach(inv => {
            // Grade 카운트
            if (inv.grade_id) {
                gradeCounts[inv.grade_id] = (gradeCounts[inv.grade_id] || 0) + 1
            }

            // Problem Tag 카운트
            if (inv.problem_tag) {
                inv.problem_tag.split(',').forEach(t => {
                    const tag = t.trim()
                    if (tag) problemCounts[tag] = (problemCounts[tag] || 0) + 1
                })
            }

            // SCAMPER 카운트
            if (inv.scamper) {
                inv.scamper.split(',').forEach(t => {
                    const tag = t.trim()
                    if (tag) scamperCounts[tag] = (scamperCounts[tag] || 0) + 1
                })
            }
        })

        return {
            grades: gradeCounts,
            problems: problemCounts,
            scampers: scamperCounts
        }
    }, [])

    return {
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

/** Facet 카운트 계산 유틸리티 */
export function calculateFacetCounts(inventions: InventionRaw[]): FacetCounts {
    const gradeCounts: Record<number, number> = {}
    const problemCounts: Record<string, number> = {}
    const scamperCounts: Record<string, number> = {}

    inventions.forEach(inv => {
        if (inv.grade_id) {
            gradeCounts[inv.grade_id] = (gradeCounts[inv.grade_id] || 0) + 1
        }

        if (inv.problem_tag) {
            inv.problem_tag.split(',').forEach(t => {
                const tag = t.trim()
                if (tag) problemCounts[tag] = (problemCounts[tag] || 0) + 1
            })
        }

        if (inv.scamper) {
            inv.scamper.split(',').forEach(t => {
                const tag = t.trim()
                if (tag) scamperCounts[tag] = (scamperCounts[tag] || 0) + 1
            })
        }
    })

    return { grades: gradeCounts, problems: problemCounts, scampers: scamperCounts }
}
