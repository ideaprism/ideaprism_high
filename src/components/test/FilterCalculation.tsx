import { cn } from '@/lib/utils'
import { getProblemColorClass, getScamperColorClass } from '@/utils/tag-styles'

interface FilterCalculationProps {
    baseTotal: number
    finalTotal: number
    selectedGrades: string[]
    selectedProblems: string[]
    selectedScampers: string[]
}

export function FilterCalculation({
    baseTotal,
    finalTotal,
    selectedGrades,
    selectedProblems,
    selectedScampers
}: FilterCalculationProps) {
    // If no filters are selected, just show the total
    const hasFilters = selectedGrades.length > 0 || selectedProblems.length > 0 || selectedScampers.length > 0

    if (!hasFilters) {
        return (
            <h2 className="text-xl font-bold text-on-surface">
                총 {finalTotal}개의 결과
            </h2>
        )
    }

    // Helper to render a group
    const renderGroup = (items: string[], colorFunc?: (tag: string) => string) => {
        if (items.length === 0) return null

        return (
            <span className="inline-flex flex-wrap items-center gap-1 mx-1 p-1 bg-surface-container rounded-lg border border-outline-variant/50">
                <span className="text-on-surface-variant text-sm">(</span>
                {items.map((item, idx) => {
                    // Extract exact name if it has count logic? No, just name.
                    // But wait, the chips in FilterPanel are "Name (count)". 
                    // Here we just want Name. 
                    // Passed props will be just values like "초등학교", "안전(위험)".

                    const colorClass = colorFunc
                        ? colorFunc(item)
                        : "text-primary" // Default for Grade

                    // Extract text color from colorClass string if possible, or just use class
                    // The utils return bg + text classes. We might want just text color style for this text-based formula, 
                    // OR render them as mini-chips. 
                    // User image shows simply text "안전 + 편의". Let's try to match text color to tag style.

                    return (
                        <span key={item} className="flex items-center">
                            {idx > 0 && <span className="text-on-surface-variant mx-1">+</span>}
                            <span className={cn("font-medium", colorClass.replace(/bg-\[#.*?\]\/10|bg-[\w-]+/g, "").replace(/border-\[.*?\]|border-[\w-]+/g, ""))}>
                                {item}
                            </span>
                        </span>
                    )
                })}
                <span className="text-on-surface-variant text-sm">)</span>
            </span>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-y-2 text-xl font-bold text-on-surface leading-normal">
            <span>총 {baseTotal}개의 결과</span>

            {/* Grades */}
            {selectedGrades.length > 0 && (
                <>
                    <span className="text-on-surface-variant mx-1">*</span>
                    {renderGroup(selectedGrades)}
                </>
            )}

            {/* Problems */}
            {selectedProblems.length > 0 && (
                <>
                    <span className="text-on-surface-variant mx-1">*</span>
                    {renderGroup(selectedProblems, getProblemColorClass)}
                </>
            )}

            {/* Scampers */}
            {selectedScampers.length > 0 && (
                <>
                    <span className="text-on-surface-variant mx-1">*</span>
                    {renderGroup(selectedScampers, getScamperColorClass)}
                </>
            )}

            <span className="text-on-surface-variant mx-2">=</span>
            <span className="text-primary">{finalTotal}개의 결과</span>
        </div>
    )
}
