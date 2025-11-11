import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

if (useMock && typeof window !== 'undefined') {
  const { worker } = await import('../mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
