import type { API } from './contracts';

// 환경 변수 디버깅 (가장 먼저 확인)
console.log('[api] ========== ENVIRONMENT DEBUG ==========');
console.log('[api] import.meta.env:', import.meta.env);
console.log('[api] All VITE_ keys:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('[api] VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK);
console.log('[api] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'exists' : 'MISSING');
console.log('[api] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'MISSING');
console.log('[api] =======================================');

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// 디버깅을 위한 로그
console.log('[api] Mock mode check:', {
  VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK,
  useMock,
  usingAdapter: useMock ? 'mock' : 'supabase',
});

const loader = useMock ? import('./adapters/mock') : import('./adapters/supabase');
const loadedApi = (await loader).api;

// 실제 사용 중인 어댑터 확인 (순환 참조 방지를 위해 lazy import)
if (!useMock) {
  // Supabase 어댑터를 로드한 후 클라이언트 상태 확인
  import('./supabaseClient').then(({ isMockSupabaseClient }) => {
    if (isMockSupabaseClient) {
      console.error('[api] ❌ ERROR: API adapter is set to supabase but Supabase client is mock!');
      console.error('[api] This means VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
      console.error('[api] Check your .env file and restart the dev server.');
      console.error('[api] Make sure .env file is in the project root (same level as package.json)');
      console.error('[api] Current env values:', {
        VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK,
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'exists' : 'MISSING',
      });
    } else {
      console.info('[api] ✅ Using supabase adapter with real Supabase client');
    }
  });
} else {
  console.info('[api] ✅ Using mock adapter (VITE_USE_MOCK=true)');
}

export const api: API = loadedApi;

