# IdeaPrism High

관리자가 발급한 계정 코드로 로그인하고, 그 계정에 연결된 학교의 발명 자료만 조회하는 단일 서비스입니다. 발명 데이터·사진·계정 관리는 Supabase 없이 동작합니다.

## 로컬 실행

- Node.js 22.16 이상이 필요합니다. 계정 저장소는 Node 내장 SQLite를 사용합니다(22.16에서는 experimental 경고가 출력됩니다).
- `npm ci`
- 패키지를 `private/service-data/`에 배치합니다. 이 폴더에는 `data/inventions.json`, `data/catalog.json`, `images/`, `README.md`가 있습니다. 다른 경로는 서버 환경변수 `SERVICE_DATA_DIR`로 지정합니다.
- `.env.example`을 참고해 `.env.local`에 서로 다른 32바이트 이상 난수 `SCHOOL_SESSION_SECRET`, `ADMIN_SESSION_SECRET`을 설정합니다. 기존 KIPRIS 키는 유지합니다.
- 최초 1회 `npm run admin:bootstrap`. 관리자 코드가 `private/initial-admin-code.txt`에 저장됩니다. 기존 관리자가 있으면 덮어쓰지 않습니다.
- `npm run dev` 후 `/admin-login`에서 관리자 코드로 로그인합니다. `/admin/codes` → **새 코드 직접 발급** → 소속 학교와 계정 이름을 지정합니다. 코드는 영문·숫자·_·- 4~128자로 직접 정할 수 있습니다. 비워 두면 `MIRAE-4821`처럼 학교 이름과 숫자 4자리로 생성합니다.
- 학생/학교 사용자는 `/`에서 발급된 계정 코드로 로그인합니다. 학교명만으로 자동 인증하는 방식은 사용하지 않으며, 관리자에게 실제 발급받은 코드가 필요합니다.

현재 작업에서 지정 패키지의 실제 파일을 `private/service-data/`에 복사했고, 최초 관리자도 생성했습니다. 관리자 코드와 계정 DB는 Git에서 제외되어 있습니다.

## 계정 운영

기존의 코드 방식 인증·발급·조회·수정·복사·활성/비활성 기능을 유지했습니다. 계정 코드는 비밀번호 역할을 하는 자격증명입니다. 아이디와 비밀번호를 따로 입력하는 방식은 아닙니다. 신규 계정은 관리자만 발급할 수 있고 `school_id` 지정이 필수입니다.

- 계정: `private/accounts.sqlite` (변경 가능: `LOCAL_AUTH_DB_PATH`)
- 각 계정 카드의 **코드 수정** 버튼은 활성 상태와 관계없이 항상 표시됩니다. 관리자 코드도 같은 버튼으로 바꿉니다.
- 카드에 **로그인 가능/불가**를 표시합니다. 비활성 계정은 **코드만 저장**하면 계속 로그인할 수 없으며, **저장하고 활성화**로 코드를 바꾸면서 사용을 시작할 수 있습니다. 로그인 화면도 비활성 계정을 별도로 안내합니다.
- 코드 변경/비활성화 시 세션 버전을 올려 기존 쿠키를 무효화합니다. 관리자 본인이 자기 코드를 변경한 경우에만 현재 브라우저 쿠키를 갱신하여 작업을 이어갈 수 있고, 다른 브라우저의 옛 쿠키는 무효화합니다. 재활성화해도 옛 쿠키는 살아나지 않습니다.
- 최초 관리자 코드 파일은 초기 발급 기록입니다. 화면에서 코드를 변경하면 이후 로그인에는 새 코드를 사용합니다.
- 학교 쿠키는 12시간, 관리자 쿠키는 8시간, HttpOnly/SameSite=Lax이며 프로덕션에서는 Secure입니다.
- 모든 데이터 API와 서버 상세 페이지는 현재 계정·기관 활성 상태, 만료, 세션 버전, 학교 연결을 확인합니다. 요청으로 전달한 학교 ID는 권한 결정에 쓰지 않습니다.
- 발급은 SQLite 트랜잭션으로 처리합니다. 코드 중복 시 기관 생성도 롤백됩니다.
- 로그인 시도 제한은 프로세스/클라이언트당 분당 10회입니다. 실제 배포 시 신뢰할 수 있는 프록시의 클라이언트 IP 전달과 방화벽 제한을 설정해야 합니다.
- 기존 원격 Supabase 계정·제휴 문의는 자동 복사하지 않았습니다. 로컬 계정은 새로 발급합니다. 문의 목록 화면은 로컬 저장소를 읽으며, 비활성 상태였던 신규 문의/자동 승인/AI 최적화는 그대로 비활성입니다.

로컬 SQLite는 쓰기 가능한 영구 디스크가 있는 Node 서버용입니다. Vercel에서는 `DATABASE_URL`에 연결된 Neon PostgreSQL을 사용하며, 계정 발급·코드 변경은 트랜잭션과 세션 버전으로 처리합니다. SQLite를 Vercel의 임시 파일에 복사해 운영하지 않습니다. 로컬 백업은 서버를 중지한 뒤 DB와 남아 있는 `-wal`/`-shm` 파일을 함께 보관하거나 SQLite 백업 기능으로 수행합니다. `private/`에는 학생 정보와 로그인 자격증명이 있으므로 웹 정적 폴더에 복사하지 마세요.

## Vercel 배포 준비

