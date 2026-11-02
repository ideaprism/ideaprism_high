'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { DEFAULT_PAGE_LIMIT } from '@/constants/filter'

/**
 * usePagination 옵션
 */
interface UsePaginationOptions {
    /** 페이지당 아이템 수 (기본값: 15) */
    limit?: number
    /** 초기 페이지 (기본값: 1) */
    initialPage?: number
}

/**
 * usePagination 반환 타입
 */
interface UsePaginationReturn<T> {
    /** 현재 페이지 (1-indexed) */
    page: number
    /** 페이지당 아이템 수 */
    limit: number
    /** 전체 페이지 수 */
    totalPages: number
    /** 전체 아이템 수 */
    totalItems: number
    /** 현재 페이지의 아이템들 */
    paginatedItems: T[]
    /** 페이지 변경 핸들러 */
    setPage: (page: number) => void
    /** 다음 페이지로 이동 */
    nextPage: () => void
    /** 이전 페이지로 이동 */
    prevPage: () => void
    /** 첫 페이지로 이동 */
    goToFirst: () => void
    /** 마지막 페이지로 이동 */
    goToLast: () => void
    /** 페이지 리셋 (1페이지로) */
    resetPage: () => void
    /** 현재 페이지가 첫 페이지인지 */
    isFirstPage: boolean
    /** 현재 페이지가 마지막 페이지인지 */
    isLastPage: boolean
    /** 표시할 페이지 번호 배열 (페이지네이션 UI용) */
    pageNumbers: number[]
}

/**
 * 페이지네이션 관리 커스텀 훅
 * 
 * 아이템 배열을 받아서 페이지네이션 상태와 핸들러를 제공합니다.
 * 
 * @param items - 페이지네이션할 전체 아이템 배열
 * @param options - 페이지네이션 옵션
 * 
 * @example
 * ```tsx
 * const { paginatedItems, page, totalPages, setPage } = usePagination(filteredInventions)
 * ```
 */
export function usePagination<T>(
    items: T[],
    options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
    const {
        limit = DEFAULT_PAGE_LIMIT,
        initialPage = 1
    } = options

    const [page, setPage] = useState(initialPage)

    // 전체 페이지 수 계산
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(items.length / limit))
    }, [items.length, limit])

    // 아이템 변경 시 페이지 범위 밖이면 조정
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [totalPages, page])

    // 현재 페이지 아이템 추출
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * limit
        return items.slice(start, start + limit)
    }, [items, page, limit])

    // 페이지 네비게이션 핸들러
    const nextPage = useCallback(() => {
        setPage(p => Math.min(totalPages, p + 1))
    }, [totalPages])

    const prevPage = useCallback(() => {
        setPage(p => Math.max(1, p - 1))
    }, [])

    const goToFirst = useCallback(() => {
        setPage(1)
    }, [])

    const goToLast = useCallback(() => {
        setPage(totalPages)
    }, [totalPages])

    const resetPage = useCallback(() => {
        setPage(1)
    }, [])

    // 페이지 번호 배열 생성 (최대 7개 표시)
    const pageNumbers = useMemo(() => {
        const maxVisible = 7
        let start = Math.max(1, page - 3)
        let end = Math.min(totalPages, start + maxVisible - 1)

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1)
        }

        const pages: number[] = []
        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }, [page, totalPages])

    return {
        page,
        limit,
        totalPages,
        totalItems: items.length,
        paginatedItems,
        setPage,
        nextPage,
        prevPage,
        goToFirst,
        goToLast,
        resetPage,
        isFirstPage: page === 1,
        isLastPage: page === totalPages,
        pageNumbers
    }
}

/**
 * 외부에서 페이지 리셋이 필요할 때 사용하는 훅
 * (필터 변경 시 1페이지로 돌아가기 등)
 */
export function useResetPageOnChange(
    dependencies: React.DependencyList,
    resetPage: () => void
) {
    useEffect(() => {
        resetPage()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies)
}
