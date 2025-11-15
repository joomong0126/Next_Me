# Feature-Sliced Design 리팩토링 계획

## 목표
- API / HOOK / UI 완전 분리
- 각 feature 단위로 독립성과 재사용성 강화
- entities와 shared의 순수성 유지
- pages는 경량 UI 스켈레톤만 담당

## 현재 구조 분석

### 문제점
1. ❌ `entities/project/api.ts`에 API 요청 코드가 있음
2. ❌ `entities/user/queries.ts`에 API 요청 코드가 있음
3. ❌ `features/ai/chat/useAssistantChat.ts`에서 supabaseClient 직접 호출
4. ❌ `features/ai/assistant/AIAssistant.tsx`에서 supabaseClient 직접 호출
5. ❌ `pages/app/index.tsx`에서 entities API 직접 호출
6. ❌ React Query 훅이 entities에 혼재

### 현재 파일 구조
```
src/
├── entities/
│   ├── project/
│   │   ├── api.ts          ❌ API 요청 코드 (제거 필요)
│   │   ├── model.ts        ✅ 타입 정의 (유지)
│   │   └── lib/            ✅ 순수 유틸 (유지)
│   └── user/
│       ├── queries.ts      ❌ API 요청 코드 (제거 필요)
│       └── model.ts        ✅ 타입 정의 (유지)
├── features/
│   ├── ai/
│   │   ├── assistant/
│   │   │   ├── AIAssistant.tsx          ❌ supabaseClient 직접 호출
│   │   │   ├── hooks/
│   │   │   │   ├── useAIFeature.ts      ✅ 비즈니스 로직 (유지)
│   │   │   │   └── useAssistantUserProfile.ts  ✅ 비즈니스 로직 (유지)
│   │   │   └── components/              ✅ UI 컴포넌트 (유지)
│   │   └── chat/
│   │       ├── useAssistantChat.ts      ❌ supabaseClient 직접 호출 (970줄)
│   │       └── ChatPanel.tsx            ✅ UI 컴포넌트 (유지)
│   ├── projects/
│   │   ├── board/          ✅ UI 컴포넌트 (유지)
│   │   └── upload/         ✅ UI 컴포넌트 (유지)
│   └── auth/
│       └── hooks/
│           └── useAuthGuard.ts  ❌ entities/user/queries 사용
└── pages/
    └── app/
        └── index.tsx       ❌ entities/project/api 직접 호출
```

## 변경 후 구조

### 1. Entities Layer 정리
```
src/entities/
├── project/
│   ├── model.ts            ✅ 타입 정의만
│   ├── lib/                ✅ 순수 유틸만
│   │   ├── categoryIcons.ts
│   │   └── mapProject.ts
│   └── index.ts            ✅ model, lib만 export
└── user/
    ├── model.ts            ✅ 타입 정의만
    └── index.ts            ✅ model만 export
```

### 2. Features Layer 재구조화

#### 2.1 Projects Feature
```
src/features/projects/
├── api/
│   └── projects.ts         ✅ fetchProjects() 이동
├── hooks/
│   └── useProjects.ts      ✅ React Query 훅 생성
├── board/
│   ├── components/
│   │   └── ProjectsBoard.tsx  ✅ UI 컴포넌트
│   └── index.ts
├── upload/
│   ├── components/
│   │   └── UploadDialog.tsx   ✅ UI 컴포넌트
│   └── index.ts
└── index.ts
```

#### 2.2 Auth Feature
```
src/features/auth/
├── api/
│   └── user.ts             ✅ fetchCurrentUser() 이동
├── hooks/
│   ├── useAuthGuard.ts     ✅ React Query 훅 (수정)
│   └── useUser.ts          ✅ useQuery 훅 생성
├── components/
│   └── RequireAuth.tsx     ✅ UI 컴포넌트
└── ... (기존 구조 유지)
```

#### 2.3 AI Chat Feature
```
src/features/ai/chat/
├── api/
│   └── chat.ts             ✅ supabaseClient 호출 분리
├── hooks/
│   └── useAssistantChat.ts ✅ 비즈니스 로직만 (API 호출 제거)
├── components/
│   └── ChatPanel.tsx       ✅ UI 컴포넌트
├── types.ts                ✅ 타입 정의
└── index.ts
```

