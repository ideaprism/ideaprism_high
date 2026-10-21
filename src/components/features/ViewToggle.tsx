'use client'

import { LayoutGrid, List } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ViewToggle() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentView = searchParams.get('view') || 'grid'

    const setView = (view: 'grid' | 'list') => {
        const params = new URLSearchParams(Array.from(searchParams.entries()))
        params.set('view', view)
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/30">
            <button
                onClick={() => setView('grid')}
                className={cn(
                    "p-1.5 rounded-md transition-all",
                    currentView === 'grid'
                        ? "bg-surface shadow-sm text-on-surface"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50"
                )}
                aria-label="Grid view"
            >
                <LayoutGrid className="w-5 h-5" />
            </button>
            <button
                onClick={() => setView('list')}
                className={cn(
                    "p-1.5 rounded-md transition-all",
                    currentView === 'list'
                        ? "bg-surface shadow-sm text-on-surface"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50"
                )}
                aria-label="List view"
            >
                <List className="w-5 h-5" />
            </button>
        </div>
    )
}
