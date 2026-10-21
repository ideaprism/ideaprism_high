'use client'

import { useState, useEffect, useCallback } from 'react'
import { InventionV2 } from '@/components/features/InventionCardV2'

export interface SearchFilters {
    grades: string[]
    problems: string[]
    scampers: string[]
}

export interface FacetCounts {
    grades: Record<string, number>
    problems: Record<string, number>
    scampers: Record<string, number>
    totalCount: number
}

export interface SearchResult {
    inventions: InventionV2[]
    totalCount: number
    facets: FacetCounts
}

interface UseSearchInventionsOptions {
    debounceMs?: number
}

export function useSearchInventions(
    keyword: string,
    filters: SearchFilters,
    page: number = 1,
    limit: number = 15,
    options: UseSearchInventionsOptions = {}
) {
    const { debounceMs = 300 } = options

    const [data, setData] = useState<SearchResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchData = useCallback(async (retryCount = 0) => {
        setIsLoading(true)
        setError(null)

        const maxRetries = 1 // 타임아웃 시 자동 재시도 횟수

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword,
                    filters,
                    page,
                    limit
                })
            })

            // 타임아웃 에러(504) 또는 서버 에러 시 재시도
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))

                // retryable 에러이고 재시도 횟수가 남았으면 재시도
                if ((response.status === 504 || errorData.retryable) && retryCount < maxRetries) {
                    console.log(`Search timeout, retrying... (${retryCount + 1}/${maxRetries})`)
                    return fetchData(retryCount + 1)
                }

                throw new Error(errorData.message || `Search failed: ${response.status}`)
            }

            const result: SearchResult = await response.json()
            setData(result)
        } catch (err) {
            // 네트워크 에러 시 재시도
            if (err instanceof TypeError && err.message.includes('fetch') && retryCount < maxRetries) {
                console.log(`Network error, retrying... (${retryCount + 1}/${maxRetries})`)
                return fetchData(retryCount + 1)
            }
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }, [keyword, filters, page, limit])

    // Debounced fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [fetchData, debounceMs])

    return {
        inventions: data?.inventions ?? [],
        totalCount: data?.totalCount ?? 0,
        facets: data?.facets ?? { grades: {}, problems: {}, scampers: {}, totalCount: 0 },
        isLoading,
        error,
        refetch: fetchData
    }
}
