'use client'

import { cn } from '@/lib/utils'
import type { LookupItem } from '@/types/search'

interface FilterRowProps {
    /** 필터 그룹 제목 */
    title: string
    /** 필터 아이템 목록 */
    items: LookupItem[]
    /** 선택된 아이템 ID 목록 */
    selectedIds: number[]
    /** 아이템별 카운트 */
    counts: Record<number, number>
    /** 전체 아이템 수 (ALL 버튼에 표시) */
    totalCount: number
    /** 아이템 토글 핸들러 */
    onToggle: (id: number) => void
    /** 선택 초기화 핸들러 */
    onClear: () => void
    /** 아이템별 색상 클래스 반환 함수 */
    getColorClass?: (name: string) => string
    /** SCAMPER 스타일 적용 여부 */
    isScamper?: boolean
}

/**
 * 필터 행 컴포넌트
 * 
 * 학교 구분, 문제 유형, SCAMPER 기법 등의 필터 UI를 렌더링합니다.
 * 
 * @example
 * ```tsx
 * <FilterRow
 *     title="학교 구분"
 *     items={grades}
 *     selectedIds={filters.gradeIds}
 *     counts={facetCounts.grades}
 *     totalCount={searchData.totalCount}
 *     onToggle={toggleGrade}
 *     onClear={clearGrades}
 * />
 * ```
 */
export function FilterRow({
    title,
    items,
    selectedIds,
    counts,
    totalCount,
    onToggle,
    onClear,
    getColorClass,
    isScamper = false
}: FilterRowProps) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="font-bold text-sm text-on-surface">{title}</h4>
            <div className="flex flex-wrap gap-2 items-center">
                {/* ALL Button */}
                <button
                    onClick={onClear}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border",
                        selectedIds.length === 0
                            ? "bg-slate-900 text-white border-transparent"
                            : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant/50"
                    )}
                >
                    전체 <span className="opacity-70">({totalCount})</span>
                </button>

                {/* Individual Tags */}
                {items.map(item => {
                    const count = counts[item.id] || 0
                    const active = selectedIds.includes(item.id)

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

                    return (
                        <button
                            key={item.id}
                            onClick={() => onToggle(item.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1",
                                !isScamper && "border",
                                colorClass
                            )}
                        >
                            {item.name} <span className="opacity-60 text-[10px]">({count})</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
