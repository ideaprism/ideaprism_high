'use client'

import { useState, useEffect, useMemo } from 'react'
import { InventionCardV2 } from '@/components/features/InventionCardV2'
import { InventionDetailModal } from '@/components/features/InventionDetailModal'
import { SearchPagination, FilterRow } from '@/components/search'
import { useFiltersById, usePagination, useResetPageOnChange } from '@/hooks'
import { getProblemColorClass, getScamperColorClass } from '@/utils/tag-styles'
import type { SearchData, InventionRaw } from '@/types/search'

export default function FastSearchPage() {
    // Search state
    const [keyword, setKeyword] = useState('')
    const [searchData, setSearchData] = useState<SearchData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Modal state
    const [selectedInvention, setSelectedInvention] = useState<any | null>(null)

    // ========================================
    // useFiltersById 훅으로 필터 로직 통합
    // ========================================
    const {
        filters,
        toggleGrade,
        toggleProblem,
        toggleScamper,
        clearGrades,
        clearProblems,
        clearScampers,
        filterInventions,
        calculateFacets
    } = useFiltersById({
        problemTags: searchData?.problemTags ?? [],
        scamperTags: searchData?.scamperTags ?? []
    })

    // ========================================
    // Fetch data when keyword changes
    // ========================================
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword, page: 1, limit: 1000 })
                })

                if (!response.ok) throw new Error('Search failed')

                const data: SearchData = await response.json()
                setSearchData(data)
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'))
            } finally {
                setIsLoading(false)
            }
        }

        const timer = setTimeout(fetchData, 300) // Debounce
        return () => clearTimeout(timer)
    }, [keyword])

    // ========================================
    // 필터링 및 Facet 계산 (훅 사용)
    // ========================================
    const filteredInventions = useMemo(() => {
        if (!searchData) return []
        return filterInventions(searchData.allInventions)
    }, [searchData, filterInventions])

    const facetCounts = useMemo(() => {
        if (!searchData) return { grades: {}, problems: {}, scampers: {} }
        return calculateFacets(searchData.allInventions)
    }, [searchData, calculateFacets])

    // ========================================
    // 페이지네이션 (훅 사용)
    // ========================================
    const {
        paginatedItems: paginatedInventions,
        page,
        totalPages,
        setPage,
        resetPage
    } = usePagination(filteredInventions)

    // 필터 변경 시 1페이지로 리셋
    useResetPageOnChange([filters], resetPage)

    // ========================================
    // Enrich inventions for display
    // ========================================
    const enrichedInventions = useMemo(() => {
        if (!searchData) return []

        return paginatedInventions.map(inv => {
            const grade = searchData.grades.find(g => g.id === inv.grade_id)
            const category = searchData.categories.find(c => c.id === inv.category_id)

            return {
                ...inv,
                grades: grade ? { name: grade.name } : null,
                categories: category ? { name: category.name } : null,
            }
        })
    }, [paginatedInventions, searchData])

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-surface to-secondary-container/10">
            {/* Header */}
            <div className="py-6 bg-surface-container-lowest">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold text-on-surface mb-4">⚡ Instant Filter Test</h1>
                    <p className="text-sm text-on-surface-variant mb-4">
                        클라이언트 사이드 필터링 - 필터 변경 시 <strong className="text-primary">즉시 반응</strong> (API 호출 없음)
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="max-w-4xl mx-auto w-full">
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="검색어를 입력하세요..."
                                className="w-full h-14 px-6 rounded-full bg-surface-variant/30 border-0 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters - FilterRow 컴포넌트 사용 */}
            <div className="pb-6 bg-surface-container-lowest">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col gap-6 py-4">
                            {searchData && (
                                <>
                                    <FilterRow
                                        title="학교 구분"
                                        items={searchData.grades}
                                        selectedIds={filters.gradeIds}
                                        counts={facetCounts.grades}
                                        totalCount={searchData.totalCount}
                                        onToggle={toggleGrade}
                                        onClear={clearGrades}
                                    />
                                    <FilterRow
                                        title="해결하려는 문제 유형"
                                        items={searchData.problemTags}
                                        selectedIds={filters.problemTagIds}
                                        counts={facetCounts.problems}
                                        totalCount={searchData.totalCount}
                                        onToggle={toggleProblem}
                                        onClear={clearProblems}
                                        getColorClass={getProblemColorClass}
                                    />
                                    <FilterRow
                                        title="SCAMPER 기법"
                                        items={searchData.scamperTags}
                                        selectedIds={filters.scamperTagIds}
                                        counts={facetCounts.scampers}
                                        totalCount={searchData.totalCount}
                                        onToggle={toggleScamper}
                                        onClear={clearScampers}
                                        getColorClass={getScamperColorClass}
                                        isScamper
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <main className="container mx-auto px-4 py-8 flex-1">
                {/* Result Count & Loading */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-on-surface">
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                검색 중...
                            </span>
                        ) : (
                            `총 ${filteredInventions.length}개의 결과`
                        )}
                    </h2>
                </div>

                {/* Error State */}
                {error && (
                    <div className="text-center py-12 text-red-500">
                        오류가 발생했습니다: {error.message}
                    </div>
                )}

                {/* Results Grid */}
                {!error && enrichedInventions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {enrichedInventions.map((invention) => (
                            <InventionCardV2
                                key={invention.id}
                                invention={invention}
                                onClick={() => setSelectedInvention(invention)}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && enrichedInventions.length === 0 && (
                    <div className="text-center py-32 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                        <p className="text-lg text-on-surface-variant font-medium">검색 결과가 없습니다.</p>
                        <p className="text-sm text-outline mt-2">필터를 변경하거나 다른 키워드로 검색해보세요.</p>
                    </div>
                )}

                {/* Pagination - SearchPagination 컴포넌트 사용 */}
                <SearchPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </main>

            {/* Detail Modal */}
            {selectedInvention && (
                <InventionDetailModal
                    invention={selectedInvention}
                    onClose={() => setSelectedInvention(null)}
                />
            )}
        </div>
    )
}
