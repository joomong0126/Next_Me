# 디렉토리 구조 변경 (Diff)

## 변경 전후 전체 구조 비교

### 변경 전 구조
```
src/
├── entities/
│   ├── project/
│   │   ├── api.ts                    ❌ 제거
│   │   ├── model.ts                  ✅ 유지
│   │   ├── lib/
│   │   │   ├── categoryIcons.ts      ✅ 유지
│   │   │   └── mapProject.ts         ✅ 유지
│   │   └── index.ts                  🔄 수정 (api.ts 제거)
│   └── user/
│       ├── queries.ts                ❌ 제거
│       ├── model.ts                  ✅ 유지
│       └── index.ts                  🔄 수정 (queries.ts 제거)
│
├── features/
│   ├── projects/
│   │   ├── board/
│   │   │   └── ProjectsBoard.tsx     ✅ 유지
│   │   ├── upload/
│   │   │   └── UploadDialog.tsx      ✅ 유지
│   │   └── index.ts                  ✅ 유지
│   │
│   ├── auth/
│   │   ├── hooks/
│   │   │   └── useAuthGuard.ts       🔄 수정 (import 경로 변경)
│   │   └── components/
│   │       └── RequireAuth.tsx       ✅ 유지
│   │
│   └── ai/
│       ├── chat/
│       │   ├── useAssistantChat.ts   🔄 수정 (API 호출 제거)
│       │   ├── ChatPanel.tsx         ✅ 유지
│       │   └── types.ts              ✅ 유지
│       │
│       └── assistant/
│           ├── AIAssistant.tsx       🔄 수정 (API 호출 제거)
│           ├── hooks/
│           │   ├── useAIFeature.ts   ✅ 유지
│           │   └── useAssistantUserProfile.ts  ✅ 유지
│           ├── components/           ✅ 유지
│           ├── constants.ts          ✅ 유지
│           ├── types.ts              ✅ 유지
│           └── utils/                ✅ 유지
│
└── pages/
    └── app/
        └── index.tsx                 🔄 수정 (import 경로 변경)
```

### 변경 후 구조
```
src/
├── entities/
│   ├── project/
│   │   ├── model.ts                  ✅ 유지 (변경 없음)
│   │   ├── lib/
│   │   │   ├── categoryIcons.ts      ✅ 유지 (변경 없음)
│   │   │   └── mapProject.ts         ✅ 유지 (변경 없음)
│   │   └── index.ts                  ✅ 수정 (api.ts 제거, model, lib만 export)
│   └── user/
│       ├── model.ts                  ✅ 유지 (변경 없음)
│       └── index.ts                  ✅ 수정 (queries.ts 제거, model만 export)
│
├── features/
│   ├── projects/
│   │   ├── api/                      ✨ 신규
│   │   │   └── projects.ts           ✨ 신규 (entities/project/api.ts에서 이동)
│   │   ├── hooks/                    ✨ 신규
│   │   │   └── useProjects.ts        ✨ 신규 (React Query 훅 생성)
│   │   ├── board/
│   │   │   └── ProjectsBoard.tsx     ✅ 유지 (변경 없음)
│   │   ├── upload/
│   │   │   └── UploadDialog.tsx      ✅ 유지 (변경 없음)
│   │   └── index.ts                  ✅ 유지 (변경 없음)
│   │
│   ├── auth/
│   │   ├── api/                      ✨ 신규
│   │   │   └── user.ts               ✨ 신규 (entities/user/queries.ts에서 이동)
│   │   ├── hooks/
│   │   │   ├── useAuthGuard.ts       ✅ 수정 (import 경로 변경)
│   │   │   └── useUser.ts            ✨ 신규 (React Query 훅 생성)
│   │   └── components/
│   │       └── RequireAuth.tsx       ✅ 유지 (변경 없음)
│   │
│   └── ai/
│       ├── chat/
│       │   ├── api/                  ✨ 신규
│       │   │   └── chat.ts           ✨ 신규 (useAssistantChat.ts에서 API 분리)
│       │   ├── hooks/                ✨ 신규 (폴더 구조 정리)
│       │   │   └── useAssistantChat.ts  ✅ 수정 (API 호출 제거, api/chat.ts 사용)
│       │   ├── ChatPanel.tsx         ✅ 유지 (변경 없음)
│       │   ├── types.ts              ✅ 유지 (변경 없음)
│       │   └── index.ts              ✅ 유지 (변경 없음)
│       │
│       └── assistant/
│           ├── api/                  ✨ 신규
│           │   └── assistant.ts      ✨ 신규 (AIAssistant.tsx에서 API 분리)
│           ├── AIAssistant.tsx       ✅ 수정 (API 호출 제거, api/assistant.ts 사용)
│           ├── hooks/
│           │   ├── useAIFeature.ts   ✅ 유지 (변경 없음)
│           │   └── useAssistantUserProfile.ts  ✅ 유지 (변경 없음)
│           ├── components/           ✅ 유지 (변경 없음)
│           ├── constants.ts          ✅ 유지 (변경 없음)
│           ├── types.ts              ✅ 유지 (변경 없음)
│           └── utils/                ✅ 유지 (변경 없음)
│
└── pages/
    └── app/
        └── index.tsx                 ✅ 수정 (entities/project/api → features/projects/hooks)
```

