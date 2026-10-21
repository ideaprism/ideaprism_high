
# Ideaprism SDG - 프로젝트 구조 및 리소스 가이드

이 문서는 프로젝트의 주요 폴더 구조, 핵심 데이터 파일 위치, 그리고 데이터 업로드와 관련된 스크립트 경로를 안내합니다. 작업 시 "지도"처럼 활용하세요.

## 1. 📂 핵심 데이터 및 문서 위치

| 항목 | 파일/폴더 경로 | 설명 |
| :--- | :--- | :--- |
| **원본 데이터** | `mvp용_5000건.csv` | 프로젝트 최상위 폴더에 위치. (5,000건 발명품 데이터 원본) |
| **업로드 가이드** | `docs/DATA_UPLOAD_GUIDE.md` | 데이터 업로드 절차(Linked CSV 방식)를 상세히 정리한 매뉴얼. |
| **산출물 (CSV)** | `scripts/csv_output/` | 스크립트가 생성한 **Supabase 업로드용 CSV 파일들**이 저장되는 곳. |

## 2. 🛠️ 데이터 업로드 스크립트

데이터 처리 및 업로드 작업을 위한 스크립트는 모두 `scripts/` 폴더에 모여 있습니다.

-   **`scripts/generate-integer-id-csvs.ts`** (⭐⭐⭐)
    -   **가장 중요한 파일.** 원본 CSV를 읽어서 `inventions`, `problem_tags`, `scamper_tags` 3개의 연관 CSV 파일을 생성합니다. (파싱 로직, 중복 제거 포함)
-   `scripts/check-scamper-count.ts`
    -   SCAMPER 데이터가 제대로 파싱되는지 검증하고 개수를 세는 진단 도구.
-   `scripts/check-problem-count.ts`
    -   Problem Tag 데이터 정합성을 확인하는 진단 도구.
-   (Legacy) `scripts/upload-csv.ts`, `scripts/temp_batch.sql`
    -   이전에 시도했던 방식(직접 SQL 실행)의 잔재들. 현재는 사용하지 않음.

## 3. 🏗️ 프로젝트 전체 구조

### Root
-   `mvp용_5000건.csv`: 원본 데이터
-   `rebuild_prd.md`: 프로젝트 재구축 요구사항 정의서
-   `.env.local`: 환경변수 (Supabase URL, Key 등)

### `src/` (소스 코드)
-   **`src/app/`**: Next.js App Router 페이지들
    -   `page.tsx`: 메인 홈
    -   `search/`: 검색 페이지
    -   `inventions/[id]/`: 발명품 상세 페이지
-   **`src/components/`**: UI 컴포넌트
    -   `features/`: 주요 기능 컴포넌트 (`FilterPanel`, `InventionCard`, `ClientSearchPage` 등)
    -   `ui/`: 공용 UI (`Button`, `Card`, `Input`, `Chip` 등)
-   **`src/utils/supabase/`**: Supabase 클라이언트 설정
    -   `client.ts`: 클라이언트 사이드용
    -   `server.ts`: 서버 사이드용
    -   `queries.ts`: **데이터 조회 핵심 로직** (검색, 필터링 등)

### `docs/` (문서)
-   `DATA_UPLOAD_GUIDE.md`: 데이터 업로드 매뉴얼
-   `PROJECT_STRUCTURE.md`: 현재 보고 계신 이 문서

---

## 4. 작업 가이드 (Quick Start)

**Q. 데이터를 5,000건에서 10,000건으로 늘리려면?**
1.  새로운 CSV 파일(예: `new_10000.csv`)을 루트에 둡니다.
2.  `scripts/generate-integer-id-csvs.ts` 파일을 열어 `const csvFilePath` 경로를 수정합니다.
3.  터미널에서 `npx tsx scripts/generate-integer-id-csvs.ts` 실행.
4.  `scripts/csv_output/`에 생긴 파일들을 Supabase 대시보드에 Import.
