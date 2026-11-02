/**
 * KIPRIS 검색식 생성 유틸리티
 */

import { createClient } from '@/utils/supabase/client'

// 카테고리별 한글 레이블
export const CATEGORY_LABELS: Record<string, string> = {
    principle: '기술/원리 키워드',
    structure: '구조 키워드',
    function: '기능 키워드',
    domain: '대상물 키워드',
    product: '제품 키워드',
    stopword: '불용어'
}

// 검색식에 포함할 카테고리 우선순위 (stopword 제외)
export const FORMULA_CATEGORIES = ['principle', 'domain', 'function'] as const

export interface KeywordMatch {
    word: string
    category: string
    priority: number
}

export interface KeywordGroup {
    category: string
    label: string
    keywords: string[]
}

export interface SearchFormula {
    formula: string
    ipc: string | null
    groups: KeywordGroup[]
}

/**
 * Supabase에서 keyword_dictionary 전체 조회
 */
export async function fetchKeywordDictionary(): Promise<KeywordMatch[]> {
    const supabase = createClient()

    const { data, error } = await (supabase as any)
        .from('keyword_dictionary')
        .select('word, category, priority')
        .neq('category', 'stopword')
        .order('priority', { ascending: true })

    if (error) {
        console.error('Failed to fetch keyword dictionary:', error)
        return []
    }

    return (data as KeywordMatch[]) || []
}

/**
 * IPC 코드 설명 조회
 */
export async function fetchIpcDescription(ipcCode: string): Promise<string | null> {
    if (!ipcCode) return null

    const supabase = createClient()

    const { data, error } = await (supabase as any)
        .from('ipc_descriptions')
        .select('description')
        .eq('ipc_code', ipcCode)
        .single()

    if (error || !data) {
        return null
    }

    return data.description
}

/**
 * simple_title에서 사전 기반 키워드 추출
 */
export function extractKeywords(title: string, dictionary: KeywordMatch[]): KeywordMatch[] {
    if (!title) return []

    const matches: KeywordMatch[] = []
    const titleLower = title.toLowerCase()

    // 우선순위 순으로 정렬된 사전에서 매칭
    for (const entry of dictionary) {
        if (titleLower.includes(entry.word.toLowerCase())) {
            // 중복 방지
            if (!matches.some(m => m.word === entry.word)) {
                matches.push(entry)
            }
        }
    }

    return matches
}

/**
 * 키워드를 카테고리별로 그룹화
 */
export function groupKeywordsByCategory(keywords: KeywordMatch[]): KeywordGroup[] {
    const grouped: Record<string, string[]> = {}

    for (const kw of keywords) {
        if (!grouped[kw.category]) {
            grouped[kw.category] = []
        }
        grouped[kw.category].push(kw.word)
    }

    // FORMULA_CATEGORIES 순서로 정렬된 그룹 반환
    const result: KeywordGroup[] = []

    for (const cat of FORMULA_CATEGORIES) {
        if (grouped[cat] && grouped[cat].length > 0) {
            result.push({
                category: cat,
                label: CATEGORY_LABELS[cat] || cat,
                keywords: grouped[cat]
            })
        }
    }

    // 나머지 카테고리 추가
    for (const cat of Object.keys(grouped)) {
        if (!FORMULA_CATEGORIES.includes(cat as any) && cat !== 'stopword') {
            result.push({
                category: cat,
                label: CATEGORY_LABELS[cat] || cat,
                keywords: grouped[cat]
            })
        }
    }

    return result
}

/**
 * 검색식 생성 (KIPRIS 형식: IPC=[IPC코드]*키워드1*키워드2*(키워드3+키워드4))
 */
export function generateSearchFormula(
    ipc: string | null,
    keywords: KeywordMatch[]
): SearchFormula {
    const groups = groupKeywordsByCategory(keywords)

    // 각 그룹을 검색식 형태로 변환
    const parts: string[] = []

    // IPC는 IPC=[코드] 형식으로 추가
    if (ipc) {
        parts.push(`IPC=[${ipc}]`)
    }

    // 각 카테고리 그룹을 괄호로 묶어 추가
    for (const group of groups) {
        if (group.keywords.length === 1) {
            parts.push(group.keywords[0])
        } else if (group.keywords.length > 1) {
            parts.push(`(${group.keywords.join('+')})`)
        }
    }

    const formula = parts.join('*')

    return {
        formula,
        ipc,
        groups
    }
}