#### 2.4 AI Assistant Feature
```
src/features/ai/assistant/
├── api/
│   └── assistant.ts        ✅ supabaseClient 호출 분리
├── hooks/
│   ├── useAIFeature.ts     ✅ 비즈니스 로직 (유지)
│   └── useAssistantUserProfile.ts  ✅ 비즈니스 로직 (유지)
├── components/             ✅ UI 컴포넌트들 (유지)
├── AIAssistant.tsx         ✅ UI 컴포넌트 (API 호출 제거)
├── constants.ts            ✅ 상수 (유지)
├── types.ts                ✅ 타입 정의 (유지)
├── utils/                  ✅ 유틸 (유지)
└── index.ts
```

#### 2.5 Profile Feature (Goals, Skills)
```
src/features/profile/
├── goals/
│   ├── components/
│   │   └── GoalsDashboard.tsx  ✅ UI 컴포넌트 (유지)
│   └── index.ts
└── skills/
    ├── components/
    │   └── SkillsOverview.tsx  ✅ UI 컴포넌트 (유지)
    └── index.ts
```

### 3. Pages Layer 정리
```
src/pages/
└── app/
    ├── index.tsx           ✅ features/projects/hooks만 사용
    └── ... (기존 구조 유지)
```

## 상세 변경 사항

### 변경 1: entities/project/api.ts → features/projects/api/projects.ts

**이전:**
```typescript
// src/entities/project/api.ts
import { api } from '@/shared/api';
import type { Project } from './model';
import { mapProjectRecordToProject } from './lib/mapProject';

export async function fetchProjects(): Promise<Project[]> {
  const records = await api.projects.list();
  return records.map(mapProjectRecordToProject);
}
```

**이후:**
```typescript
// src/features/projects/api/projects.ts
import { api } from '@/shared/api';
import type { Project } from '@/entities/project';
import { mapProjectRecordToProject } from '@/entities/project/lib/mapProject';

export async function fetchProjects(): Promise<Project[]> {
  const records = await api.projects.list();
  return records.map(mapProjectRecordToProject);
}
```

### 변경 2: entities/user/queries.ts → features/auth/api/user.ts

**이전:**
```typescript
// src/entities/user/queries.ts
import { api } from '@/shared/api';
import type { User } from './model';

export async function fetchCurrentUser(): Promise<User> {
  const me = await api.auth.me();
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    headline: me.headline,
  };
}
```

**이후:**
```typescript
// src/features/auth/api/user.ts
import { api } from '@/shared/api';
import type { User } from '@/entities/user';

export async function fetchCurrentUser(): Promise<User> {
  const me = await api.auth.me();
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    headline: me.headline,
  };
}
```

### 변경 3: features/ai/chat/useAssistantChat.ts 리팩토링

**이전:**
- `useAssistantChat.ts` 내부에 supabaseClient 직접 호출 (970줄)

**이후:**
- `features/ai/chat/api/chat.ts`: API 함수들 분리
  - `fetchMessages(projectId)`
  - `sendMessage(projectId, content)`
  - `deleteMessages(projectId)`
  - `saveProjectSummary(projectId, summary)`
  - `invokeAssistantFunction(functionName, body)`
- `features/ai/chat/hooks/useAssistantChat.ts`: 비즈니스 로직만 (API 호출은 api/chat.ts 사용)

### 변경 4: features/ai/assistant/AIAssistant.tsx 리팩토링

**이전:**
- `AIAssistant.tsx` 내부에 supabaseClient 직접 호출 (storage, functions)

**이후:**
- `features/ai/assistant/api/assistant.ts`: API 함수들 분리
  - `uploadFile(bucket, path, file)`
  - `invokeAssistantFunction(functionName, body)`
- `features/ai/assistant/AIAssistant.tsx`: UI 컴포넌트만 (API 호출은 api/assistant.ts 사용)

