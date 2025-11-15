import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// 디버깅을 위한 로그
console.log('[main] MSW mock check:', {
  VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK,
  useMock,
  willStartMSW: useMock && typeof window !== 'undefined',
});

if (useMock && typeof window !== 'undefined') {
  console.info('[main] Starting MSW (Mock Service Worker)...');
  const { worker } = await import('../mocks/browser');
  await worker.start({
    onUnhandledRequest(request) {
      // /api/supabase-functions/* 경로는 MSW가 가로채지 않고 실제 서버로 전달
      if (request.url.includes('/api/supabase-functions')) {
        console.log('[MSW] Supabase Functions 경로는 bypass:', request.url);
        return;
      }
      // 다른 경로는 기본 동작 (bypass)
      console.warn('[MSW] Unhandled request:', request.method, request.url);
    },
  });
  console.info('[main] MSW started successfully');
  console.info('[main] MSW는 /api/supabase-functions/* 경로를 가로채지 않습니다');
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
