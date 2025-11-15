import { createClient } from '@supabase/supabase-js';
import { readToken } from './tokenStorage';

type TableRow = Record<string, any>;

type QueryResult<T> = { data: T; error: null } | { data: null; error: Error };

type OrderConfig = { ascending?: boolean };

const isBrowser = typeof window !== 'undefined';

const memoryStore: Record<string, TableRow[]> = {};

const resolveEnv = (processKey: string, viteKey: string) => {
  // Node.js 환경 (서버 사이드)
  const fromProcess = (globalThis as any)?.process?.env?.[processKey];
  if (fromProcess) {
    console.log(`[resolveEnv] Found ${processKey} from process.env:`, fromProcess.substring(0, 20) + '...');
    return fromProcess;
  }

  // Vite 환경 (클라이언트 사이드)
  const fromVite = (import.meta as any)?.env?.[viteKey];
  if (fromVite) {
    console.log(`[resolveEnv] Found ${viteKey} from import.meta.env:`, fromVite.substring(0, 20) + '...');
    return fromVite;
  }

  console.warn(`[resolveEnv] ⚠️ Not found: ${processKey} or ${viteKey}`);
  return undefined;
};

const storageKey = (table: string) => `mock-supabase::${table}`;

const readTable = (table: string): TableRow[] => {
  if (isBrowser) {
    try {
      const raw = window.localStorage.getItem(storageKey(table));
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // noop – fall through to memory store fallback
    }
  }

  if (!memoryStore[table]) {
    memoryStore[table] = [];
  }
  return memoryStore[table];
};

const writeTable = (table: string, rows: TableRow[]) => {
  const snapshot = rows.map((row) => ({ ...row }));

  if (isBrowser) {
    try {
      window.localStorage.setItem(storageKey(table), JSON.stringify(snapshot));
      return;
    } catch {
      // If persisting to localStorage fails, fall back to in-memory store.
    }
  }

  memoryStore[table] = snapshot;
};

const pickColumns = (row: TableRow, columns: string[] | null): TableRow => {
  if (!columns || columns.length === 0 || columns.includes('*')) {
    return { ...row };
  }

  const picked: TableRow = {};
  for (const column of columns) {
    const key = column.trim();
    if (!key) continue;
    picked[key] = row[key];
  }
  return picked;
};

const parseColumnList = (columnList: string | undefined) => {
  if (!columnList) return null;
  return columnList
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
};

const nextId = (rows: TableRow[]) => {
  const max = rows.reduce((acc, row) => {
    const numericId = typeof row.id === 'number' ? row.id : Number(row.id);
    return Number.isFinite(numericId) ? Math.max(acc, numericId) : acc;
  }, 0);
  return max + 1;
};

class MockSelectQuery {
  private readonly table: string;
  private columns: string[] | null;
  private filters: Array<{ column: string; value: unknown }> = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private singleRow = false;

  constructor(table: string, columns: string | undefined) {
    this.table = table;
    this.columns = parseColumnList(columns);
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, config: OrderConfig = {}) {
    this.orderConfig = { column, ascending: config.ascending ?? true };
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  maybeSingle() {
    this.singleRow = true;
    return this;
  }

  async execute(): Promise<QueryResult<any>> {
    let rows = [...readTable(this.table)];

    if (this.filters.length > 0) {
      rows = rows.filter((row) => this.filters.every((filter) => row[filter.column] === filter.value));
    }

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      rows.sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];
        if (aValue === bValue) return 0;
        if (aValue === undefined) return ascending ? -1 : 1;
        if (bValue === undefined) return ascending ? 1 : -1;
        return aValue > bValue ? (ascending ? 1 : -1) : ascending ? -1 : 1;
      });
    }

    const pickedRows = rows.map((row) => pickColumns(row, this.columns));

    if (this.singleRow) {
      const first = pickedRows[0] ?? null;
      return { data: first, error: null };
    }

    return { data: pickedRows, error: null };
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
}

class MockInsertQuery {
  private readonly table: string;
  private readonly insertedRows: TableRow[];
  private columns: string[] | null = null;
  private singleRow = false;

  constructor(table: string, payload: TableRow | TableRow[]) {
    this.table = table;

    const rows = Array.isArray(payload) ? payload : [payload];
    const existing = readTable(table);
    const clonedExisting = existing.map((row) => ({ ...row }));
    let autoIncrementId = nextId(clonedExisting);

    const toInsert = rows.map((row) => {
      const clone = { ...row };
      if (clone.id === undefined || clone.id === null || clone.id === '') {
        clone.id = autoIncrementId;
        autoIncrementId += 1;
      }
      if (!clone.created_at) {
        clone.created_at = new Date().toISOString();
      }
      return clone;
    });

    writeTable(table, [...clonedExisting, ...toInsert]);

    this.insertedRows = toInsert;
  }

