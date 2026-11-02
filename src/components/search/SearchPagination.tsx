'use client'

import { cn } from '@/lib/utils'

interface SearchPaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function SearchPagination({ page, totalPages, onPageChange }: SearchPaginationProps) {
    if (totalPages <= 1) return null

    const maxVisible = 7
    let start = Math.max(1, page - 3)
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
    }

    const pages = []
    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    return (
        <div className="flex justify-center gap-2 mt-16 pb-12">
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-bold transition-all",
                    page === 1 && "opacity-40 pointer-events-none",
                    "bg-surface text-on-surface hover:bg-surface-variant/50 border-outline-variant/30"
                )}
            >
                &lt;
            </button>

            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-bold transition-all",
                        p === page
                            ? "bg-slate-900 text-white border-transparent"
                            : "bg-surface text-on-surface hover:bg-surface-variant/50 border-outline-variant/30"
                    )}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-bold transition-all",
                    page === totalPages && "opacity-40 pointer-events-none",
                    "bg-surface text-on-surface hover:bg-surface-variant/50 border-outline-variant/30"
                )}
            >
                &gt;
            </button>
        </div>
    )
}
