'use client'

import { cn } from '@/lib/utils'
import { isValidProblemTag, getProblemColorClass, getScamperColorClass, getScamperLabel } from '@/utils/tag-styles'
import { AlertTriangle, CloudOff, Trash2, Frown, Settings2, MoreHorizontal, Replace, Combine, Lightbulb, Scaling, ArrowRightLeft, FlipHorizontal2 } from 'lucide-react'
import type { LookupItem, Filters, FacetCounts, SearchData } from '@/types/search'

interface SearchFiltersProps {
    searchData: SearchData
    filters: Filters
    facetCounts: FacetCounts
    onToggleGrade: (id: number) => void
    onToggleProblem: (tag: string) => void
    onToggleScamper: (tag: string) => void
    onClearGrades: () => void
    onClearProblems: () => void
    onClearScampers: () => void
}

// 아이콘 컴포넌트 매핑
function getProblemIconComponent(name: string) {
    if (name.includes('안전')) return <AlertTriangle className="w-3.5 h-3.5" />
    if (name.includes('환경')) return <CloudOff className="w-3.5 h-3.5" />
    if (name.includes('경제')) return <Trash2 className="w-3.5 h-3.5" />
    if (name.includes('편의') || name.includes('불편')) return <Frown className="w-3.5 h-3.5" />
    if (name.includes('성능')) return <Settings2 className="w-3.5 h-3.5" />
    return <MoreHorizontal className="w-3.5 h-3.5" />
}

function getScamperIconComponent(name: string) {
    if (name.includes('대체')) return <Replace className="w-3.5 h-3.5" />
    if (name.includes('결합')) return <Combine className="w-3.5 h-3.5" />
    if (name.includes('응용') || name.includes('적용')) return <Lightbulb className="w-3.5 h-3.5" />
    if (name.includes('변형')) return <Scaling className="w-3.5 h-3.5" />
    if (name.includes('용도') || name.includes('다른')) return <ArrowRightLeft className="w-3.5 h-3.5" />
    if (name.includes('제거')) return <Trash2 className="w-3.5 h-3.5" />
    if (name.includes('거꾸로') || name.includes('뒤집')) return <FlipHorizontal2 className="w-3.5 h-3.5" />
    return null
}

interface FilterRowProps {
    title: string
    items: LookupItem[]
    selectedItems: (number | string)[]
    counts: Record<string | number, number>
    onToggle: (val: any) => void
    onClear: () => void
    itemKeyType: 'id' | 'name'
    totalCount: number
    getColorClass?: (name: string) => string
    isScamper?: boolean
    isProblem?: boolean
    getLabel?: (name: string) => string
}

function FilterRow({
    title,
    items,
    selectedItems,
    counts,
    onToggle,
    onClear,
    itemKeyType,
    totalCount,
    getColorClass,
    isScamper = false,
    isProblem = false,
    getLabel
}: FilterRowProps) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="font-bold text-sm text-on-surface">{title}</h4>
            <div className="flex flex-wrap gap-2 items-center">
                <button
                    onClick={onClear}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border",
                        selectedItems.length === 0
                            ? "bg-slate-900 text-white border-transparent"
                            : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant/50"
                    )}
                >
                    전체 <span className="opacity-70">({totalCount})</span>
                </button>

                {items.map(item => {
                    const key = itemKeyType === 'id' ? item.id : item.name
                    const count = counts[key] || 0
                    const active = selectedItems.includes(key as never)

                    let colorClass = "bg-surface-container text-on-surface-variant/70 border-outline-variant/50"

                    if (active) {
                        if (getColorClass) {
                            colorClass = getColorClass(item.name)
                        } else {
                            colorClass = "bg-primary/10 text-primary border-primary"
                        }
                    }

                    if (isScamper) {
                        if (!active) {
                            colorClass = "bg-gray-100 text-slate-700 border-transparent hover:bg-gray-200"
                        }
                        colorClass = colorClass.replace(/border-[\w-\/]+|border-\[.*?\]/g, "border-transparent")
                    }

                    const IconComponent = isProblem ? getProblemIconComponent(item.name) :
                        isScamper ? getScamperIconComponent(item.name) : null

                    return (
                        <button
                            key={item.id}
                            onClick={() => onToggle(key)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                !isScamper && "border",
                                colorClass
                            )}
                        >
                            {IconComponent}
                            {getLabel ? getLabel(item.name) : item.name} <span className="opacity-60 text-[10px]">({count})</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export function SearchFilters({
    searchData,
    filters,
    facetCounts,
    onToggleGrade,
    onToggleProblem,
    onToggleScamper,
    onClearGrades,
    onClearProblems,
    onClearScampers
}: SearchFiltersProps) {
    // Problem 태그 정렬 - 성능-편의-안전-환경-경제-기타 순서
    const sortedProblemTags = [...searchData.problemTags]
        .filter(t => isValidProblemTag(t.name))
        .sort((a, b) => {
            const order = ['성능', '편의', '안전', '환경', '경제']
            const aIndex = order.findIndex(o => a.name.includes(o))
            const bIndex = order.findIndex(o => b.name.includes(o))
            if (a.name === '기타') return 1
            if (b.name === '기타') return -1
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
        })

    // SCAMPER 태그 정렬 - S-C-A-M-P-E-R 순서
    const sortedScamperTags = [...searchData.scamperTags].sort((a, b) => {
        const order = ['대체', '결합', '적용', '변형', '다른용도', '제거', '거꾸로']
        const aIndex = order.findIndex(o => a.name.includes(o))
        const bIndex = order.findIndex(o => b.name.includes(o))
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

    return (
        <div className="pb-6 bg-surface-container-lowest">
            <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col gap-6 py-4">
                        <FilterRow
                            title="학교 구분"
                            items={searchData.grades}
                            selectedItems={filters.gradeIds}
                            counts={facetCounts.grades}
                            onToggle={onToggleGrade}
                            onClear={onClearGrades}
                            itemKeyType="id"
                            totalCount={searchData.totalCount}
                        />
                        <FilterRow
                            title="해결하려는 문제 유형"
                            items={sortedProblemTags}
                            selectedItems={filters.problemTags}
                            counts={facetCounts.problems}
                            onToggle={onToggleProblem}
                            onClear={onClearProblems}
                            itemKeyType="name"
                            totalCount={searchData.totalCount}
                            getColorClass={getProblemColorClass}
                            isProblem={true}
                        />
                        <FilterRow
                            title="SCAMPER 기법"
                            items={sortedScamperTags}
                            selectedItems={filters.scamperTags}
                            counts={facetCounts.scampers}
                            onToggle={onToggleScamper}
                            onClear={onClearScampers}
                            itemKeyType="name"
                            totalCount={searchData.totalCount}
                            getColorClass={getScamperColorClass}
                            isScamper={true}
                            getLabel={getScamperLabel}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
