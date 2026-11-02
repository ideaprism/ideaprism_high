import { cn } from '@/lib/utils'
import { getProblemColorClass, getScamperColorClass, getProblemIcon, getScamperIcon, getScamperLabel, isValidProblemTag } from '@/utils/tag-styles'
import { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface FilterCalculationProps {
    baseTotal: number
    finalTotal: number
    selectedGrades: string[]
    selectedProblems: string[]
    selectedScampers: string[]
}

// Helper to get Icon Component
const getIconComponent = (iconName: string): LucideIcon | null => {
    const pascalCase = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')

    return (LucideIcons as any)[pascalCase] || null
}

export function FilterCalculation({
    baseTotal,
    finalTotal,
    selectedGrades,
    selectedProblems,
    selectedScampers
}: FilterCalculationProps) {
    const hasFilters = selectedGrades.length > 0 || selectedProblems.length > 0 || selectedScampers.length > 0

    if (!hasFilters) {
        return (
            <h2 className="text-xl font-bold text-on-surface">
                총 <span className="text-primary">{finalTotal}</span>개의 결과
            </h2>
        )
    }

    const renderFormulaGroup = (items: string[], type: 'grade' | 'problem' | 'scamper') => {
        if (items.length === 0) return null

        const colorFunc = type === 'problem' ? getProblemColorClass : type === 'scamper' ? getScamperColorClass : undefined
        const iconFunc = type === 'problem' ? getProblemIcon : type === 'scamper' ? getScamperIcon : undefined
        const labelFunc = type === 'scamper' ? getScamperLabel : undefined

        return (
            <div className="flex items-center gap-1.5">
                <span className="text-on-surface-variant font-medium">(</span>
                {items.map((item, index) => {
                    const colorClass = colorFunc
                        ? colorFunc(item)
                        : "border-[1px] border-blue-200 bg-blue-50 text-blue-600"
                    
                    const Icon = iconFunc ? getIconComponent(iconFunc(item)) : null

                    return (
                        <div key={item} className="flex items-center gap-1.5">
                            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold border", colorClass)}>
                                {Icon && <Icon className="w-3 h-3" />}
                                {labelFunc ? labelFunc(item) : item}
                            </span>
                            {index < items.length - 1 && <span className="text-blue-500 font-bold text-xs">+</span>}
                        </div>
                    )
                })}
                <span className="text-on-surface-variant font-medium">)</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 py-4 flex-wrap">
            <h2 className="text-lg font-bold text-on-surface whitespace-nowrap">
                총 {baseTotal}개의 결과
            </h2>

            {(selectedGrades.length > 0 || selectedProblems.length > 0 || selectedScampers.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedGrades.length > 0 && (
                        <>
                            <span className="text-on-surface-variant/40 font-bold text-sm">×</span>
                            {renderFormulaGroup(selectedGrades, 'grade')}
                        </>
                    )}
                    
                    {selectedProblems.length > 0 && (
                        <>
                            <span className="text-on-surface-variant/40 font-bold text-sm">×</span>
                            {renderFormulaGroup(selectedProblems.filter(isValidProblemTag), 'problem')}
                        </>
                    )}

                    {selectedScampers.length > 0 && (
                        <>
                            <span className="text-on-surface-variant/40 font-bold text-sm">×</span>
                            {renderFormulaGroup(selectedScampers, 'scamper')}
                        </>
                    )}

                    <span className="text-on-surface-variant/40 font-bold text-sm">=</span>
                    <span className="text-lg font-bold text-primary">
                        {finalTotal}개의 결과
                    </span>
                </div>
            )}
        </div>
    )
}
