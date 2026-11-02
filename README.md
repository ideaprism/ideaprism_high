# IdeaPrism High

네 고등학교가 학교 코드로 각자 화면을 여는 IdeaPrism입니다. 검토한 `ideaprism_revise`의 검색·필터·상세·특허 개선을 학교 인증과 학교별 화면에 통합했습니다.

## 학교 코드

| 학교 | 코드 |
| --- | --- |
| 부산 대광고등학교 | `DAEGWANG` |
| 서울 미래산업과학고등학교 | `MIRAE` |
| 수원 삼일공업고등학교 | `SAMIL` |
| 서울 보성고등학교 | `BOSEONG` |

코드는 `src/config/school-codes.ts`에서 바꿉니다. 학교 이름과 색은 `src/config/schools.ts`입니다.

## 실행

```bash
npm install
npm run dev
```

데이터베이스 접속 정보는 `.env.local`에 둡니다. 키 이름은 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SCHOOL_SESSION_SECRET`, `KIPRIS_SERVICE_KEY`입니다. 관리자 기능에는 `ADMIN_SESSION_SECRET`과 서버 전용 `SUPABASE_SECRET_KEY`(또는 기존 `SUPABASE_SERVICE_ROLE_KEY`)가 추가로 필요합니다. `.env.example`에는 이름만 들어 있습니다. 학교 세션 키는 High 전용으로 최소 32바이트 난수로 생성하며 관리자 키를 재사용하지 않습니다.

## 검증과 운영 기준

- 설치: `npm ci`. High의 node_modules는 다른 프로젝트와 연결하지 않습니다.
- 단위 테스트: `npm test`, 타입: `npx tsc --noEmit`, 빌드: `npm run build`.
- 로컬 시스템 인증서가 필요한 Windows에서는 `node --use-system-ca node_modules/next/dist/bin/next build`와 같은 방식으로 실행합니다. TLS 인증서 검증을 끄지 않습니다.
- 두 프로덕션 서버를 Revise 3100 / High 3101로 띄운 후 `node scripts/verify-integration.mjs`로 실제 검색 순서·인증·상세·특허를 검증합니다. 다른 코드/주소는 HIGH_TEST_SCHOOL_CODE, REVISE_BASE_URL, HIGH_BASE_URL로 지정합니다.
- 학교 세션은 HttpOnly/SameSite=Lax 쿠키, 12시간 만료입니다. 나가기는 학교·관리자 쿠키를 함께 삭제합니다. 키 변경 시 기존 학교 세션은 다시 로그인해야 합니다.
- 공유 학교 코드는 학교 화면 진입용입니다. 학생 개인 계정이나 학교별 데이터 소유권 분리는 구현하지 않습니다. 발명 자료는 기존 공용 DB입니다.
- 네 학교의 기존 코드를 유지했습니다. 로그인 시도 제한은 현재 앱에 없으며, 외부 배포 전 학교 코드 운영 방식과 호스팅 방화벽의 시도 제한을 설정해야 합니다.
- 관리자 로그인은 /admin-login입니다. 기존 활성 관리자 기관의 코드로 인증하며, HttpOnly 관리자 쿠키를 사용합니다. 학교 쿠키로는 관리자 API를 사용할 수 없습니다.
- 관리자 코드 조회·발급·수정·활성화는 서버 전용 키로 처리합니다. 공용 DB의 기관 코드와 High의 네 학교 진입 코드는 별개입니다.
- 기존 제휴 문의는 읽기 전용으로 제공합니다. 검증되지 않은 문의 자동 승인·AI 최적화 프로토타입은 410을 반환합니다. 외부 AI 도우미와 신규 제휴 문의는 비활성화 상태입니다.
- 검색어 Analytics 전송을 제외했습니다. High는 noindex와 robots 차단을 기본으로 하며 공개 서비스 도메인을 canonical로 복사하지 않았습니다.
- Supabase 마이그레이션 파일은 이미 적용된 공용 DB 권한 변경의 이력입니다. 통합 과정에서 DB를 변경하지 않았으며 임의 재실행하지 않습니다.
- 상세 응답은 private, no-store입니다. 인증은 middleware와 API 핸들러 양쪽에서 확인합니다.
- 배포 환경에 High 전용 SCHOOL_SESSION_SECRET과 기존 Supabase/KIPRIS 설정을 등록해야 합니다. 로컬 .env.local은 커밋하지 않습니다.

검증 결과와 제한은 `docs/integration-validation.md`, 실제 API 비교는 `docs/integration-api-results.json`을 참고하세요. 운영 배포는 별도 단계입니다.

## 관리자 검증·운영

- 관리자 코드 로그인은 사용 횟수를 조건부 갱신하여 동시 요청의 횟수 유실을 방지합니다. 마지막 허용 로그인으로 생성된 세션은 유지되며 이후 로그인은 제한됩니다. 코드/기관 비활성화·만료는 각 관리자 API 요청과 페이지 진입 시 확인합니다.
- 로그인 시도는 프로세스당 클라이언트별 분당 10회로 제한합니다. 여러 인스턴스에서 운영할 때는 호스팅 방화벽 제한도 설정합니다.
- 운영 현황은 실제 DB 기관/코드/대기 문의 건수를 표시합니다. 검색량·학생 검색어는 수집하지 않으며 예시 수치를 표시하지 않습니다.
- 코드 발급은 중복을 검사하고, 실패 시 이 요청이 생성한 기관만 정리합니다. 여러 REST 호출을 하나의 DB 트랜잭션으로 묶은 것은 아니므로 서버 프로세스 강제 종료·연속 네트워크 장애 때에는 운영자가 정합성을 확인해야 합니다.
- 로컬 UI 모의 검증: `node scripts/fixtures/admin-db.mjs`로 메모리 DB(4100)를 실행하고, 별도 High 서버에 `SUPABASE_URL=http://127.0.0.1:4100`, `SUPABASE_SECRET_KEY=sb_secret_fixture_only`를 주입합니다. 이 설정은 테스트 서버에만 사용하며 .env.local이나 배포 환경에 저장하지 않습니다. 테스트 관리자 코드는 `ADMIN-LOCAL-TEST`입니다.
- 실제 서버에서는 위 모의 설정을 사용하지 않습니다. 서버 전용 SUPABASE_URL을 생략하면 기존 NEXT_PUBLIC_SUPABASE_URL을 사용합니다.
