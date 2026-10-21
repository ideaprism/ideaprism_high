'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProblemColorClass, getScamperColorClass, getProblemIcon, getScamperIcon, getScamperLabel } from '@/utils/tag-styles'
import { GRADES, PROBLEM_TAGS, SCAMPER_TAGS } from '@/constants/filter'
import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface FilterPanelProps {
    className?: string
    mobileOpen?: boolean
    onClose?: () => void
}

// Lucide 아이콘 이름을 컴포넌트로 변환
const getIconComponent = (iconName: string): LucideIcon | null => {
    const pascalCase = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')

    return (LucideIcons as any)[pascalCase] || null
}

export function FilterPanel({ className, mobileOpen, onClose }: FilterPanelProps) {
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

    const isSelected = (key: string, value: string) => {
        return searchParams.getAll(key).includes(value)
    }

    const clearFilters = () => {
        const current = new URLSearchParams(Array.from(searchParams.entries()))
        current.delete('grade')
        current.delete('problem')
        current.delete('scamper')
        current.set('page', '1')
        router.push(`/search?${current.toString()}`)
    }

    // Render tag with icon
    const renderTagWithIcon = (tag: string, filterKey: string, getColorClass: (tag: string) => string, getIconName: (tag: string) => string) => {
        const IconComponent = getIconComponent(getIconName(tag))
        return (
            <button
                key={tag}
                onClick={() => toggleFilter(filterKey, tag)}
                className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border",
                    isSelected(filterKey, tag)
                        ? getColorClass(tag)
                        : "bg-surface-container text-on-surface-variant/70 border-outline-variant/50"
                )}
            >
                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                {tag}
            </button>
        )
    }

    return (
        <aside className={cn(
            "w-64 flex-shrink-0 bg-surface border-r border-outline-variant/20 h-full overflow-y-auto p-6 transition-transform duration-300 ease-in-out z-40",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            "fixed lg:relative top-[64px] lg:top-0 bottom-0 lg:h-[calc(100vh-64px)]",
            className
        )}>
            <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-bold text-lg text-on-surface">필터</h3>
                <Button variant="text" className="!p-2" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="space-y-8">
                {/* Reset Button */}
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-on-surface hidden lg:block">필터</h3>
                    <button
                        onClick={clearFilters}
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        초기화
                    </button>
                </div>

                {/* Grade Filter */}
                <div>
                    <h4 className="font-semibold text-sm text-on-surface mb-3">학교 구분</h4>
                    <div className="flex flex-wrap gap-2">
                        {GRADES.map((grade) => (
                            <Chip
                                key={grade}
                                label={grade}
                                active={isSelected('grade', grade)}
                                onClick={() => toggleFilter('grade', grade)}
                            />
                        ))}
                    </div>
                </div>

                {/* Problem Tags Filter */}
                <div>
                    <h4 className="font-semibold text-sm text-on-surface mb-3">문제유형</h4>
                    <div className="flex flex-wrap gap-2">
                        {PROBLEM_TAGS.map((tag) => renderTagWithIcon(tag, 'problem', getProblemColorClass, getProblemIcon))}
                    </div>
                </div>

                {/* SCAMPER Filter */}
                <div>
                    <h4 className="font-semibold text-sm text-on-surface mb-3">SCAMPER 기법</h4>
                    <div className="flex flex-wrap gap-2">
                        {SCAMPER_TAGS.map((tag) => {
                            const IconComponent = getIconComponent(getScamperIcon(tag))
                            return (
                                <button
                                    key={tag}
                                    onClick={() => toggleFilter('scamper', tag)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                        isSelected('scamper', tag)
                                            ? getScamperColorClass(tag)
                                            : "bg-gray-100 text-slate-700 hover:bg-gray-200"
                                    )}
                                >
                                    {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                                    {getScamperLabel(tag)}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </aside>
    )
}
