
# Supabase 대용량 데이터 업로드 가이드 (시행착오 반영본)

이 문서는 `ideaprism_sdg` 프로젝트의 대량 데이터 업로드 시 발생했던 문제들과 해결책을 정리하여, 향후 동일한 작업을 빠르고 정확하게 수행하기 위한 표준 절차를 기술합니다.

## 1. 핵심 전략: "Linked CSV 생성 후 Dashboard Import"

과거 시도했던 **PostgREST API 스크립트 방식**은 대량 데이터 처리 시 타임아웃 및 캐시 갱신 문제(Schema Cache)가 발생하여 비효율적이었습니다.
따라서, **로컬에서 관계형(Relational) CSV를 완벽하게 생성한 뒤, Supabase Dashboard에서 직접 Import하는 방식**이 가장 빠르고 안전합니다.

## 2. 사전 준비 사항

1.  **원본 CSV 파일 준비**: 프로젝트 루트에 위치 (예: `mvp용_5000건.csv`)
2.  **스크립트 도구**: `scripts/generate-integer-id-csvs.ts` (이 스크립트가 핵심입니다)
3.  **DB 상태**: 이미 데이터가 있다면 ID 충돌을 방지하기 위해 해당 범위의 데이터를 삭제하거나 정리가 필요할 수 있습니다.

## 3. 데이터 파싱 및 파일 생성 규칙 (시행착오 해결 내용)

### 3.1 ID 체계: Integer 사용
-   **문제:** 처음엔 UUID를 생성했으나, 기존 DB의 `id` 컬럼이 `int8` (Integer) 타입이라 Import 실패.
-   **해결:** CSV의 `number` 컬럼 값을 그대로 `id`로 사용하여 Integer 포맷으로 통일했습니다.

### 3.2 중복 제거 (Unique Constraint)
-   **문제:** 하나의 발명품에 동일한 태그가 중복되어 있거나, 파싱 과정에서 중복된 행이 생성되어 `23505` (Unique Violation) 오류 발생.
-   **해결:** 스크립트 내에서 `Set` 자료구조를 사용하여, **한 발명품 내에서는 중복된 태그 ID가 생성되지 않도록 필터링** 로직이 적용되었습니다.

### 3.3 복합 구분자 및 키워드 매핑
-   **문제:** 원본 데이터에 `,` 뿐만 아니라 `//` 구분자가 혼용되어 있고, `MODIFY: 설명` 처럼 영어 키워드가 섞여 있어 데이터가 누락됨.
-   **해결:** 
    -   **Problem Tag:** 구분자를 `split(/,|\/\//)` 정규식으로 처리하여 `//`까지 완벽 지원. 매핑 키워드(불편, 위험, 안전, 편의 등) 강화.
    -   **Scamper Tag:** `//` 구분자 지원. 영어 키워드(Substitute, Combine, Modify 등)를 감지하여 한글 태그 ID로 자동 매핑.

## 4. 표준 작업 절차 (Workflow)

다음 데이터 업로드 요청 시, 아래 순서대로 진행해달라고 요청하시면 됩니다.

### Step 1. 스크립트 실행 (CSV 생성)
```bash
npx tsx scripts/generate-integer-id-csvs.ts
```
*   **결과물:** `scripts/csv_output/` 폴더에 3개 파일 생성
    1.  `1_upload_inventions_int.csv` (발명품 메인)
    2.  `2_upload_relations_problems_int.csv` (문제점 연결)
    3.  `3_upload_relations_scampers_int.csv` (스캠퍼 연결)

### Step 2. 기존 데이터 정리 (필요 시)
만약 덮어쓰기나 재작업인 경우, 충돌 방지를 위해 관련 테이블 데이터를 정리합니다.
```sql
-- 예: 5001번부터 새로 넣는 경우
DELETE FROM invention_problem_tags WHERE invention_id >= 5001;
DELETE FROM invention_scamper_tags WHERE invention_id >= 5001;
DELETE FROM inventions WHERE id >= 5001;
```

### Step 3. Dashboard Import
Supabase 대시보드(Table Editor)로 이동하여 생성된 파일을 순서대로 Import 합니다.
1.  **`inventions`** 테이블 -> `1_upload_inventions_int.csv`
2.  **`invention_problem_tags`** 테이블 -> `2_upload_relations_problems_int.csv`
3.  **`invention_scamper_tags`** 테이블 -> `3_upload_relations_scampers_int.csv`

## 5. 요약: AI에게 요청하는 법

다음번에 작업하실 때는 이렇게 말씀해주세요:

> **"새로운 CSV 파일(`파일명.csv`)이 준비됐어. `docs/DATA_UPLOAD_GUIDE.md` 확인해서 `generate-integer-id-csvs.ts` 로직대로 업로드용 Linked CSV 파일들 만들어줘. 파싱 규칙(Integer ID, // 구분자, 중복 제거) 꼭 적용해서."**

이렇게 요청하시면 제가 바로 스크립트를 조정해서 즉시 업로드 가능한 파일 3개를 만들어 드릴 수 있습니다.
