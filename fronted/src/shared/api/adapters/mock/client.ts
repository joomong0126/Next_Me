import { emitUnauthorizedEvent } from '../../authEvents';
import { UnauthorizedError } from '../../errors';
import { readToken, removeToken, writeToken } from '../../tokenStorage';

let cachedToken: string | null | undefined;

export function getAuthToken(): string | null {
  if (cachedToken === undefined) {
    cachedToken = readToken();
  }
  return cachedToken ?? null;
}

export function setAuthToken(token: string) {
  cachedToken = token;
  writeToken(token);
}

export function clearAuthToken() {
  cachedToken = null;
  removeToken();
}

interface RequestOptions {
  skipAuth?: boolean;
}

export async function requestJSON<TResponse>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers ?? undefined);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String(payload.message)
        : response.statusText || 'Request failed';
    if (response.status === 401) {
      clearAuthToken();
      emitUnauthorizedEvent();
      throw new UnauthorizedError(message || '401 Unauthorized');
    }
    throw new Error(message);
  }

  return payload as TResponse;
}


