/**
 * 내부 발명 검색: 검색어 해석 + 관련도 점수
 *
 * - 연산자(*, +, 괄호, 따옴표)가 있으면 기존 Boolean 파서(search-parser) 사용
 * - 연산자가 없는 일반 입력(문장 포함)은 단어로 나눠 불용어·조사를 정리한 뒤
 *   "모든 단어 포함(AND)" 결과와 "하나라도 포함(OR)" 결과를 합쳐 점수순으로 정렬
 *   → '비 오는 날 교실 바닥' 같은 문장이 0건이 되지 않음
 */
import { parseSearchQuery, buildPostgrestFilter, sanitizeTerm, type SearchNode } from './search-parser'

/** 검색 대상 컬럼 (ilike) */
export const SEARCH_COLUMNS = ['original_title', 'simple_title', 'simple_summary', 'detailed_summary'] as const

/** 검색어에서 버리는 단어 (뜻이 약하거나 거의 모든 글에 나오는 말) */
const STOPWORDS = new Set([
  // 일반 명사·의존 명사
  '날', '때', '것', '수', '등', '및', '중', '곳', '경우', '문제', '방법', '관련', '내용', '정도',
  // 동사·형용사 활용형
  '하는', '되는', '있는', '없는', '오는', '가는', '오면', '내리는', '내리면', '내릴', '맞는', '맞으면', '같은', '위한', '위해', '대한', '통한', '통해',
  '이용한', '활용한', '사용한', '만든', '만드는', '쉬운', '좋은',
  // 요청 표현
  '찾아줘', '찾아', '알려줘', '보여줘', '추천', '어떤', '무엇', '뭐',
  // 발명 제목에 너무 흔한 말
  '장치', '기구', '도구', '기능', '이용', '활용', '사용',
])

/** 단어 끝 조사 (긴 것부터 검사) */
const JOSA = ['에서는', '에서', '으로', '에게', '까지', '부터', '처럼', '보다', '이랑', '하고',
  '의', '을', '를', '은', '는', '이', '가', '에', '로', '와', '과', '도', '만', '랑']

function stripJosa(word: string): string {
  for (const j of JOSA) {
    // 남는 부분이 2글자 이상일 때만 떼어냄 ('의자' → '의자' 유지, '우산이' → '우산')
    if (word.length - j.length >= 2 && word.endsWith(j)) return word.slice(0, -j.length)
  }
  return word
}

/**
 * 학생이 쓰는 말 → DB(수상작 요약)에서 실제로 쓰는 표현
 * 2026-10-27 실측: '잔반'은 DB 전체 3건뿐이고 '음식물 쓰레기'가 대부분, '비 오는'은 '빗물'로 표현됨.
 * 단어가 이 표에 있으면 대체어 중 하나만 맞아도 그 단어를 포함한 것으로 본다.
 * (장기적으로는 DB keyword_dictionary로 옮길 것)
 */
const SYNONYMS: Record<string, string[]> = {
  잔반: ['잔반', '음식물 쓰레기', '남은 음식', '음식 찌꺼기'],
  음식물쓰레기: ['음식물 쓰레기', '잔반'],
  빗물: ['빗물', '우천', '장마'],
  우천: ['우천', '빗물', '장마'],
  젖음: ['물기', '젖은', '젖음', '젖는'],
  젖은: ['물기', '젖은', '젖음', '젖는'],
  젖는: ['물기', '젖은', '젖음', '젖는'],
  물기: ['물기', '젖은', '젖음'],
  미끄럼: ['미끄럼', '미끄러'],
  미끄러짐: ['미끄럼', '미끄러'],
  분리수거: ['분리수거', '분리배출'],
  분리배출: ['분리배출', '분리수거'],
  쓰레기통: ['쓰레기통', '휴지통'],
  휴지통: ['휴지통', '쓰레기통'],
}

/** '비 오는', '비가 내리는' 처럼 날씨를 뜻하는 '비'인지 */
const RAIN_FOLLOWERS = /^(오는|오면|올|온|내리는|내리면|내릴|맞는|맞으면)$/

/** 연산자 없는 일반 입력을 검색 단어 목록으로 변환 */
export function tokenizePlainQuery(input: string): string[] {
  const raw = input
    .split(/\s+/)
    .map((w) => sanitizeTerm(w))
    .filter(Boolean)

  const tokens: string[] = []
  raw.forEach((w, i) => {
    let t = stripJosa(w)
    // '비 오는 날' → 1글자 '비' 대신 DB 표현 '빗물'
    if ((t === '비' || w === '비가') && RAIN_FOLLOWERS.test(raw[i + 1] ?? '')) t = '빗물'
    if (STOPWORDS.has(t) || STOPWORDS.has(w)) return
    if (!tokens.includes(t)) tokens.push(t)
  })

  // 1글자 단어('비', '물')는 다른 단어가 있으면 제외 (너무 많은 글과 일치)
  const multi = tokens.filter((t) => t.length >= 2)
  if (multi.length > 0) return multi

  // 전부 걸러졌으면 원래 단어로 되돌림 (사용자가 입력한 걸 버리지 않음)
  return tokens.length > 0 ? tokens : raw.slice(0, 1)
}

/** 단어 → 대체어 그룹 (동의어 표에 없으면 자기 자신만) */
export function expandSynonyms(token: string): string[] {
  return SYNONYMS[token] ?? [token]
}