  select(columns?: string) {
    this.columns = parseColumnList(columns);
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  maybeSingle() {
    this.singleRow = true;
    return this;
  }

  async execute(): Promise<QueryResult<any>> {
    const rows = this.insertedRows.map((row) => pickColumns(row, this.columns));
    if (this.singleRow) {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
}

class MockDeleteQuery {
  private readonly table: string;
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  async execute(): Promise<QueryResult<null>> {
    const existing = readTable(this.table);

    if (this.filters.length === 0) {
      writeTable(this.table, []);
      return { data: null, error: null };
    }

    const remaining = existing.filter((row) => !this.filters.every((filter) => row[filter.column] === filter.value));
    writeTable(this.table, remaining);
    return { data: null, error: null };
  }

  then<TResult1 = QueryResult<null>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
}

const createMockSupabaseClient = () => ({
  from(table: string) {
    return {
      select(columns?: string) {
        return new MockSelectQuery(table, columns);
      },
      insert(payload: TableRow | TableRow[]) {
        return new MockInsertQuery(table, payload);
      },
      delete() {
        return new MockDeleteQuery(table);
      },
    };
  },
  auth: {
    // These methods are not implemented for the mock client.
    async signInWithPassword() {
      throw new Error('Supabase auth is not available in mock mode.');
    },
    async signUp() {
      throw new Error('Supabase auth is not available in mock mode.');
    },
    async signInWithOAuth() {
      throw new Error('Supabase auth is not available in mock mode.');
    },
    async updateUser() {
      throw new Error('Supabase auth is not available in mock mode.');
    },
    async signOut() {
      return { error: null };
    },
    async getUser() {
      return { data: { user: null }, error: null };
    },
  },
});

// Vite에서는 import.meta.env에서 직접 접근해야 함
// 타입스크립트를 위해 import.meta.env로 직접 접근
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const viteUseMock = import.meta.env.VITE_USE_MOCK as string | undefined;
const useMockSupabase = viteUseMock === 'true';
const explicitDisableMock = viteUseMock === 'false';

// 디버깅을 위한 환경 변수 로그
const allEnvKeys = Object.keys((import.meta as any)?.env || {}).filter(key => key.startsWith('VITE_'));
console.log('[supabase] Environment check:', {
  VITE_USE_MOCK: viteUseMock,
  useMockSupabase,
  explicitDisableMock,
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseAnonKey: !!supabaseAnonKey,
  supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
  supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing',
  // 전체 VITE_ 환경 변수 확인
  allEnvKeys,
  // 실제 값 확인 (보안상 일부만)
  envValues: allEnvKeys.reduce((acc, key) => {
    const value = (import.meta as any)?.env?.[key];
    acc[key] = typeof value === 'string' ? `${value.substring(0, 30)}...` : value;
    return acc;
  }, {} as Record<string, any>),
});

let client: ReturnType<typeof createClient> | ReturnType<typeof createMockSupabaseClient>;
let mockClientActive = false;

// VITE_USE_MOCK이 명시적으로 false인데 환경 변수가 없으면 에러
if (explicitDisableMock && (!supabaseUrl || !supabaseAnonKey)) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  console.error(
    `[supabase] ❌ ERROR: VITE_USE_MOCK is set to 'false' but required environment variables are missing: ${missing.join(', ')}`,
  );
  console.error(
    '[supabase] Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or set VITE_USE_MOCK=true to use mock mode.',
  );
  throw new Error(
    `Supabase environment variables missing: ${missing.join(', ')}. Set VITE_USE_MOCK=true to use mock mode, or provide required Supabase credentials.`,
  );
}

if (!supabaseUrl || !supabaseAnonKey || useMockSupabase) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] Missing environment variables – falling back to mock client.');
    console.warn('[supabase] To use real Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  } else if (useMockSupabase) {
    console.info('[supabase] VITE_USE_MOCK enabled – using mock Supabase client.');
  }
  client = createMockSupabaseClient();
  mockClientActive = true;
} else {
  console.info('[supabase] Using real Supabase client.');
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  // 저장된 토큰이 있으면 세션 복원 시도
  if (isBrowser) {
    const token = readToken();
    if (token) {
      // 토큰이 있으면 세션 복원 시도
      // Supabase는 자동으로 세션을 관리하지만, 수동으로도 설정 가능
      console.info('[supabase] Found stored token, attempting to restore session...');
      // Supabase는 localStorage에 자체 세션을 저장하므로 별도 설정 불필요
      // 하지만 토큰이 있으면 auth.getSession()을 호출하여 세션 확인
      client.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.warn('[supabase] Error getting session:', error);
        } else if (data?.session) {
          console.info('[supabase] Session restored successfully');
        } else {
          console.warn('[supabase] No active session found, user may need to login');
        }
      }).catch((error: any) => {
        console.warn('[supabase] Error restoring session:', error);
      });
    }
  }
}

export const supabaseClient = client as any;
export const isMockSupabaseClient = mockClientActive;