import type { API } from './contracts';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

const loader = useMock ? import('./adapters/mock') : import('./adapters/supabase');

export const api: API = (await loader).api;

