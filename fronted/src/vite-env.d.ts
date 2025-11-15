/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_ASSISTANT_FUNCTION?: string;
  readonly VITE_SUPABASE_ASSISTANT_ORGANIZE_START?: string;
  readonly VITE_SUPABASE_ASSISTANT_ORGANIZE_SUMMARIZE?: string;
  readonly VITE_SUPABASE_ASSISTANT_ORGANIZE_REFINE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

