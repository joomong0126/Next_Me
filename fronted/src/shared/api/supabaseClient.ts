import { createClient } from '@supabase/supabase-js';

type TableRow = Record<string, any>;

type QueryResult<T> = { data: T; error: null } | { data: null; error: Error };

type OrderConfig = { ascending?: boolean };

const isBrowser = typeof window !== 'undefined';

const memoryStore: Record<string, TableRow[]> = {};

const resolveEnv = (processKey: string, viteKey: string) => {
  const fromProcess = (globalThis as any)?.process?.env?.[processKey];
  if (fromProcess) {
    return fromProcess;
  }

  return (import.meta as any)?.env?.[viteKey];
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
    async signOut() {
      return { error: null };
    },
    async getUser() {
      return { data: { user: null }, error: null };
    },
  },
});

const supabaseUrl = resolveEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = resolveEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
const useMockSupabase = (import.meta as any)?.env?.VITE_USE_MOCK === 'true';

let client: ReturnType<typeof createClient> | ReturnType<typeof createMockSupabaseClient>;
let mockClientActive = false;

if (!supabaseUrl || !supabaseAnonKey || useMockSupabase) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.info('[supabase] Missing environment variables – falling back to mock client.');
  } else if (useMockSupabase) {
    console.info('[supabase] VITE_USE_MOCK enabled – using mock Supabase client.');
  }
  client = createMockSupabaseClient();
  mockClientActive = true;
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabaseClient = client as any;
export const isMockSupabaseClient = mockClientActive;