'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getProblemColorClass, getScamperColorClass, getProblemIcon, getScamperIcon, getScamperLabel } from '@/utils/tag-styles'
import { GRADES, PROBLEM_TAGS, SCAMPER_TAGS } from '@/constants/filter'
import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface FacetFilterPanelProps {
    counts: {
        grades: Record<string, number>
        problems: Record<string, number>
        scampers: Record<string, number>
        totalCount: number
    }
}

// Lucide 아이콘 이름을 컴포넌트로 변환
const getIconComponent = (iconName: string): LucideIcon | null => {
    // Convert kebab-case to PascalCase
    const pascalCase = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')

    return (LucideIcons as any)[pascalCase] || null
}

export function FacetFilterPanel({ counts }: FacetFilterPanelProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const toggleFilter = (key: string, value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()))
        const values = current.getAll(key)

        if (values.includes(value)) {
            current.delete(key)
            values.filter(v => v !== value).forEach(v => current.append(key, v))
        } else {
            current.append(key, value)
        }
        current.set('page', '1')
        router.push(`/search?${current.toString()}`)
    }

    const clearCategory = (key: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()))
        current.delete(key)
        current.set('page', '1')
        router.push(`/search?${current.toString()}`)
    }

    const isSelected = (key: string, value: string) => {
        return searchParams.getAll(key).includes(value)
    }

    const isAllSelected = (key: string) => {
        return searchParams.getAll(key).length === 0
    }

    // Helper to render a row of filters with icons
    const renderFilterRow = (
        title: string,
        key: string,
        tags: readonly string[],
        countMap: Record<string, number>,
        getColorClass?: (tag: string) => string,
        getIconName?: (tag: string) => string,
        getLabel?: (tag: string) => string
    ) => {
        const isScamper = key === 'scamper'

        return (
            <div className="flex flex-col gap-2">
                <h4 className="font-bold text-sm text-on-surface">{title}</h4>
                <div className="flex flex-wrap gap-2 items-center">
                    {/* ALL Button */}
                    <button
                        onClick={() => clearCategory(key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border",
                            isAllSelected(key)
                                ? "bg-surface-on-surface text-white border-transparent bg-slate-900"
                                : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant/50"
                        )}
                    >
                        전체 <span className="opacity-70">({counts.totalCount})</span>
                    </button>

                    {/* Individual Tags */}
                    {tags.map(tag => {
                        const count = countMap[tag] || 0
                        const active = isSelected(key, tag)

                        // Get icon component if available
                        const IconComponent = getIconName ? getIconComponent(getIconName(tag)) : null

                        let colorClass = "bg-surface text-on-surface-variant border-outline-variant"

                        if (active) {
                            // Filter out duplicate counts if any
                            // Also Filter out Invalid Problem Tags (like 'welfare')
                            // const problemsWithCounts = Object.entries(problems).filter(([name]) => isValidProblemTag(name)) // 'problems' and 'isValidProblemTag' are not defined in this scope. This line is commented out to maintain syntactical correctness.

                            // Sort Problems: 6 types in specific order (Safe->Env->Eco->Convenience->Performance->Other) or just mapped
                            // ... (sorting logic if needed, or rely on bucket order)
                            if (getColorClass) {
                                colorClass = getColorClass(tag)
                            } else {
                                colorClass = "bg-primary/10 text-primary border-primary"
                            }
                        } else {
                            colorClass = "bg-surface-container text-on-surface-variant/70 border-outline-variant/50"
                        }

                        if (isScamper) {
                            if (!active) {
                                colorClass = "bg-gray-100 text-slate-700 border-transparent hover:bg-gray-200"
                            }
                            colorClass = colorClass.replace(/border-[\w-\/]+|border-\[.*?\]/g, "border-transparent")
                        }

                        return (
                            <button
                                key={tag}
                                onClick={() => toggleFilter(key, tag)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                    !isScamper && "border",
                                    colorClass
                                )}
                            >
                                {/* SCAMPER Rendering */}
                                {/* This block seems to be a misplaced snippet from a different context.
                                    It refers to 'scamper.map' and 'getScamperLabel' which are not defined here.
                                    It is commented out to maintain syntactical correctness.
                                    {scamper.map(([name, count]) => (
                                        <button ...>
                                            <Icon ... />
                                            {getScamperLabel(name)} ({count})
                                        </button>
                                    ))}
                                */}
                                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                                {getLabel ? getLabel(tag) : tag} <span className="opacity-60 text-[10px]">({count})</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 py-4">
            {renderFilterRow("학교 구분", "grade", GRADES, counts.grades)}
            {renderFilterRow("해결하려는 문제 유형", "problem", PROBLEM_TAGS, counts.problems, getProblemColorClass, getProblemIcon)}
            {renderFilterRow("SCAMPER 기법", "scamper", SCAMPER_TAGS, counts.scampers, getScamperColorClass, getScamperIcon, (tag) => {
                // Import getScamperLabel is needed, but we can do inline or import
                // We need to add import to file top
                return getScamperLabel(tag)
            })}
        </div>
    )
}
