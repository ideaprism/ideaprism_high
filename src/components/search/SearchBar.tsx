'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    onSearch: () => void
    isValid: boolean
    placeholder?: string
}

export function SearchBar({
    value,
    onChange,
    onSearch,
    isValid,
    placeholder = "어떤 발명품을 찾고 계신가요?"
}: SearchBarProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch()
        }
    }

    return (
        <div className="py-8 bg-transparent">
            <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="relative w-full h-[52px] bg-white border-2 border-primary/10 hover:border-primary/30 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-primary/60" />
                        </div>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="w-full h-full pl-14 pr-24 text-lg bg-transparent border-0 focus:ring-0 placeholder:text-slate-400 text-slate-800 font-medium outline-none rounded-2xl"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <button
                                onClick={onSearch}
                                disabled={!isValid}
                                className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all
                                        ${isValid
                                        ? 'bg-primary hover:bg-primary-dark shadow-sm'
                                        : 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none'}`}
                            >
                                검색
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