/**
 * groups: 검색 단어마다 대체어 묶음. 예) '급식 잔반' → [['급식'], ['잔반','음식물 쓰레기',...]]
 * 묶음끼리는 AND(모두 포함) 또는 OR(하나라도 포함), 묶음 안은 OR.
 */
export type AnalyzedQuery =
  | { mode: 'boolean'; node: SearchNode; groups: string[][] }
  | { mode: 'plain'; groups: string[][] }

const OPERATOR_PATTERN = /[*+()"]/

/** 검색어 해석: Boolean 식인지, 일반 입력인지 */
export function analyzeQuery(keyword: string): AnalyzedQuery {
  const trimmed = keyword.trim()
  if (OPERATOR_PATTERN.test(trimmed)) {
    const node = parseSearchQuery(trimmed)
    if (node) {
      const terms = collectTerms(node)
      // 고급 검색식은 사용자가 쓴 그대로 (동의어 확장 안 함)
      if (terms.length > 0) return { mode: 'boolean', node, groups: terms.map((t) => [t]) }
    }
  }
  return { mode: 'plain', groups: tokenizePlainQuery(trimmed).map(expandSynonyms) }
}

function collectTerms(node: SearchNode): string[] {
  if (node.type === 'TERM') {
    const v = sanitizeTerm(node.value)
    return v ? [v] : []
  }
  return [...new Set([...collectTerms(node.left), ...collectTerms(node.right)])]
}

/** 단어 하나가 검색 컬럼 중 하나에 포함되는 조건 */
function termCondition(term: string, columns: readonly string[]): string {
  return columns.map((col) => `${col}.ilike.%${term}%`).join(',')
}

/** 대체어 묶음 하나: 대체어 중 하나라도 어느 컬럼에든 포함 */
function groupCondition(group: string[], columns: readonly string[]): string {
  return group.map((t) => termCondition(t, columns)).join(',')
}

/**
 * PostgREST .or() 에 넣을 필터 문자열 생성
 * - all: 모든 묶음 포함 / any: 하나라도 포함
 */
export function buildTermsFilter(groups: string[][], columns: readonly string[], join: 'all' | 'any'): string {
  if (groups.length === 1) return groupCondition(groups[0], columns)
  const parts = groups.map((g) => `or(${groupCondition(g, columns)})`)
  return join === 'all' ? `and(${parts.join(',')})` : parts.join(',')
}

/** Boolean 식 필터 (기존 파서 재사용, 값은 파서에서 이스케이프됨) */
export function buildBooleanFilter(node: SearchNode, columns: readonly string[]): string {
  return buildPostgrestFilter(node, [...columns])
}

// ============================================
// 관련도 점수
// ============================================

export interface ScorableInvention {
  id: string
  simple_title?: string | null
  original_title?: string | null
  simple_summary?: string | null
  detailed_summary?: string | null
  problem?: string | null
  solution?: string | null
}

/** 컬럼별 가중치 (제목에 있을수록 관련도 높음) */
const FIELD_WEIGHTS: [keyof ScorableInvention, number][] = [
  ['simple_title', 3],
  ['original_title', 1.5],
  ['simple_summary', 1],
  ['detailed_summary', 0.5],
  ['problem', 0.3],
  ['solution', 0.3],
]

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, '')
}

/** 단어 하나의 점수 (컬럼 가중치 합 + 제목 맨 앞 가산) */
function termScore(inv: ScorableInvention, title: string, term: string): number {
  const t = norm(term)
  if (!t) return 0
  let s = 0
  for (const [field, weight] of FIELD_WEIGHTS) {
    if (norm(inv[field] as string | null | undefined).includes(t)) s += weight
  }
  // 제목 맨 앞에 오면 약간 가산 ('우산꽂이' > '휴대용 우산')
  if (s > 0 && title.startsWith(t)) s += 0.5
  return s
}

/** groups: 검색 단어별 대체어 묶음 (string[]을 주면 단어 하나씩 묶음으로 취급) */
export function scoreInvention(inv: ScorableInvention, keyword: string, groups: string[][] | string[]): number {
  const gs: string[][] = groups.map((g) => (Array.isArray(g) ? g : [g]))
  const title = norm(inv.simple_title)
  const phrase = norm(keyword)
  let score = 0

  // 입력 전체가 제목과 같거나 제목에 그대로 들어있으면 가산
  if (phrase && title === phrase) score += 6
  else if (phrase.length >= 2 && title.includes(phrase)) score += 2

  let matched = 0
  for (const group of gs) {
    // 원래 단어(첫 번째)가 맞으면 그대로, 대체어로만 맞으면 약간 낮게
    const best = Math.max(0, ...group.map((t, i) => termScore(inv, title, t) * (i === 0 ? 1 : 0.8)))
    if (best > 0) matched++
    score += best
  }

  // 여러 단어 중 몇 개를 포함했는지 (문장 검색에서 핵심). 모두 포함한 발명이 확실히 위로 오도록 크게
  if (gs.length > 1) score += (matched / gs.length) * 6

  return score
}

/** 점수 내림차순 정렬. 동점이면 제목이 짧은(주제가 뚜렷한) 순 */
export function rankInventions<T extends ScorableInvention>(items: T[], keyword: string, groups: string[][] | string[]): T[] {
  return items
    .map((item) => ({ item, score: scoreInvention(item, keyword, groups) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const la = (a.item.simple_title ?? '').length
      const lb = (b.item.simple_title ?? '').length
      if (la !== lb) return la - lb
      return a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0
    })
    .map((x) => x.item)
}
