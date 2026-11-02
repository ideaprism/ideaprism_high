/**
 * 특허 검색식 해석 → KIPRIS 실제 질의 생성
 *
 * 화면 검색식 예: IPC=[A47G]*우산꽂이*(서랍+빗물받이)
 *  - IPC=[...]  : IPC 코드 (키워드 검색어에 섞지 않음. 결과의 IPC 일치 표시에 사용)
 *  - *          : AND (그룹 구분)
 *  - +          : OR (같은 그룹 안의 대체어)
 *
 * 예전 동작: 연산자·괄호를 전부 지우고 IPC 코드까지 단어로 섞어
 *   'A47G 우산꽂이 서랍 빗물받이'를 자유어 검색 → 표시식과 실제 질의가 달랐음.
 *
 * 두 방식을 지원한다.
 *  - 연산자 방식(기본, 2026-10-27 실측으로 KIPRIS 지원 확인): IPC=[A47G]*우산꽂이*(서랍+빗물받이)를
 *    그대로 전송. 0건이면 IPC 제외 → 뒤쪽 항목 제외 순으로 다시 조회
 *  - 대표어 방식(KIPRIS_WORD_OPERATORS=false 일 때): 그룹마다 첫 키워드만 공백으로 이어 전송(AND).
 *    0건이면 뒤쪽 그룹부터 하나씩 빼며 다시 조회
 * 어느 방식이든 실제로 쓴 질의를 화면에 알린다.
 */
import { parseSearchQuery, type SearchNode } from './search-parser'

export interface ParsedFormula {
  /** IPC 코드 (예: A47G, A45B 25/00). 없으면 null */
  ipc: string | null
  /** AND로 묶이는 그룹들. 각 그룹은 OR 대체어 목록 */
  groups: string[][]
}

const IPC_PATTERN = /IPC\s*=\s*\[([^\]]*)\]/i

export class InvalidFormulaError extends Error {}

