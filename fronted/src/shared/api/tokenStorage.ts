const TOKEN_STORAGE_KEY = 'next-me:auth-token';

const isBrowser = typeof window !== 'undefined';

export function readToken(): string | null {
  if (!isBrowser) {
    return null;
  }
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string) {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // no-op
  }
}

export function removeToken() {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export { TOKEN_STORAGE_KEY };


