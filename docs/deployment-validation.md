# Production 배포 검증 — 2026-11-03

## 서비스와 소스

- 주소: https://ideaprism-high.vercel.app
- GitHub: https://github.com/ideaprism/ideaprism_high
- Vercel 프로젝트: ideaprism-high / ideaprisms-projects
- 계정 저장소: Neon Free, Singapore. 기존 로컬 관리자·학교 코드, 소속 학교, 활성 상태와 세션 버전을 이관했다.
- 최초 계정 이관을 완료하고 Production의 ACCOUNT_SEED_IMPORT를 0으로 바꿨다. 이후 배포가 변경된 계정 코드를 초기화하지 않는다.
- 실제 학교 운영에 사용하는 계정 발급·수정은 배포 사이트의 /admin/codes에서 진행한다. 로컬 SQLite와 Neon은 서로 다른 저장소이며 양방향 동기화를 하지 않는다.

## 검증 결과

- 배포 빌드 READY. GitHub에는 AES-256-GCM 암호화 패키지만 포함하고 원본 JSON·사진·계정 DB·복호화 키·환경변수 원문은 제외했다.
- 비로그인 검색·상세·사진 401. 원시 JSON·SQLite·암호화 파일 직접 경로 404.
- 기존 네 학교 코드 로그인 성공. 학교별 노출: 미래 167, 보성 82, 삼일 70, 대광 5.
- 실제 HTTP 상세·사진 4×4 학교 접근 행렬: 소속 학교 200, 타학교 404. 학생명·연도·상격이 원본과 일치하고 사진 SHA-256도 원본과 일치.
- 제외 작품 sie-33-211은 상세·사진 차단. 사진이 없는 sie-33-257은 drawing_url=null 유지.
- Neon에서 신규 학교 계정 발급, 중복 코드 발급 실패 시 기관 생성 롤백, 코드 변경 후 새 코드 로그인, 옛 코드·옛 세션 거부, 비활성 계정 로그인 차단을 확인했다.
- 검증용 계정 1건은 '배포 검증 전용 · 사용하지 않음'으로 표시하고 비활성화했다. 기존 사용자 계정은 변경하지 않았다.
- 실제 KIPRIS 검색 200, success=true.
- 로컬 Edge에서 배포 주소의 학교 로그인, 학년·연도 범위, 포인터/키보드 손잡이, 두 전체 보기 버튼, SCAMPER 초기화, 학생명·대회명·상격·상세 발명동기를 검증했다. 카드 설명 문단은 표시되지 않는다.
- 모바일 가로 넘침 없음, 브라우저 pageerror 0. 타입 검사·변경 파일 ESLint 오류 없음. 기존 서버 테스트 92개 통과.

## 근거 파일

- [HTTP 검증](deployment-validation.json)
- [브라우저 검증](deployment-browser-validation.json)
- 화면 캡처: Git 제외 폴더 private/deployment-browser-validation

서버 함수와 Neon의 리전을 Singapore로 맞추는 vercel.json 설정을 포함했다. 설정 형식은 [Vercel 공식 문서](https://vercel.com/docs/functions/configuring-functions/region)를 따른다.
