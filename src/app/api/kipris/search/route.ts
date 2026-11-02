import { requireSchool } from '@/lib/school-route';
import { getRequestSchool } from '@/lib/school-route';
import { getSchoolInvention } from '@/lib/service-data';
import { NextRequest, NextResponse } from 'next/server';
import type { KiprisSearchResponse, KiprisPatent, KiprisRawItem } from '@/types/kipris';
import { parseFormula, toOperatorQuery, toOperatorCandidates, toRepresentativeQueries, describeQuery, ipcMatches, InvalidFormulaError, type QueryCandidate } from '@/lib/kipris-query';

const KIPRIS_BASE_URL = 'http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch';

/**
 * XML 문자열에서 태그 값을 추출하는 헬퍼 함수
 */
function extractTagValue(xml: string, tagName: string): string {
    try {
        const pattern = `<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`;
        const regex = new RegExp(pattern, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : '';
    } catch {
        return '';
    }
}

/**
 * XML에서 모든 PatentUtilityInfo 또는 item을 파싱
 */
function parseItems(xml: string): KiprisRawItem[] {
    const items: KiprisRawItem[] = [];

    // PatentUtilityInfo 태그 또는 item 태그 모두 지원
    const itemRegex = /<(?:PatentUtilityInfo|item)>([\s\S]*?)<\/(?:PatentUtilityInfo|item)>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        items.push({
            indexNo: extractTagValue(itemXml, 'indexNo') ||
                extractTagValue(itemXml, 'IndexNo'),
            inventionTitle: extractTagValue(itemXml, 'inventionTitle') ||
                extractTagValue(itemXml, 'InventionTitle') ||
                extractTagValue(itemXml, 'inventionTitleEng'),
            applicationNumber: extractTagValue(itemXml, 'applicationNumber') ||
                extractTagValue(itemXml, 'ApplicationNumber'),
            applicationDate: extractTagValue(itemXml, 'applicationDate') ||
                extractTagValue(itemXml, 'ApplicationDate'),
            openNumber: extractTagValue(itemXml, 'openNumber') ||
                extractTagValue(itemXml, 'OpenNumber'),
            openDate: extractTagValue(itemXml, 'openDate') ||
                extractTagValue(itemXml, 'OpenDate'),
            registerNumber: extractTagValue(itemXml, 'registerNumber') ||
                extractTagValue(itemXml, 'RegisterNumber'),
            registerDate: extractTagValue(itemXml, 'registerDate') ||
                extractTagValue(itemXml, 'RegisterDate'),
            registerStatus: extractTagValue(itemXml, 'registerStatus') ||
                extractTagValue(itemXml, 'RegisterStatus'),
            ipcNumber: extractTagValue(itemXml, 'ipcNumber') ||
                extractTagValue(itemXml, 'IpcNumber') ||
                extractTagValue(itemXml, 'MainIpc'),
            applicantName: extractTagValue(itemXml, 'applicantName') ||
                extractTagValue(itemXml, 'ApplicantName') ||
                extractTagValue(itemXml, 'Applicant'),
            astrtCont: extractTagValue(itemXml, 'astrtCont') ||
                extractTagValue(itemXml, 'AbstractCont'),
            abstract: extractTagValue(itemXml, 'abstract') ||
                extractTagValue(itemXml, 'Abstract'),
            bigDrawing: extractTagValue(itemXml, 'bigDrawing') ||
                extractTagValue(itemXml, 'BigDrawing'),
            drawing: extractTagValue(itemXml, 'drawing') ||
                extractTagValue(itemXml, 'Drawing'),
        });
    }

    return items;
}

interface KiprisCallResult {
    ok: boolean;
    totalCount: number;
    patents: KiprisPatent[];
    error?: string;
}