## 파일별 변경 사항

### ✨ 신규 생성 파일

#### 1. `src/features/projects/api/projects.ts`
- **이전 위치**: `src/entities/project/api.ts`
- **변경 내용**: 파일 이동 + import 경로 수정
- **내용**:
  ```typescript
  import { api } from '@/shared/api';
  import type { Project } from '@/entities/project';
  import { mapProjectRecordToProject } from '@/entities/project/lib/mapProject';

  export async function fetchProjects(): Promise<Project[]> {
    const records = await api.projects.list();
    return records.map(mapProjectRecordToProject);
  }
  ```

#### 2. `src/features/projects/hooks/useProjects.ts`
- **신규 생성**: React Query 훅
- **내용**:
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { fetchProjects } from '../api/projects';

  export function useProjects() {
    return useQuery({
      queryKey: ['projects'],
      queryFn: fetchProjects,
    });
  }
  ```

#### 3. `src/features/auth/api/user.ts`
- **이전 위치**: `src/entities/user/queries.ts`
- **변경 내용**: 파일 이동 + 함수명 유지 (fetchCurrentUser)
- **내용**:
  ```typescript
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

#### 4. `src/features/auth/hooks/useUser.ts`
- **신규 생성**: React Query 훅
- **내용**:
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

#### 5. `src/features/ai/chat/api/chat.ts`
- **신규 생성**: useAssistantChat.ts에서 API 함수들 분리
- **주요 함수**:
  - `fetchMessages(projectId: number)`
  - `sendMessage(projectId: number, content: string, role: 'user' | 'ai')`
  - `deleteMessages(projectId: number)`
  - `saveProjectSummary(projectId: number, summary: string)`
  - `invokeAssistantFunction(functionName: string, body: any)`

#### 6. `src/features/ai/assistant/api/assistant.ts`
- **신규 생성**: AIAssistant.tsx에서 API 함수들 분리
- **주요 함수**:
  - `uploadFile(bucket: string, path: string, file: File)`
  - `invokeAssistantFunction(functionName: string, body: any)`
  - `processWithRealService(payload, userRole)`
  - `processWithMockService(payload, userRole)`

### ❌ 삭제될 파일

#### 1. `src/entities/project/api.ts`
- **이유**: API 요청 코드는 features 레이어로 이동
- **대체**: `src/features/projects/api/projects.ts`

#### 2. `src/entities/user/queries.ts`
- **이유**: API 요청 코드는 features 레이어로 이동
- **대체**: `src/features/auth/api/user.ts`

### 🔄 수정될 파일

#### 1. `src/entities/project/index.ts`
**이전:**
```typescript
export * from './model';
export * from './api';  // ❌ 제거
export * from './lib/categoryIcons';
export * from './lib/mapProject';
```

**이후:**
```typescript
export * from './model';
export * from './lib/categoryIcons';
export * from './lib/mapProject';
// api.ts 제거
```

#### 2. `src/entities/user/index.ts`
**이전:**
```typescript
export * from './model';
export * from './queries';  // ❌ 제거
```

**이후:**
```typescript
export * from './model';
// queries.ts 제거
```

#### 3. `src/pages/app/index.tsx`
**이전:**
```typescript
import { fetchProjects } from '@/entities/project/api';

// ...
useEffect(() => {
  const loadProjects = async () => {
    try {
      const loadedProjects = await fetchProjects();
      setProjects(loadedProjects);
    } catch (error) {
      // ...
    }
  };
  void loadProjects();
}, []);
```

**이후:**
```typescript
import { useProjects } from '@/features/projects/hooks/useProjects';

// ...
const { data: projects = [], isLoading } = useProjects();

// 또는 상태 관리가 필요한 경우:
// useEffect(() => {
//   if (projects) {
//     setProjects(projects);
//   }
// }, [projects]);
```

#### 4. `src/features/auth/hooks/useAuthGuard.ts`
**이전:**
```typescript
import { fetchCurrentUser } from '@/entities/user/queries';

export function useAuthGuard() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      // ...
      return fetchCurrentUser();
    },
  });
}
```

**이후:**
```typescript
import { fetchCurrentUser } from '../api/user';

export function useAuthGuard() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      // ...
      return fetchCurrentUser();
    },
  });
}
```

#### 5. `src/features/ai/chat/hooks/useAssistantChat.ts`
**이전:**
- supabaseClient 직접 호출 (970줄)
- API 로직과 비즈니스 로직 혼재