- 서버 환경변수: `DATABASE_URL`(Neon), `SERVICE_DATA_KEY`, `SCHOOL_SESSION_SECRET`, `ADMIN_SESSION_SECRET`, `KIPRIS_SERVICE_KEY`. 모두 비공개 변수로 설정합니다.
- `node scripts/service-data-package.mjs --pack`은 원본 327개 파일을 AES-256-GCM으로 암호화하여 `server-data/service-data.enc`를 만듭니다. 키는 Git 제외 파일 `private/service-data-key.txt`에 저장합니다. GitHub에는 암호문만 업로드합니다.
- `npm run build`는 서버 비밀키로 패키지를 복호화하고, Next.js의 서버 함수 파일에만 JSON과 사진을 포함합니다. `public/`에 복사하지 않습니다. Vercel에서 키가 없으면 빌드를 중단합니다.
- Neon 연결 문자열을 Git 제외 파일 `private/deployment.env`의 `DATABASE_URL`에 설정한 뒤 `node node_modules/tsx/dist/cli.mjs scripts/migrate-accounts-to-neon.ts`로 계정을 이관합니다. 전용 `ideaprism_high` 스키마만 사용하고, 코드·학교·활성 상태·세션 버전을 보존합니다. 충돌 또는 기존 값 차이가 있으면 전체 이관을 롤백합니다.
- `node node_modules/tsx/dist/cli.mjs scripts/verify-postgres-auth.ts`는 실제 Neon에서 발급 트랜잭션·중복 롤백·세션 버전·동시 사용 횟수 갱신을 검증하고 해당 실행에서 만든 임시 레코드만 삭제합니다.
- 로컬 `.env.local`에 `DATABASE_URL`이 없으면 기존 SQLite를 계속 사용합니다. `private/` 계정 DB와 복호화 키는 커밋하지 않습니다.

## 데이터·검색

| 학교 ID | 원본 건수 | 기본 노출 |
|---|---:|---:|
| mirae | 168 | 167 |
| boseong | 82 | 82 |
| samil | 70 | 70 |
| daegwang | 5 | 5 |

- 전체 발명 325건, 사진 324개. 목록/검색에는 소속 학교의 카드 필드만 응답합니다. 상세는 학생명·원본 학교명·수상 당시 학년을 표시합니다.
- `sie-33-211`의 `exclude_from_demo=true`를 유지하고 목록·상세·사진 모두 제외합니다.
- `sie-33-257`은 `drawing_url=null`이며 사진 없음 화면을 표시합니다.
- 빈 검색은 학교 전체 자료를 표시합니다. 기존 문장 검색·동의어·관련도 정렬·Boolean 검색·페이지 나누기를 유지합니다. 필터 목록은 패키지 catalog를 사용합니다.
- 검색 버튼 옆과 결과 건수 옆의 **모든 데이터 보기**는 검색어·학년·문제 유형·SCAMPER·연도 범위를 초기화하고 로그인한 학교의 전체 자료를 표시합니다. 학교 간 권한은 그대로 적용됩니다.
- 학년 구분은 원본 `grade_year`의 1·2·3학년이며, 연도는 원본 `award_year`(2015~2026)를 사용합니다. SCAMPER 아래 두 손잡이로 수상 연도 범위를 양 끝 포함하여 조절하며, 다른 필터와 함께 적용됩니다. 학교별 연도 범위는 검색어와 관계없이 유지됩니다.
- 실제 집계가 없는 고정 인기검색어 목록은 홈·검색 화면에서 제거했습니다.
- 사진은 `/api/inventions/[id]/image`에서 학교 권한 확인 후 원본 바이트를 전달합니다. JSON과 사진은 공개 `public/` 밖에 보관하며 응답은 `private, no-store`입니다.
- 특허 검색은 상세 API의 `keyword`, `search_terms.problem/method/effect`, `ipc`로 편집 가능한 검색식을 구성합니다. `ipc_secondary`는 참고 정보로 표시합니다. 패키지에 없는 Simple/Expert OPSME 자료나 IPC 설명은 생성하지 않습니다. 외부 KIPRIS 실제 검색은 `KIPRIS_SERVICE_KEY`와 네트워크가 필요합니다.

## 검증

```powershell
npm test
npx tsc --noEmit
node --use-system-ca node_modules/next/dist/bin/next build
npm run start -- --hostname 127.0.0.1 --port 3102
node scripts/verify-local-data.mjs
```

`verify-local-data.mjs`는 로컬 서비스에서 검증용 계정을 발급하고 네 학교 HTTP 접근 행렬을 검사한 뒤 해당 실행에서 만든 계정을 삭제합니다. 최초 관리자 파일을 읽고, 자격증명/학생명은 결과 로그에 기록하지 않습니다. `LOCAL_VERIFY_BASE_URL`로 기본 `http://127.0.0.1:3102`를 바꿀 수 있습니다.

브라우저 검증은 `node scripts/verify-local-browser.mjs`로 실행합니다. 로컬 `playwright` 모듈과 설치된 Microsoft Edge를 사용합니다. 별도 런타임의 Playwright는 `PLAYWRIGHT_MODULE_DIR`에 모듈 디렉터리의 절대 경로를 지정합니다. 관리자 코드는 로컬 파일에서만 읽고 브라우저 요청을 localhost로 제한하며, 테스트 후 해당 실행에서 생성한 계정만 삭제합니다. 화면 캡처는 `private/browser-validation/`에 저장됩니다.

`node scripts/verify-school-code-recovery.mjs`는 네 학교의 현재 활성 코드로 실제 브라우저 로그인·학생명·사진·타학교 접근 차단을 확인합니다. 별도 임시 계정으로 비활성 상태의 코드 수정, 저장 후 활성화, 활성 코드 변경 후 재로그인을 확인하고 임시 계정을 삭제합니다.

검증 결과는 `docs/local-data-validation.md`를 참고하세요. 이전 `docs/integration-validation.md`는 Supabase 기반 과거 구현의 기록입니다.