### 변경 5: React Query 훅 생성

**features/projects/hooks/useProjects.ts:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects } from '../api/projects';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
}
```

**features/auth/hooks/useUser.ts:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/user';

export function useUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
  });
}
```

### 변경 6: pages/app/index.tsx 수정

**이전:**
```typescript
import { fetchProjects } from '@/entities/project/api';

// ...
const loadedProjects = await fetchProjects();
```

**이후:**
```typescript
import { useProjects } from '@/features/projects/hooks/useProjects';

// ...
const { data: projects = [], isLoading } = useProjects();
```

## 단계별 진행 계획

### Phase 1: Projects Feature 리팩토링
1. ✅ `features/projects/api/projects.ts` 생성
2. ✅ `features/projects/hooks/useProjects.ts` 생성
3. ✅ `entities/project/api.ts` 제거
4. ✅ `pages/app/index.tsx` 수정
5. ✅ import 경로 업데이트

### Phase 2: Auth Feature 리팩토링
1. ✅ `features/auth/api/user.ts` 생성
2. ✅ `features/auth/hooks/useUser.ts` 생성
3. ✅ `features/auth/hooks/useAuthGuard.ts` 수정
4. ✅ `entities/user/queries.ts` 제거
5. ✅ import 경로 업데이트

### Phase 3: AI Chat Feature 리팩토링
1. ✅ `features/ai/chat/api/chat.ts` 생성 (API 함수들 분리)
2. ✅ `features/ai/chat/hooks/useAssistantChat.ts` 수정 (API 호출 제거)
3. ✅ import 경로 업데이트

### Phase 4: AI Assistant Feature 리팩토링
1. ✅ `features/ai/assistant/api/assistant.ts` 생성 (API 함수들 분리)
2. ✅ `features/ai/assistant/AIAssistant.tsx` 수정 (API 호출 제거)
3. ✅ import 경로 업데이트

### Phase 5: 최종 검증
1. ✅ 모든 import 경로 확인
2. ✅ 타입 에러 확인
3. ✅ 린트 에러 확인
4. ✅ 빌드 테스트

## 파일 이동 요약

### 생성될 파일
- `src/features/projects/api/projects.ts`
- `src/features/projects/hooks/useProjects.ts`
- `src/features/auth/api/user.ts`
- `src/features/auth/hooks/useUser.ts`
- `src/features/ai/chat/api/chat.ts`
- `src/features/ai/assistant/api/assistant.ts`

### 삭제될 파일
- `src/entities/project/api.ts`
- `src/entities/user/queries.ts`

### 수정될 파일
- `src/pages/app/index.tsx`
- `src/features/auth/hooks/useAuthGuard.ts`
- `src/features/ai/chat/hooks/useAssistantChat.ts`
- `src/features/ai/assistant/AIAssistant.tsx`
- `src/entities/project/index.ts`
- `src/entities/user/index.ts`
- 기타 import 경로가 변경된 모든 파일

## 의존성 규칙 확인

### ✅ 허용되는 의존성
- Pages → Features → Entities → Shared
- Features → Entities → Shared
- Features → Shared

### ❌ 금지되는 의존성
- Entities → Features (금지)
- Entities → Pages (금지)
- Shared → 다른 계층 (금지)

## 예상 효과

1. ✅ **명확한 책임 분리**: API / HOOK / UI가 각각 명확한 역할
2. ✅ **재사용성 향상**: 각 feature가 독립적으로 동작 가능
3. ✅ **테스트 용이성**: API 레이어를 mock으로 쉽게 교체 가능
4. ✅ **유지보수성 향상**: 변경 사항이 해당 feature에만 영향
5. ✅ **FSD 패턴 준수**: 표준 아키텍처 패턴 준수

## 주의사항

1. ⚠️ **순환 참조 방지**: Feature 간 의존성 주의
2. ⚠️ **타입 안정성**: 모든 타입 import 경로 확인
3. ⚠️ **에러 처리**: API 레이어에서 적절한 에러 처리
4. ⚠️ **테스트**: 각 단계별로 테스트 진행

