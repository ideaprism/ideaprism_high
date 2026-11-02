'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, Check, X, Sparkles, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROBLEM_TYPES, POPULAR_KEYWORDS } from '@/constants/home'
import { cn } from '@/lib/utils'

interface HomeSearchSectionProps {
  isGuestMode: boolean
  onOpenGuide: () => void
}

export function HomeSearchSection({ isGuestMode, onOpenGuide }: HomeSearchSectionProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedProblemType, setSelectedProblemType] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query)
    if (selectedProblemType) params.set('problem', selectedProblemType)
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handlePopularKeywordClick = (keyword: string) => {
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }

  const handleProblemTypeClick = (value: string) => {
    setSelectedProblemType(prev => prev === value ? '' : value)
    setIsDropdownOpen(false)
  }

  const selectedType = PROBLEM_TYPES.find(p => p.value === selectedProblemType)
  const selectedLabel = selectedType?.label || '문제 유형 선택'

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 items-center z-20">
      <div className="w-full relative group">
        <AnimatePresence>
          {isGuestMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 bg-white/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center cursor-not-allowed border border-slate-200/30"
              onClick={onOpenGuide}
            >
              <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-xl shadow-md border border-slate-100">
                <Lock className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-bold text-slate-700">시범서비스 이용 승인 후 전체 검색이 가능합니다</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`w-full flex items-center h-[56px] bg-white border-2 border-primary/10 hover:border-primary/30 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md px-5 ${isGuestMode ? 'opacity-70 pointer-events-none grayscale-[0.2]' : ''}`}>
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="어떤 발명품을 찾고 계신가요?"
            className="flex-[1.5] h-full text-base bg-transparent border-0 focus:ring-0 placeholder:text-slate-400 text-slate-800 font-medium outline-none truncate min-w-0"
            autoFocus
          />

          <div className="relative hidden md:flex items-center h-full ml-auto" ref={dropdownRef}>
            <div className="w-[1px] h-6 bg-slate-200 mx-3"></div>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                        ${selectedType
                  ? `${selectedType.themeColor.bg} ${selectedType.themeColor.text} ${selectedType.themeColor.border}`
                  : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
            >
              {selectedType ? <selectedType.icon className="w-4 h-4" /> : null}
              <span className="truncate max-w-[120px]">{selectedLabel}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} opacity-50`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-3 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-left z-50">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">문제 유형 선택</div>
                {PROBLEM_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = selectedProblemType === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleProblemTypeClick(type.value)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left border-l-2 my-1
                                        ${isSelected
                          ? `${type.themeColor.text} ${type.themeColor.bg} ${type.themeColor.border.replace('border-', 'border-l-')}`
                          : 'text-slate-600 border-transparent hover:bg-slate-50'}`}
                    >
                      <div className={`p-1 rounded-md ${isSelected ? 'bg-white/50' : 'bg-slate-100'}`}>
                        <Icon className={`w-3.5 h-3.5 ${type.themeColor.icon}`} />
                      </div>
                      <span className={`${type.themeColor.text}`}>{type.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-auto opacity-70" />}
                    </button>
                  )
                })}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => handleProblemTypeClick('')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors text-left"
                >
                  <div className="p-1.5 rounded-md bg-slate-100"><X className="w-4 h-4" /></div>
                  선택 해제
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="ml-2 px-6 h-[42px] bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all flex-shrink-0 flex items-center justify-center whitespace-nowrap"
          >
            검색
          </button>
        </div>
      </div>

      <div className="md:hidden w-full overflow-x-auto pb-2 -mt-2">
        <div className="flex px-1 gap-2">
          {PROBLEM_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleProblemTypeClick(type.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all 
                        ${selectedProblemType === type.value
                  ? 'bg-primary/5 border-primary text-primary'
                  : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 relative z-20">
        <AnimatePresence>
          {isGuestMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-[13px] font-black rounded-full border border-primary/20 shadow-sm animate-bounce-slow">
                <Sparkles className="w-3.5 h-3.5 fill-primary" />
                체험 모드에서는 인기 검색어로 기능을 둘러보실 수 있습니다
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "flex flex-wrap items-center justify-center gap-3 p-6 transition-all duration-500",
          isGuestMode ? "bg-white border-2 border-primary/30 rounded-[28px] shadow-[0_10px_40px_rgba(var(--primary-rgb),0.1)] ring-4 ring-primary/5" : ""
        )}>
          <span className="text-on-surface-variant/70 text-sm font-medium mr-1">인기 검색어:</span>
          {POPULAR_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              onClick={() => handlePopularKeywordClick(keyword)}
              className={cn(
                "px-5 py-2 transition-all hover:scale-105 active:scale-95 duration-200",
                isGuestMode 
                  ? "bg-primary text-white font-bold rounded-2xl shadow-md hover:shadow-primary/30" 
                  : "bg-surface-container-low/50 hover:bg-primary/10 border border-outline-variant/30 rounded-full text-sm text-on-surface-variant hover:text-primary hover:border-primary/30"
              )}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
