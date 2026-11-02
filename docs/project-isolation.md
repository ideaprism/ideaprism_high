# 프로젝트 배포 연결 분리 — 2026-11-03

사용자 요청에 따라 renew에 잘못 연결되어 있던 high 저장소의 자동배포 연결만 해제했다. 기존 운영 배포·도메인·환경변수·프로젝트는 보존했다. 이 작업에서는 새 배포를 생성하지 않았다.

| 프로젝트 | 코드 저장소 | 배포 방식 |
|---|---|---|
| ideaprism-high | ideaprism/ideaprism_high | 검증한 커밋을 명시적으로 수동 배포 |
| ideaprism_revise | ideaprism/ideaprism_revise | 기존 자체 Git 자동배포 유지 |
| ideaprism-renew | Git 연결 해제 | 기존 운영 배포 유지, high 푸시로 자동배포하지 않음 |

## 보존 확인

Git 연결 해제 전후에 Vercel 운영 alias가 가리키는 배포 ID가 동일함을 확인했다.

- high: `ideaprism-high.vercel.app` → `dpl_EtFqqTzW34bzJwpuHFK9seg63Vxr`
- revise: `ideaprismrevise.vercel.app` → `dpl_DS1WpRtLUGFMzpqqqusfUQJTPfas`
- renew: `ideaprism-renew-ideaprisms-projects.vercel.app` → `dpl_B62xJF2qxzKjguAWDF3S5j9kNj2o`

연결 해제 후 Vercel Git 연결 목록에서 renew가 제거되고 revise의 자체 저장소 연결은 유지되었다. high는 Git 자동배포 연결이 없는 상태를 유지했다. High 계정용 Neon 저장소 `ideaprism-high-accounts`의 연결 프로젝트가 high 하나임을 별도로 확인했다.

## 이후 작업 원칙

- High 작업 폴더의 Git origin은 `https://github.com/ideaprism/ideaprism_high.git`, Vercel projectId는 `prj_E9qcoi8gMGtfo1QgtecQlb20Bnhj`다.
- revise 작업은 자체 저장소에서 수행한다. revise 개선점을 high에 반영할 때는 필요한 변경을 선택해 검증한다.
- High 배포는 대상 프로젝트와 커밋을 명시해 수행한다. renew 프로젝트에 high 환경변수나 데이터 키를 복사하지 않는다.
- Git 저장소 연결을 다시 추가하거나 배포 방식을 바꿀 때에는 작업 대상 프로젝트와 저장소가 일치하는지 먼저 확인한다.

설정 화면 증거는 Git 제외 경로 `private/renew-git-disconnected.png`에 보관했다.