/** KIPRIS Plus 자유어 검색 1회 호출 */
async function callKipris(word: string, pageNo: number, numOfRows: number, serviceKey: string, signal: AbortSignal): Promise<KiprisCallResult> {
    const apiUrl = new URL(KIPRIS_BASE_URL);
    apiUrl.searchParams.set('word', word);
    apiUrl.searchParams.set('year', '0'); // 0 = 전체 연도
    apiUrl.searchParams.set('numOfRows', numOfRows.toString());
    apiUrl.searchParams.set('pageNo', pageNo.toString());
    apiUrl.searchParams.set('ServiceKey', serviceKey);

    console.log('[KIPRIS API] word:', word, 'page:', pageNo);

    const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/xml' },
        signal,
    });
    if (!response.ok) {
        return { ok: false, totalCount: 0, patents: [], error: `KIPRIS API 응답 오류: ${response.status}` };
    }

    const xmlText = await response.text();
    if (!/<(?:resultCode|[Tt]otalSearchCount|totalCount|totalCnt)[\s>]/.test(xmlText)) {
        return { ok: false, totalCount: 0, patents: [], error: '특허 검색 서비스에서 올바르지 않은 응답을 받았습니다. 잠시 후 다시 시도해 주세요.' };
    }

    const resultCode = extractTagValue(xmlText, 'resultCode');
    const resultMsg = extractTagValue(xmlText, 'resultMsg');
    if (resultCode && resultCode !== '00') {
        console.log('[KIPRIS API] Error response:', resultCode, resultMsg);
        return {
            ok: false,
            totalCount: 0,
            patents: [],
            error: `KIPRIS API 오류: ${resultMsg || '알 수 없는 오류'} (코드: ${resultCode})`,
        };
    }

    const totalCount = parseInt(
        extractTagValue(xmlText, 'TotalSearchCount') ||
        extractTagValue(xmlText, 'totalCount') ||
        extractTagValue(xmlText, 'totalCnt') ||
        '0',
        10
    );

    const patents: KiprisPatent[] = parseItems(xmlText).map((item, index) => ({
        indexNo: item.indexNo ? parseInt(item.indexNo, 10) : (pageNo - 1) * numOfRows + index + 1,
        inventionTitle: item.inventionTitle || '(제목 없음)',
        applicationNumber: item.applicationNumber || '',
        applicationDate: item.applicationDate || '',
        openNumber: item.openNumber,
        openDate: item.openDate,
        registerNumber: item.registerNumber,
        registerDate: item.registerDate,
        registerStatus: item.registerStatus || (item.registerNumber ? '등록' : '공개'),
        ipcNumber: item.ipcNumber || '',
        applicantName: item.applicantName || '',
        abstract: item.astrtCont || item.abstract || '',
        bigDrawing: item.bigDrawing,
        drawing: item.drawing,
    }));

    return { ok: true, totalCount, patents };
}

function errorResponse(message: string, status: number, pageNo = 1, numOfRows = 10) {
    return NextResponse.json({
        success: false,
        items: [],
        totalCount: 0,
        pageNo,
        numOfRows,
        error: message,
    } as KiprisSearchResponse, { status });
}

/**
 * GET /api/kipris/search
 *
 * Query Parameters:
 * - q: 화면 검색식 (예: IPC=[A47G]*우산꽂이*(서랍+빗물받이)) ← 특허검색 화면이 사용
 * - word, ipc: (구버전 호환) 자유어 검색어, IPC 코드
 * - numOfRows: 페이지당 결과 수 (기본: 10, 최대 50)
 * - pageNo: 페이지 번호 (기본: 1)
 */
