'use client'

import { useState, useMemo, useCallback } from 'react'
import type { InventionRaw, LookupItem, FiltersById, FacetCountsById } from '@/types/search'

/**
 * useFiltersById 옵션
 */
interface UseFiltersByIdOptions {
    /** 룩업 테이블 - 태그 ID를 이름으로 변환하는데 사용 */
    problemTags?: LookupItem[]
    scamperTags?: LookupItem[]
}

/**
 * useFiltersById 반환 타입
 */
interface UseFiltersByIdReturn {
    // 필터 상태
    filters: FiltersById

    // 필터 핸들러
    toggleGrade: (id: number) => void
    toggleProblem: (id: number) => void
    toggleScamper: (id: number) => void
    clearGrades: () => void
    clearProblems: () => void
    clearScampers: () => void
    clearAll: () => void

    // 필터링 함수
    filterInventions: (inventions: InventionRaw[]) => InventionRaw[]

    // Facet 집계 함수
    calculateFacets: (inventions: InventionRaw[]) => FacetCountsById
}

/**
 * ID 기반 필터 관리 커스텀 훅
 * 
 * fast-search 페이지처럼 ID로 필터링하는 경우에 사용합니다.
 * 
 * @example
 * ```tsx
 * const { filters, toggleGrade, filterInventions } = useFiltersById({
 *     problemTags: searchData.problemTags,
 *     scamperTags: searchData.scamperTags
 * })
 * ```
 */
export function useFiltersById(options: UseFiltersByIdOptions = {}): UseFiltersByIdReturn {
    const { problemTags = [], scamperTags = [] } = options

    // 필터 상태
    const [filters, setFilters] = useState<FiltersById>({
        gradeIds: [],
        problemTagIds: [],
        scamperTagIds: []
    })

    // ID -> Name 맵 생성
    const problemIdToName = useMemo(() => {
        const map: Record<number, string> = {}
        problemTags.forEach(t => map[t.id] = t.name)
        return map
    }, [problemTags])

    const scamperIdToName = useMemo(() => {
        const map: Record<number, string> = {}
        scamperTags.forEach(t => map[t.id] = t.name)
        return map
    }, [scamperTags])

    const problemNameToId = useMemo(() => {
        const map: Record<string, number> = {}
        problemTags.forEach(t => map[t.name] = t.id)
        return map
    }, [problemTags])

    const scamperNameToId = useMemo(() => {
        const map: Record<string, number> = {}
        scamperTags.forEach(t => map[t.name] = t.id)
        return map
    }, [scamperTags])

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

    const toggleProblem = useCallback((id: number) => {
        setFilters(prev => ({
            ...prev,
            problemTagIds: prev.problemTagIds.includes(id)
                ? prev.problemTagIds.filter(x => x !== id)
                : [...prev.problemTagIds, id]
        }))
    }, [])

    const toggleScamper = useCallback((id: number) => {
        setFilters(prev => ({
            ...prev,
            scamperTagIds: prev.scamperTagIds.includes(id)
                ? prev.scamperTagIds.filter(x => x !== id)
                : [...prev.scamperTagIds, id]
        }))
    }, [])

    const clearGrades = useCallback(() => {
        setFilters(prev => ({ ...prev, gradeIds: [] }))
    }, [])

    const clearProblems = useCallback(() => {
        setFilters(prev => ({ ...prev, problemTagIds: [] }))
    }, [])

    const clearScampers = useCallback(() => {
        setFilters(prev => ({ ...prev, scamperTagIds: [] }))
    }, [])

    const clearAll = useCallback(() => {
        setFilters({
            gradeIds: [],
            problemTagIds: [],
            scamperTagIds: []
        })
    }, [])

    // ========================================
    // 필터링 로직
    // ========================================

    const filterInventions = useCallback((inventions: InventionRaw[]): InventionRaw[] => {
        return inventions.filter(inv => {
            // Grade 필터
            if (filters.gradeIds.length > 0) {
                if (!inv.grade_id || !filters.gradeIds.includes(inv.grade_id)) {
                    return false
                }
            }

            // Problem Tag 필터 (ID -> Name 변환 후 매칭)
            if (filters.problemTagIds.length > 0) {
                const invTags = inv.problem_tag
                    ? inv.problem_tag.split(',').map(t => t.trim())
                    : []
                const selectedNames = filters.problemTagIds
                    .map(id => problemIdToName[id])
                    .filter(Boolean)

                const hasMatch = selectedNames.some(name => invTags.includes(name))
                if (!hasMatch) return false
            }

            // SCAMPER Tag 필터 (ID -> Name 변환 후 매칭)
            if (filters.scamperTagIds.length > 0) {
                const invTags = inv.scamper
                    ? inv.scamper.split(',').map(t => t.trim())
                    : []
                const selectedNames = filters.scamperTagIds
                    .map(id => scamperIdToName[id])
                    .filter(Boolean)

                const hasMatch = selectedNames.some(name => invTags.includes(name))
                if (!hasMatch) return false
            }

            return true
        })
    }, [filters, problemIdToName, scamperIdToName])

    // ========================================
    // Facet 집계 로직 (ID 기반)
    // ========================================

    const calculateFacets = useCallback((inventions: InventionRaw[]): FacetCountsById => {
        const gradeCounts: Record<number, number> = {}
        const problemCounts: Record<number, number> = {}
        const scamperCounts: Record<number, number> = {}

        inventions.forEach(inv => {
            // Grade 카운트
            if (inv.grade_id) {
                gradeCounts[inv.grade_id] = (gradeCounts[inv.grade_id] || 0) + 1
            }

            // Problem Tag 카운트 (Name -> ID 변환)
            if (inv.problem_tag) {
                inv.problem_tag.split(',').forEach(t => {
                    const tag = t.trim()
                    const id = problemNameToId[tag]
                    if (id) problemCounts[id] = (problemCounts[id] || 0) + 1
                })
            }

            // SCAMPER 카운트 (Name -> ID 변환)
            if (inv.scamper) {
                inv.scamper.split(',').forEach(t => {
                    const tag = t.trim()
                    const id = scamperNameToId[tag]
                    if (id) scamperCounts[id] = (scamperCounts[id] || 0) + 1
                })
            }
        })

        return {
            grades: gradeCounts,
            problems: problemCounts,
            scampers: scamperCounts
        }
    }, [problemNameToId, scamperNameToId])

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
