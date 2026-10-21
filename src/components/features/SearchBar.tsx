'use client'

import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
    className?: string
    initialValue?: string
    placeholder?: string
}

export function SearchBar({ className, initialValue = '', placeholder = "어떤 발명품을 찾고 계신가요?", targetPath = "/search" }: SearchBarProps & { targetPath?: string }) {
    const router = useRouter()
    const [query, setQuery] = useState(initialValue)

    const handleSearch = () => {
        if (!query.trim()) return
        router.push(`${targetPath}?q=${encodeURIComponent(query)}`)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className={cn("relative w-full max-w-2xl mx-auto group", className)}>
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full h-full pl-14 pr-16 text-lg bg-transparent border-0 focus:ring-0 placeholder:text-on-surface-variant/50 outline-none rounded-full"
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                    onClick={handleSearch}
                    className="group/btn relative px-5 py-2 rounded-full overflow-hidden transition-all duration-300"
                >
                    {/* Gradient Border Background (Visible on Hover) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />

                    {/* Inner Background (Creates the border effect) */}
                    <div className="absolute inset-[1.5px] bg-surface-container-low rounded-full z-0" />

                    {/* Button Text */}
                    <span className="relative z-10 text-sm font-bold bg-clip-text text-primary group-hover/btn:text-on-surface transition-colors">
                        검색
                    </span>
                </button>
            </div>
        </div>
    )
}
