'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchResultGallery } from '@/components/features/SearchResultGallery'
import { FilterCalculation } from '@/components/features/FilterCalculation'
import { ViewToggle } from '@/components/features/ViewToggle'
import { SearchBar, SearchFilters, SearchPagination } from '@/components/search'
import { useFilters, usePagination, useResetPageOnChange } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { DbWarmingBanner } from '@/components/ui/DbWarmingBanner'
import { POPULAR_KEYWORDS } from '@/constants/home'
import type { SearchData } from '@/types/search'

interface ClientSearchPageProps {
  initialKeyword?: string
}

const GUEST_NOTICE = '체험 모드에서는 인기 검색어만 이용 가능합니다.'

const EMPTY_SEARCH_DATA: SearchData = {
  allInventions: [],
  grades: [],
  categories: [],
  problemTags: [],
  scamperTags: [],
  totalCount: 0,
}

export function ClientSearchPage({ initialKeyword = '' }: ClientSearchPageProps) {
  const searchParams = useSearchParams()
  const viewMode = (searchParams.get('view') as 'grid' | 'list') || 'grid'
  const initialProblem = searchParams.get('problem') || ''

  const { organization } = useAuth()
  const isGuest = organization?.orgType === 'guest'
  const isPopularKeyword = (value: string) => POPULAR_KEYWORDS.includes(value.trim())

  const [inputValue, setInputValue] = useState(initialKeyword)
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword)
  const [searchData, setSearchData] = useState<SearchData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [guestNotice, setGuestNotice] = useState('')

  const [isWarming, setIsWarming] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [retryTrigger, setRetryTrigger] = useState(0)

  const {
    filters,
    toggleGrade,
    toggleProblem,
    toggleScamper,
    clearGrades,
    clearProblems,
    clearScampers,
    filterInventions,
    calculateFacets,
  } = useFilters({ initialProblem })

  const handleSearch = () => {
    const normalized = inputValue.trim()
    if (normalized.length < 2) return

    if (isGuest && !isPopularKeyword(normalized)) {
      setGuestNotice(GUEST_NOTICE)
      setError(null)
      setSearchData(EMPTY_SEARCH_DATA)
      setIsLoading(false)
      return
    }

    setGuestNotice('')
    setSearchKeyword(normalized)
  }

  const handlePopularKeywordClick = (keyword: string) => {
    setInputValue(keyword)
    setGuestNotice('')
    setSearchKeyword(keyword)
  }

  const isValidKeyword = inputValue.trim().length >= 2

  useEffect(() => {
    const abortController = new AbortController()

    if (retryCount === 0) {
      setIsWarming(false)
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: searchKeyword, page: 1, limit: 500, guestMode: isGuest }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))

          if (response.status === 403) {
            setGuestNotice(errorData.message || GUEST_NOTICE)
            setError(null)
            setSearchData(EMPTY_SEARCH_DATA)
            setIsWarming(false)
            setRetryCount(0)
            return
          }

          if (response.status === 504 || response.status === 502 || errorData.retryable) {
            if (retryCount < 15) {
              setIsWarming(true)
              setRetryCount((prev) => prev + 1)
              setTimeout(() => {
                setRetryTrigger((prev) => prev + 1)
              }, 2000)
              return
            }
          }

          throw new Error(errorData.message || 'Search failed')
        }

        const data: SearchData = await response.json()
        setSearchData(data)
        setGuestNotice('')
        setIsWarming(false)
        setRetryCount(0)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        if (
          retryCount < 15 &&
          (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch')))
        ) {
          setIsWarming(true)
          setRetryCount((prev) => prev + 1)
          setTimeout(() => {
            setRetryTrigger((prev) => prev + 1)
          }, 2000)
          return
        }

        setError(err instanceof Error ? err : new Error('Unknown error'))
        setIsWarming(false)
        setRetryCount(0)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => abortController.abort()
  }, [searchKeyword, retryTrigger, isGuest])

  const filteredInventions = useMemo(() => {
    if (!searchData) return []
    return filterInventions(searchData.allInventions)
  }, [searchData, filterInventions])

  const facetCounts = useMemo(() => {
    if (!searchData) return { grades: {}, problems: {}, scampers: {} }
    return calculateFacets(searchData.allInventions)
  }, [searchData, calculateFacets])

  const {
    paginatedItems: paginatedInventions,
    page,
    totalPages,
    setPage,
    resetPage,
  } = usePagination(filteredInventions)

  useResetPageOnChange([filters], resetPage)

  const enrichedInventions = useMemo(() => {
    if (!searchData) return []
    const isRestrictedQuery = isGuest && !POPULAR_KEYWORDS.includes(searchKeyword)

    return paginatedInventions.map((inv) => ({
      ...inv,
      grades: searchData.grades.find((g) => g.id === inv.grade_id),
      categories: searchData.categories.find((c) => c.id === inv.category_id),
      isRestricted: isRestrictedQuery,
    }))
  }, [paginatedInventions, searchData, isGuest, searchKeyword])

  const selectedGradeNames = useMemo(() => {
    if (!searchData) return []
    return filters.gradeIds
      .map((id) => searchData.grades.find((g) => g.id === id)?.name)
      .filter(Boolean) as string[]
  }, [searchData, filters.gradeIds])

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <div className="bg-white border-b border-outline-variant/30 py-8 shadow-sm">
        <SearchBar
          value={inputValue}
          onChange={setInputValue}
          onSearch={handleSearch}
          isValid={isValidKeyword}
        />

        {isGuest && (
          <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 mt-2">
            <div className="max-w-4xl mx-auto">
              {guestNotice && <p className="text-sm font-semibold text-primary mb-3">{guestNotice}</p>}

              <div className="flex flex-wrap items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
                <span className="text-xs md:text-sm font-semibold text-slate-600 mr-1">인기 검색어</span>
                {POPULAR_KEYWORDS.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => handlePopularKeywordClick(keyword)}
                    className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-white border border-primary/25 text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {searchData && (
        <SearchFilters
          searchData={searchData}
          filters={filters}
          facetCounts={facetCounts}
          onToggleGrade={toggleGrade}
          onToggleProblem={toggleProblem}
          onToggleScamper={toggleScamper}
          onClearGrades={clearGrades}
          onClearProblems={clearProblems}
          onClearScampers={clearScampers}
        />
      )}

      <main className="w-full max-w-7xl mx-auto px-6 py-10 flex-1">
        {isWarming && <DbWarmingBanner retryCount={retryCount} />}

        <div className="mb-8 flex items-center justify-between">
          <div>
            {isLoading ? (
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                발명품을 찾는 중...
              </h2>
            ) : !isWarming ? (
              <FilterCalculation
                baseTotal={searchData?.totalCount || 0}
                finalTotal={filteredInventions.length}
                selectedGrades={selectedGradeNames}
                selectedProblems={filters.problemTags}
                selectedScampers={filters.scamperTags}
              />
            ) : (
              <div />
            )}
          </div>
          <ViewToggle />
        </div>

        {error && !isWarming && !guestNotice && (
          <div className="text-center py-20 text-red-500 bg-red-50 rounded-2xl border border-red-100">
            오류가 발생했습니다: {error.message}
          </div>
        )}

        {!error && enrichedInventions.length > 0 && (
          <SearchResultGallery inventions={enrichedInventions} viewMode={viewMode} />
        )}

        {!isLoading && !error && enrichedInventions.length === 0 && !guestNotice && (
          <div className="text-center py-40 border border-dashed border-outline-variant rounded-2xl">
            <p className="text-lg text-on-surface-variant font-medium">검색 결과가 없습니다.</p>
            <p className="text-sm text-outline mt-2">다른 키워드나 필터를 사용해보세요.</p>
          </div>
        )}

        <SearchPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </div>
  )
}

