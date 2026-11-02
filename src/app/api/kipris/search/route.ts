import { NextRequest, NextResponse } from 'next/server';
import type { KiprisSearchResponse, KiprisPatent, KiprisRawItem } from '@/types/kipris';

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

/**
 * GET /api/kipris/search
 * 
 * Query Parameters:
 * - word: 검색어 (필수)
 * - ipc: IPC 코드 (선택)
 * - numOfRows: 페이지당 결과 수 (기본: 10)
 * - pageNo: 페이지 번호 (기본: 1)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const word = searchParams.get('word');
        const ipc = searchParams.get('ipc');
        const numOfRows = parseInt(searchParams.get('numOfRows') || '10', 10);
        const pageNo = parseInt(searchParams.get('pageNo') || '1', 10);

        // 검색어 필수 체크
        if (!word && !ipc) {
            return NextResponse.json({
                success: false,
                items: [],
                totalCount: 0,
                pageNo: 1,
                numOfRows: 10,
                error: '검색어 또는 IPC 코드를 입력해주세요.',
            } as KiprisSearchResponse, { status: 400 });
        }

        // API 키 확인
        const serviceKey = process.env.KIPRIS_SERVICE_KEY;
        if (!serviceKey) {
            return NextResponse.json({
                success: false,
                items: [],
                totalCount: 0,
                pageNo: 1,
                numOfRows: 10,
                error: 'KIPRIS API 키가 설정되지 않았습니다.',
            } as KiprisSearchResponse, { status: 500 });
        }

        // 검색 쿼리 구성
        let searchWord = '';
        if (word) {
            searchWord = word;
        }
        if (ipc) {
            if (searchWord) {
                searchWord = `${ipc}*${searchWord}`;
            } else {
                searchWord = ipc;
            }
        }

        // KIPRIS API 호출
        const apiUrl = new URL(KIPRIS_BASE_URL);
        apiUrl.searchParams.set('word', searchWord);
        apiUrl.searchParams.set('year', '0'); // 0 = 전체 연도
        apiUrl.searchParams.set('numOfRows', numOfRows.toString());
        apiUrl.searchParams.set('pageNo', pageNo.toString());
        apiUrl.searchParams.set('ServiceKey', serviceKey);

        console.log('[KIPRIS API] Request URL:', apiUrl.toString().replace(serviceKey, '***'));

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`KIPRIS API 응답 오류: ${response.status}`);
        }

        const xmlText = await response.text();
        console.log('[KIPRIS API] Response length:', xmlText.length);

        // 에러 응답 체크
        const resultCode = extractTagValue(xmlText, 'resultCode');
        const resultMsg = extractTagValue(xmlText, 'resultMsg');

        if (resultCode && resultCode !== '00') {
            console.log('[KIPRIS API] Error response:', resultCode, resultMsg);
            return NextResponse.json({
                success: false,
                items: [],
                totalCount: 0,
                pageNo,
                numOfRows,
                error: `KIPRIS API 오류: ${resultMsg || '알 수 없는 오류'} (코드: ${resultCode})`,
            } as KiprisSearchResponse, { status: 200 }); // API 에러지만 200으로 반환
        }

        // XML 파싱 - 다양한 필드명 지원
        const totalCount = parseInt(
            extractTagValue(xmlText, 'TotalSearchCount') ||
            extractTagValue(xmlText, 'totalCount') ||
            extractTagValue(xmlText, 'totalCnt') ||
            '0',
            10
        );
        const items = parseItems(xmlText);

        console.log('[KIPRIS API] Parsed items:', items.length, 'totalCount:', totalCount);

        // KiprisPatent 형식으로 변환
        const patents: KiprisPatent[] = items.map((item, index) => ({
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

        return NextResponse.json({
            success: true,
            items: patents,
            totalCount,
            pageNo,
            numOfRows,
        } as KiprisSearchResponse);

    } catch (error) {
        console.error('[KIPRIS API] Error:', error);

        return NextResponse.json({
            success: false,
            items: [],
            totalCount: 0,
            pageNo: 1,
            numOfRows: 10,
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        } as KiprisSearchResponse, { status: 500 });
    }
}

