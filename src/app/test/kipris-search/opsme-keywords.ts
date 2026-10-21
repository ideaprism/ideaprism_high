/**
 * OPSME 키워드 유틸리티
 * 
 * OPSME 구조:
 * - O (Object): 발명대상
 * - P (Problem): 문제점
 * - S (Solution): 해결수단
 * - M (Method): 방법/원리
 * - E (Effect): 효과
 */

// OPSME 카테고리 정의
export const OPSME_CATEGORIES = {
    O: { code: 'O', name: '발명대상', label: 'Object' },
    P: { code: 'P', name: '문제점', label: 'Problem' },
    S: { code: 'S', name: '해결수단', label: 'Solution' },
    M: { code: 'M', name: '방법/원리', label: 'Method' },
    E: { code: 'E', name: '효과', label: 'Effect' },
} as const;

export type OPSMECategory = keyof typeof OPSME_CATEGORIES;

// OPSME 키워드 구조
export interface OPSMEKeywords {
    O: string[];  // Object: 발명대상
    P: string[];  // Problem: 문제점
    S: string[];  // Solution: 해결수단
    M: string[];  // Method: 방법/원리
    E: string[];  // Effect: 효과
}

// 파싱된 키워드 데이터
export interface ParsedKiprisKeywords {
    simple: OPSMEKeywords;
    expert: OPSMEKeywords;
    completeness?: string;  // 완성도 점수
}

/**
 * 키프리스 검색 키워드 문자열을 파싱
 * 
 * 형식 예시:
 * [Simple]O:우산꽂이 @ P:공간부족 @ S:경첩 @ M:접이식 @ E:공간절약 
 * || 
 * [Expert]O:우산꽂이+"우산 거치대"+거치대 @ P:공간부족+"공간 점유" @ S:경첩+힌지 @ M:접이식+폴딩 @ E:공간절약+다용도 @ 완성도: '5점'
 */
export function parseKiprisKeywords(keywordString: string): ParsedKiprisKeywords {
    const result: ParsedKiprisKeywords = {
        simple: { O: [], P: [], S: [], M: [], E: [] },
        expert: { O: [], P: [], S: [], M: [], E: [] },
    };

    if (!keywordString) return result;

    // Simple과 Expert 부분 분리
    const parts = keywordString.split('||').map(s => s.trim());

    for (const part of parts) {
        const isSimple = part.includes('[Simple]');
        const isExpert = part.includes('[Expert]');

        if (!isSimple && !isExpert) continue;

        const targetKeywords = isSimple ? result.simple : result.expert;

        // [Simple] 또는 [Expert] 태그 제거
        let cleanPart = part.replace(/\[Simple\]|\[Expert\]/g, '').trim();

        // 완성도 추출 (Expert에만 있음)
        const completenessMatch = cleanPart.match(/완성도:\s*'([^']+)'/);
        if (completenessMatch) {
            result.completeness = completenessMatch[1];
            cleanPart = cleanPart.replace(/\s*@?\s*완성도:\s*'[^']+'/g, '').trim();
        }

        // @ 구분자로 분리
        const segments = cleanPart.split('@').map(s => s.trim()).filter(s => s);

        for (const segment of segments) {
            // O:키워드 형식 파싱
            const match = segment.match(/^([OPSME]):(.+)$/);
            if (!match) continue;

            const [, category, keywordPart] = match;

            // 키워드 파싱: + 로 연결된 것과 "따옴표로 묶인 것" 처리
            const keywords = parseKeywordPart(keywordPart);

            if (category in targetKeywords) {
                targetKeywords[category as OPSMECategory] = keywords;
            }
        }
    }

    return result;
}

/**
 * 키워드 부분 파싱
 * 예: 우산꽂이+"우산 거치대"+거치대 -> ['우산꽂이', '우산 거치대', '거치대']
 */
function parseKeywordPart(keywordPart: string): string[] {
    const keywords: string[] = [];

    // 따옴표로 묶인 키워드와 일반 키워드를 모두 추출
    // "키워드" 또는 일반키워드
    const regex = /"([^"]+)"|([^+]+)/g;
    let match;

    while ((match = regex.exec(keywordPart)) !== null) {
        const keyword = (match[1] || match[2] || '').trim();
        if (keyword) {
            keywords.push(keyword);
        }
    }

    return keywords;
}

/**
 * OPSME 키워드를 검색식으로 변환
 * 
 * 형식: IPC=[IPC코드]*대상물*(해결수단1+해결수단2)*방법
 */
export function generateOPSMESearchFormula(
    ipc: string | null,
    keywords: OPSMEKeywords,
    options?: {
        includeCategories?: OPSMECategory[];  // 포함할 카테고리 (기본: 전체)
    }
): string {
    const parts: string[] = [];
    const categoriesToInclude = options?.includeCategories || (['O', 'P', 'S', 'M', 'E'] as OPSMECategory[]);

    // IPC 코드 추가
    if (ipc?.trim()) {
        parts.push(`IPC=[${ipc.trim()}]`);
    }

    // 각 카테고리별 키워드 추가
    for (const category of categoriesToInclude) {
        const categoryKeywords = keywords[category];
        if (!categoryKeywords || categoryKeywords.length === 0) continue;

        if (categoryKeywords.length === 1) {
            parts.push(categoryKeywords[0]);
        } else {
            // 여러 키워드는 OR(+)로 묶어서 괄호 처리
            parts.push(`(${categoryKeywords.join('+')})`);
        }
    }

    return parts.join('*');
}

/**
 * OPSME 키워드를 템플릿 필드 형식으로 변환
 */
export interface OPSMETemplateFields {
    ipc: string;
    object: string;     // O: 발명대상
    problem: string;    // P: 문제점
    solution: string;   // S: 해결수단
    method: string;     // M: 방법/원리
    effect: string;     // E: 효과
}

export function keywordsToTemplateFields(
    ipc: string | null,
    keywords: OPSMEKeywords
): OPSMETemplateFields {
    return {
        ipc: ipc || '',
        object: keywords.O.join(', '),
        problem: keywords.P.join(', '),
        solution: keywords.S.join(', '),
        method: keywords.M.join(', '),
        effect: keywords.E.join(', '),
    };
}

/**
 * 템플릿 필드에서 OPSME 키워드로 변환
 */
export function templateFieldsToKeywords(fields: OPSMETemplateFields): OPSMEKeywords {
    const parseField = (value: string): string[] => {
        return value
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    return {
        O: parseField(fields.object),
        P: parseField(fields.problem),
        S: parseField(fields.solution),
        M: parseField(fields.method),
        E: parseField(fields.effect),
    };
}

/**
 * 템플릿 필드에서 직접 검색식 생성
 */
export function templateFieldsToFormula(fields: OPSMETemplateFields): string {
    const keywords = templateFieldsToKeywords(fields);
    return generateOPSMESearchFormula(fields.ipc, keywords);
}