/** 키워드 하나 정리: KIPRIS 질의를 깨뜨리는 문자 제거 */
function cleanKeyword(s: string): string {
  return s.replace(/[*+()[\]"=]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Keep a multiword alternative as one phrase through the entire round trip. */
export function quoteFormulaKeyword(keyword: string): string {
  const cleaned = cleanKeyword(keyword)
  return /\s/.test(cleaned) ? `"${cleaned}"` : cleaned
}

function flattenTerms(node: SearchNode): string[] {
  if (node.type === 'TERM') return [node.value]
  if (node.type === 'AND') {
    throw new InvalidFormulaError('AND 조건을 OR 괄호 안에 넣는 검색식은 지원하지 않습니다. 우산*(자전거+의자) 형태로 입력해 주세요.')
  }
  return [...flattenTerms(node.left), ...flattenTerms(node.right)]
}

/** AND로 연결된 OR 그룹만 허용한다. 지원하지 않는 식의 의미를 바꾸지 않는다. */
function toGroups(node: SearchNode): string[][] {
  if (node.type === 'AND') return [...toGroups(node.left), ...toGroups(node.right)]
  return [flattenTerms(node)]
}

export function parseFormula(formula: string): ParsedFormula {
  if (formula.length > 1000) throw new InvalidFormulaError('특허 검색식은 1000자 이하로 입력해 주세요.')
  const ipcMatch = formula.match(IPC_PATTERN)
  const ipcConditions = formula.match(/IPC\s*=/gi) ?? []
  if (ipcConditions.length > 1 || (ipcConditions.length > 0 && !ipcMatch)) {
    throw new InvalidFormulaError('검색식에는 완성된 IPC=[분류] 조건을 앞에 한 번만 입력해 주세요.')
  }
  const ipc = ipcMatch ? ipcMatch[1].trim() || null : null

  // IPC는 식 앞의 분류 조건만 지원한다. 단어 부분의 잘못된 연산자는 지우지 않는다.
  if (ipcMatch && (ipcMatch.index !== formula.search(/\S/) || !/^[A-HY]\d{2}[A-Z](?:\s*\d+(?:\/\d+)?)?$/i.test(ipc ?? ''))) {
    throw new InvalidFormulaError('검색식의 IPC 분류를 확인해 주세요.')
  }
  let rest = formula.trim()
  if (ipcMatch) {
    rest = rest.slice(ipcMatch[0].length).trim()
    if (rest && !rest.startsWith('*')) throw new InvalidFormulaError('IPC 뒤의 검색식은 *로 연결해 주세요.')
    if (rest === '*') throw new InvalidFormulaError('IPC 뒤에 검색어를 입력해 주세요.')
    rest = rest.replace(/^\*/, '').trim()
  }
  if (!rest) return { ipc, groups: [] }

  const node = parseSearchQuery(rest)
  if (!node) throw new InvalidFormulaError('검색식의 괄호, 따옴표와 연산자를 확인해 주세요.')

  const groups = toGroups(node)
    .map((g) => [...new Set(g.map(cleanKeyword).filter(Boolean))])
    .filter((g) => g.length > 0)

  return { ipc, groups }
}

/** 연산자 방식 질의 문자열 */
export function toOperatorQuery(groups: string[][]): string {
  return groups.map((g) => {
    const terms = g.map(quoteFormulaKeyword)
    return terms.length > 1 ? `(${terms.join('+')})` : terms[0]
  }).join('*')
}

/**
 * 대표어 방식 질의 후보 (엄격 → 완화 순)
 * 예: [[우산꽂이],[서랍,빗물받이],[화분]] → ['우산꽂이 서랍 화분', '우산꽂이 서랍', '우산꽂이']
 */
export function toRepresentativeQueries(groups: string[][]): string[] {
  const reps = groups.map((g) => g[0])
  const out: string[] = []
  for (let n = reps.length; n >= 1; n--) out.push(reps.slice(0, n).join(' '))
  return out
}

export interface QueryCandidate {
  word: string
  /** IPC 조건을 포함했는지 */
  ipcApplied: boolean
}

/**
 * 연산자 방식 질의 후보 (엄격 → 완화 순)
 * 2026-10-27 실측: KIPRIS word는 *(AND), +(OR), 괄호, IPC=[...] 를 해석함
 *   ('우산꽂이' 807건 / 'IPC=[A45B]*우산꽂이' 306건 / '우산꽂이+서랍' 26,959건)
 * 1) IPC 포함 전체식 → 2) IPC 뺀 전체식 (IPC 자동선택이 틀린 경우 대비)
 * 3) 뒤쪽 항목부터 하나씩 뺀 식
 */
export function toOperatorCandidates(parsed: ParsedFormula): QueryCandidate[] {
  const out: QueryCandidate[] = []
  const full = toOperatorQuery(parsed.groups)
  if (parsed.ipc) out.push({ word: `IPC=[${parsed.ipc}]*${full}`, ipcApplied: true })
  for (let n = parsed.groups.length; n >= 1; n--) {
    out.push({ word: toOperatorQuery(parsed.groups.slice(0, n)), ipcApplied: false })
  }
  return out
}

/** 사람이 읽는 표시용 (화면 '실제 조회' 안내) */
export function describeQuery(word: string, operatorMode: boolean): string {
  return operatorMode ? word : word.split(' ').join(' AND ')
}

/**
 * 결과 특허의 IPC가 검색식 IPC와 맞는지
 * KIPRIS ipcNumber 예: 'A47G 25/12|A45B 25/00'
 * 검색식 IPC가 'A47G'면 서브클래스 일치, 'A47G 25/12'면 그룹까지 일치 비교
 */
export function ipcMatches(patentIpc: string | undefined, queryIpc: string | null): boolean {
  if (!patentIpc || !queryIpc) return false
  const norm = (s: string) => s.toUpperCase().replace(/\s+/g, '')
  const q = norm(queryIpc)
  return patentIpc.split(/[|,;]/).some((code) => norm(code).startsWith(q))
}