**이후:**
- `api/chat.ts`에서 API 함수 import
- 비즈니스 로직만 유지
- API 호출은 `api/chat.ts`의 함수 사용

**주요 변경:**
```typescript
// 이전
const { data, error } = await supabaseClient
  .from('assistant_messages')
  .select('*')
  .eq('project_id', projectId);

// 이후
import { fetchMessages } from '../api/chat';

const messages = await fetchMessages(projectId);
```

#### 6. `src/features/ai/assistant/AIAssistant.tsx`
**이전:**
- supabaseClient 직접 호출 (storage, functions)

**이후:**
- `api/assistant.ts`에서 API 함수 import
- UI 로직만 유지
- API 호출은 `api/assistant.ts`의 함수 사용

**주요 변경:**
```typescript
// 이전
const storageClient = supabaseClient?.storage;
await storageClient.from(bucket).upload(path, file);

// 이후
import { uploadFile } from './api/assistant';

await uploadFile(bucket, path, file);
```

## Import 경로 변경 요약

### 변경 전 → 변경 후

1. **Projects API**
   - `@/entities/project/api` → `@/features/projects/api/projects`

2. **User API**
   - `@/entities/user/queries` → `@/features/auth/api/user`

3. **Projects Hook**
   - 없음 → `@/features/projects/hooks/useProjects`

4. **User Hook**
   - 없음 → `@/features/auth/hooks/useUser`

5. **Chat API**
   - `@/shared/api/supabaseClient` (직접 호출) → `@/features/ai/chat/api/chat`

6. **Assistant API**
   - `@/shared/api/supabaseClient` (직접 호출) → `@/features/ai/assistant/api/assistant`

## 영향받는 파일 목록

### 직접 수정 필요 파일
1. `src/entities/project/index.ts`
2. `src/entities/user/index.ts`
3. `src/pages/app/index.tsx`
4. `src/features/auth/hooks/useAuthGuard.ts`
5. `src/features/ai/chat/hooks/useAssistantChat.ts`
6. `src/features/ai/assistant/AIAssistant.tsx`
7. `src/app/providers/QueryProvider.tsx` (entities/user/queries 사용 시)

### 간접 영향 파일 (import 경로 변경)
- `src/features/projects/board/ProjectsBoard.tsx` (만약 entities/project/api 사용 시)
- 기타 entities/project/api 또는 entities/user/queries를 import하는 모든 파일

## 검증 체크리스트

### Phase 1: Projects Feature
- [ ] `features/projects/api/projects.ts` 생성
- [ ] `features/projects/hooks/useProjects.ts` 생성
- [ ] `entities/project/api.ts` 제거
- [ ] `entities/project/index.ts` 수정
- [ ] `pages/app/index.tsx` 수정
- [ ] import 경로 업데이트
- [ ] 타입 에러 확인
- [ ] 빌드 테스트

### Phase 2: Auth Feature
- [ ] `features/auth/api/user.ts` 생성
- [ ] `features/auth/hooks/useUser.ts` 생성
- [ ] `entities/user/queries.ts` 제거
- [ ] `entities/user/index.ts` 수정
- [ ] `features/auth/hooks/useAuthGuard.ts` 수정
- [ ] `app/providers/QueryProvider.tsx` 수정 (필요 시)
- [ ] import 경로 업데이트
- [ ] 타입 에러 확인
- [ ] 빌드 테스트

### Phase 3: AI Chat Feature
- [ ] `features/ai/chat/api/chat.ts` 생성
- [ ] `features/ai/chat/hooks/useAssistantChat.ts` 수정
- [ ] `features/ai/chat/hooks/` 폴더 구조 정리
- [ ] import 경로 업데이트
- [ ] 타입 에러 확인
- [ ] 빌드 테스트
- [ ] 기능 테스트 (채팅 동작 확인)

### Phase 4: AI Assistant Feature
- [ ] `features/ai/assistant/api/assistant.ts` 생성
- [ ] `features/ai/assistant/AIAssistant.tsx` 수정
- [ ] import 경로 업데이트
- [ ] 타입 에러 확인
- [ ] 빌드 테스트
- [ ] 기능 테스트 (파일 업로드, AI 분석 동작 확인)

### Phase 5: 최종 검증
- [ ] 모든 import 경로 확인
- [ ] 타입 에러 없음 확인
- [ ] 린트 에러 없음 확인
- [ ] 빌드 성공 확인
- [ ] 런타임 에러 없음 확인
- [ ] 기능 동작 확인

## 예상 소요 시간

- Phase 1 (Projects): ~30분
- Phase 2 (Auth): ~20분
- Phase 3 (AI Chat): ~1시간 (970줄 리팩토링)
- Phase 4 (AI Assistant): ~30분
- Phase 5 (최종 검증): ~30분

**총 예상 시간**: ~2.5시간

