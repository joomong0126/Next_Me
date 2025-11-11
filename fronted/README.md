
# Next MEver2 Frontend

AI 기반 커리어 코치 서비스 **Next MEver2** 의 프런트엔드 코드 번들입니다.  
디자인 시안은 https://www.figma.com/design/bmS2V7ksiFjZhZSkKDyjDM/next-MEver2 에서 확인할 수 있습니다.

## 서비스 개요

- 프로젝트·경험 자료를 업로드하면 AI 어시스턴트 **Nexter** 가 역량을 분석하고 성장 인사이트를 제공합니다.
- 온보딩 설문을 통해 현재 상태와 목표 직무·스킬을 저장하고, 대시보드에서 맞춤 추천을 확인합니다.
- 포트폴리오/자기소개서 초안 작성, 역량 분석, 학습 계획 제안 등 AI 보조 기능을 제공합니다.

## 구현 현황 (2025.11 기준)

- **랜딩 & 온보딩**
  - `Intro` 페이지: 서비스 USP, CTA, 사회적 증거 섹션.
  - `Onboarding` 마법사: 상태·목표·스킬 입력 → `localStorage` 에 사용자 프로필 저장.
- **인증 흐름**
  - 이메일/비밀번호 & Google 체험용 로그인 (`/login`).
  - 가입 단계 분리(`signup-method` → `signup-details`), 약관·Google 계정 연동 UI 포함.
  - `RequireAuth` 가 보호 라우트를 감싸고, React Query 로 `api.auth.me` 결과 캐싱.
  - Mock API(`shared/api/adapters/mock`) + 토큰 스토리지로 로그인 상태 시뮬레이션.
- **앱 레이아웃 & 공통**
  - `Sidebar`, `Header`, 다크모드/테마 토글, 업로드 퀵 액션, 온보딩 환영 다이얼로그.
  - React Router v6.4 `createBrowserRouter` 로 `/app/*` 탭(Assistant, Projects, Skills, Goals, Settings) 구성.
  - React Query Provider, Shadcn UI 컴포넌트, Lucide 아이콘, 전역 스타일 세팅.
- **AI Assistant 작업 공간 (`/app/assistant`)**
  - 프로젝트 업로드(파일/링크/텍스트) → AI 분석 시뮬레이션 → 프로젝트 카드 자동 생성 및 편집.
  - Nexter 챗 인터페이스: 프로젝트별 대화, 추천 질문, 데모 시나리오, 프로젝트 정리 저장.
  - AI 기능 패널: 포트폴리오/자기소개서 초안, 역량 분석, 학습 계획, 목표 직무 제안.
- **Projects / Skills / Goals**
  - `ProjectsBoard`: 유형별 필터, 파일 일괄 다운로드, 상세 모달, 링크 열기 지원.
  - `SkillsOverview`: 카테고리별 스킬 레벨 관리, AI 인사이트, 업적 뱃지, 새 스킬 추가.
  - `GoalsDashboard` 및 `Settings` 기초 UI로 추후 프로필/목표 관리 확장 준비.
- **테스트 & 개발 유틸**
  - MSW(`public/mockServiceWorker.js`, `src/mocks`) 로 API 호출을 로컬에서 가로채 mock 응답 제공.
  - `docs/` 에 아키텍처 가이드와 프로세스 추출 계획 문서화.

## 기술 스택

- **Framework**: React 18, Vite, TypeScript
- **State & Data**: React Query, React Router, Zustand-free local state
- **UI**: Tailwind 기반 Shadcn UI, Lucide Icons
- **Mocking**: MSW(Mock Service Worker)
- **기타**: html2canvas, jspdf 등 문서/이미지 처리 유틸 (향후 PDF/이미지 출력 대비)

## 프로젝트 구조 요약

```
src/
 ├─ app/              # 앱 엔트리, 프로바이더, 라우터
 ├─ pages/            # 라우트 단위 페이지
 ├─ features/         # 도메인별 UI + 상태 묶음
 ├─ entities/         # 엔터티 모델, 쿼리
 ├─ shared/           # 공용 API, config, ui, lib
 ├─ widgets/          # 여러 페이지에서 재사용하는 복합 컴포넌트
 └─ mocks/            # MSW 핸들러
```

## 로컬 실행 방법

```
npm install
```

`.env` 파일에 Mock 플래그를 설정합니다.

```
VITE_USE_MOCK=true
```

- Mock 비활성화(`false`) 시 실제 Supabase 백엔드와 연결할 수 있도록 설계되어 있습니다.

개발 서버 실행:

```
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속하세요.

### Mock ↔ Supabase 전환 가이드

| 모드 | 필수 환경 변수 | 설명 |
| --- | --- | --- |
| **Mock** (기본 로컬 체험) | `VITE_USE_MOCK=true` | - MSW가 `/auth`, `/projects`, `/chat` 요청을 가로채 mock 데이터/응답을 돌려줍니다.<br>- Supabase/AI 서버 주소가 비어 있어도 `AIAssistant`는 자동으로 `/chat` mock 엔드포인트를 사용합니다. |
| **Supabase + AI 서버** | `VITE_USE_MOCK=false` 또는 제거<br>`VITE_SUPABASE_URL`<br>`VITE_SUPABASE_ANON_KEY`<br>`VITE_AI_BASE_URL` | - Mock을 끄면 `shared/api`가 Supabase 어댑터를 로딩합니다.<br>- `AIAssistant`는 `VITE_AI_BASE_URL` 값을 기준으로 `POST {AI_BASE_URL}/chat` 호출을 수행합니다.<br>- 세 값을 모두 채운 뒤 반드시 `npm run dev`를 재시작하세요. |

- 개발/실 서버를 번갈아 사용할 경우 `.env.development`, `.env.production` 등으로 분리 관리하면 편리합니다.
- Supabase/AI 서버 연결 오류가 발생하면 브라우저 콘솔에서 `import.meta.env.VITE_USE_MOCK` 값과 `/chat` 네트워크 응답 상태를 먼저 확인하세요.
  