export async function GET(request: NextRequest) {
  const denied = await requireSchool(request);
  if (denied) return denied;
    const { searchParams } = new URL(request.url);
    const inventionId = searchParams.get('inventionId');
    if (inventionId) {
        const school = await getRequestSchool(request);
        if (!school || !getSchoolInvention(school.slug, inventionId)) return errorResponse('발명을 찾을 수 없습니다.', 404);
    }
    const formula = searchParams.get('q');
    const word = searchParams.get('word');
    const ipc = searchParams.get('ipc');
    const numOfRows = Math.min(Math.max(parseInt(searchParams.get('numOfRows') || '10', 10) || 10, 1), 50);
    const pageNo = Math.max(parseInt(searchParams.get('pageNo') || '1', 10) || 1, 1);

    try {
        const parsed = formula !== null ? parseFormula(formula) : null;
        if (parsed && parsed.groups.length === 0) {
            return errorResponse('검색 키워드를 1개 이상 넣어 주세요. (IPC 코드만으로는 검색하지 않습니다)', 400, pageNo, numOfRows);
        }
        if (!parsed && ((!word && !ipc) || (word?.length ?? 0) + (ipc?.length ?? 0) > 1000)) {
            return errorResponse('검색어는 1~1000자로 입력해 주세요.', 400, pageNo, numOfRows);
        }
        const serviceKey = process.env.KIPRIS_SERVICE_KEY;
        if (!serviceKey) {
            return errorResponse('KIPRIS API 키가 설정되지 않았습니다.', 500);
        }

        // ── 검색식(q) 방식: 표시식과 실제 질의를 일치시킴 ──
        const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
        if (parsed) {

            // 연산자 방식이 기본 (2026-10-27 실측으로 KIPRIS 지원 확인). 끄려면 KIPRIS_WORD_OPERATORS=false
            const operatorMode = process.env.KIPRIS_WORD_OPERATORS !== 'false';
            const candidates: QueryCandidate[] = operatorMode
                ? toOperatorCandidates(parsed)
                : toRepresentativeQueries(parsed.groups).map((word) => ({ word, ipcApplied: false }));

            // 엄격한 식부터 조회해 결과가 나오는 첫 식을 사용
            let used = candidates[0];
            let result: KiprisCallResult = { ok: true, totalCount: 0, patents: [] };
            for (const candidate of candidates) {
                used = candidate;
                result = await callKipris(candidate.word, pageNo, numOfRows, serviceKey, signal);
                if (!result.ok || result.totalCount > 0) break;
            }

            if (!result.ok) {
                return errorResponse(result.error || '특허 검색 오류', 502, pageNo, numOfRows);
            }

            // 항목(그룹)을 뺐는지: 마지막 후보들은 그룹 수가 줄어든 식
            const fullGroupsWord = operatorMode
                ? toOperatorQuery(parsed.groups)
                : toRepresentativeQueries(parsed.groups)[0];
            const groupsDropped = !used.word.endsWith(fullGroupsWord);

            return NextResponse.json({
                success: true,
                items: result.patents.map((p) => ({ ...p, ipcMatch: ipcMatches(p.ipcNumber, parsed.ipc) })),
                totalCount: result.totalCount,
                pageNo,
                numOfRows,
                appliedQuery: describeQuery(used.word, operatorMode),
                relaxed: groupsDropped,
                ipc: parsed.ipc,
                ipcApplied: used.ipcApplied,
                operatorMode,
            } as KiprisSearchResponse);
        }

        // ── 구버전 호환: word / ipc ──
        if (!word && !ipc) {
            return errorResponse('검색어 또는 IPC 코드를 입력해주세요.', 400);
        }
        let searchWord = word || '';
        if (ipc) searchWord = searchWord ? `${ipc}*${searchWord}` : ipc;

        const result = await callKipris(searchWord, pageNo, numOfRows, serviceKey, signal);
        if (!result.ok) {
            return errorResponse(result.error || '특허 검색 오류', 502, pageNo, numOfRows);
        }
        return NextResponse.json({
            success: true,
            items: result.patents,
            totalCount: result.totalCount,
            pageNo,
            numOfRows,
        } as KiprisSearchResponse);
    } catch (error) {
        if (error instanceof InvalidFormulaError) return errorResponse(error.message, 400, pageNo, numOfRows);
        if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
            return errorResponse('특허 검색 시간이 초과되었습니다. 다시 시도해 주세요.', 504, pageNo, numOfRows);
        }
        console.error('[KIPRIS API] Error:', error);
        return errorResponse('특허 검색 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', 502, pageNo, numOfRows);
    }
}
