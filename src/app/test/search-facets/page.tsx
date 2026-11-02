import { getInventions, getInventionFacets, InventionSearchParams } from '@/utils/supabase/queries'
import { SearchResultGallery } from '@/components/features/SearchResultGallery'
import { InventionV2 } from '@/components/features/InventionCardV2'
import { FacetFilterPanel } from '@/components/test/FacetFilterPanel'
import { SearchBar } from '@/components/features/SearchBar'
import { Button } from '@/components/ui/Button'
import { FilterCalculation } from '@/components/test/FilterCalculation'
import Link from 'next/link'

export default async function SearchFacetsTestPage({
    searchParams,
}: {
    searchParams: Promise<InventionSearchParams>
}) {
    const resolvedParams = await searchParams

    // Fetch data and facets in parallel
    const [inventionsResult, facetsResult] = await Promise.all([
        getInventions(resolvedParams),
        getInventionFacets(resolvedParams.q)
    ])

    const { data, count, page, limit } = inventionsResult
    const facets = facetsResult

    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const getPageLink = (p: number) => {
        const params = new URLSearchParams(resolvedParams as any)
        params.set('page', p.toString())
        return `/test/search-facets?${params.toString()}`
    }

    // Extract selected filters for display
    const selectedGrades = resolvedParams.grade ? (Array.isArray(resolvedParams.grade) ? resolvedParams.grade : [resolvedParams.grade]) : []
    const selectedProblems = resolvedParams.problem ? (Array.isArray(resolvedParams.problem) ? resolvedParams.problem : [resolvedParams.problem]) : []
    const selectedScampers = resolvedParams.scamper ? (Array.isArray(resolvedParams.scamper) ? resolvedParams.scamper : [resolvedParams.scamper]) : []

    return (
        <div className="flex flex-col min-h-screen bg-surface-container-lowest">
            {/* Header / Search Area */}
            <div className="bg-surface border-b border-outline-variant/20 pt-8 pb-4 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 space-y-6">
                    {/* Top Search Bar */}
                    <div className="max-w-3xl mx-auto w-full">
                        <label className="block text-sm font-bold text-on-surface mb-2 ml-1">키워드 입력</label>
                        <SearchBar
                            initialValue={resolvedParams.q}
                            targetPath="/test/search-facets"
                            className="h-12 shadow-none border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container hover:shadow-sm"
                        />
                    </div>

                    {/* Horizontal Filters */}
                    <div className="w-full">
                        <FacetFilterPanel counts={facets} />
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 flex-1">
                <div className="mb-6 flex items-center justify-between">
                    <FilterCalculation
                        baseTotal={facets.totalCount || 0}
                        finalTotal={count || 0}
                        selectedGrades={selectedGrades}
                        selectedProblems={selectedProblems}
                        selectedScampers={selectedScampers}
                    />

                    {/* Sort options could go here */}
                    <div className="flex gap-2">
                        <Button variant="text" size="sm" className="font-medium">최신순</Button>
                        <Button variant="text" size="sm" className="text-on-surface-variant">인기순</Button>
                    </div>
                </div>

                {/* Results - Full Width Grid since filters are on top */}
                {data && data.length > 0 ? (
                    // Reuse gallery but maybe force more columns if possible? 
                    // SearchResultGallery uses generic grid classes, should adapt to full width naturally.
                    <SearchResultGallery inventions={data as InventionV2[]} />
                ) : (
                    <div className="text-center py-32 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                        <p className="text-lg text-on-surface-variant font-medium">검색 결과가 없습니다.</p>
                        <p className="text-sm text-outline mt-2">필터를 변경하거나 다른 키워드로 검색해보세요.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-16 pb-12">
                        <Link href={getPageLink(page - 1)} className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}>
                            <Button variant="outlined" disabled={!hasPrevPage}>이전</Button>
                        </Link>
                        <span className="flex items-center px-4 font-medium text-on-surface bg-surface rounded-md border border-outline-variant/20">
                            {page} / {totalPages}
                        </span>
                        <Link href={getPageLink(page + 1)} className={!hasNextPage ? "pointer-events-none opacity-50" : ""}>
                            <Button variant="outlined" disabled={!hasNextPage}>다음</Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
