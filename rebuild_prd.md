# 제품 요구사항 정의서 (PRD): IdeaPrism 리빌드 (Rebuild)

## 1. 프로젝트 개요 (Project Overview)
**프로젝트명**: 학생용 발명검색/학습 서비스 IdeaPrism (Rebuild)
**목표**: `ideaprism.or.kr`의 핵심 기능과 사용자 경험을 현대적이고 고성능의 웹 애플리케이션으로 재구현합니다.
**핵심 제약사항**: 기존 **Supabase `ideaprism_sdg`** 데이터베이스와 스키마 구조를 변경 없이 그대로 사용해야 합니다.

## 2. 디자인 시스템 및 UI/UX (Design System & UI/UX)
**디자인 철학**: **Google Material Design 3 (M3)** 가이드라인을 철저히 준수하여 프리미엄하고 일관된 경험 제공.

### 2.1 컴포넌트 스타일 (Component Style)
- **M3 준수**: 모든 버튼, 카드, 모달 등은 Material Design 3 가이드라인을 따릅니다.
- **형태 (Shape)**: 모서리 곡률(**Corner Radius**)을 기존보다 더 크게 잡아 부드러운 느낌을 줍니다 (예: 버튼 `Full`, 카드 `Medium/Large`).
- **입체감 (Elevation)**: 물리적인 그림자(Shadow) 대신 **색상 대비(Tonal Elevation)**를 사용하여 깊이와 위계를 표현합니다.

### 2.2 타이포그래피 (Typography)
- **폰트**: 구글의 **Roboto** (영문) 및 **Noto Sans KR** (국문)을 사용합니다.
- **스케일 (Scale)**: M3 타이포그래피 스케일을 체계적으로 적용합니다.
    - **Display**: 대형 타이틀 (예: 히어로 섹션)
    - **Headline**: 주요 페이지 제목
    - **Title**: 컴포넌트나 섹션 제목
    - **Body**: 본문 텍스트
    - **Label**: 버튼 텍스트, 캡션 등

### 2.3 컬러 시스템 (Color System)
- **팔레트 (Palettes)**: **Primary Color**를 중심으로 명도/채도 단계별 **Tonal Palettes**를 생성하여 사용합니다.
- **일관성**: UI 전체에 걸쳐 색상 역할(Primary, Secondary, Surface, Background 등)을 일관되게 적용합니다.

### 2.4 인터랙션 (Interaction)
- **피드백**: 버튼 및 인터랙티브 요소 클릭 시 **Ripple Effect (물결 효과)**를 반드시 적용합니다.
- **애니메이션**: Hover, Focus, Press 등 상태 변화 시 부드러운 전환 애니메이션을 적용합니다.

## 3. 핵심 기능 요구사항 (Functional Requirements)

### 3.1 데이터베이스 & 백엔드 (Database & Backend)
- **플랫폼**: Supabase
- **프로젝트 참조**: `ideaprism_sdg` (`oeufwf...` 주소 및 Anon Key 사용)
- **스키마 준수**: `inventions`, `grades`, `problem_tags`, `scamper_tags` 및 연결 테이블 구조 유지.

### 3.2 주요 기능 (Features)

#### A. 홈 페이지 (Home Page)
- **히어로 섹션**: 플랫폼을 소개하는 인상적인 도입부.
- **빠른 검색**: 즉시 검색 가능한 대형 검색바 포함.
- **추천/최근 발명**: 사용자의 흥미를 유발할 수 있는 카드 리스트 (선택 사항).

#### B. 검색 및 탐색 (Search & Discovery)
- **키워드 검색**: 발명품 제목 및 요약 내용에 대한 전문 검색 (Full-text search).
- **고급 필터링**:
    - **학교급 (School Grade)**: 초/중/고 필터.
    - **문제 유형 (Problem Type)**: '안전', '환경' 등 특정 태그 필터.
    - **발명 기법 (Ideation Method)**: SCAMPER 기법(대체하기, 결합하기 등) 필터.
- **결과 표시**: M3 스타일의 카드 그리드 뷰 (이미지, 제목, 요약 표시).

#### C. 발명품 상세 보기 (Invention Detail View)
- **정보 표시**:
    - **기본 정보**: 제목, 발명가(학생) 학교급.
    - **내용**: '문제점(Problem)' 및 '해결방안(Solution)' 상세 설명.
    - **시각 자료**: 발명품 도면/이미지 표시.
- **메타데이터**: 문제 태그 및 SCAMPER 태그를 클릭 가능한 칩(Chip) 형태로 표시.
- **외부 연동**:
    - **KIPRIS 링크**: 특허 가능성 확인을 위한 KIPRIS 검색 결과 페이지로 바로가기 버튼 제공.

## 4. 기술 스택 권장사항 (Technical Stack)
- **프레임워크**: Next.js (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS (M3 커스텀 설정 필요)
- **상태 관리**: React Hooks / TanStack Query (권장)
