import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/entities/user/queries';
import { readToken } from '@/shared/api/tokenStorage';
import { subscribeUnauthorizedEvent } from '@/shared/api/authEvents';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    if (!readToken()) {
      return;
    }
    client
      .prefetchQuery({
        queryKey: ['auth', 'me'],
        queryFn: fetchCurrentUser,
      })
      .catch(() => {
        // ignore prefetch failures; regular guard will handle auth state
      });
  }, [client]);
  useEffect(() => {
    return subscribeUnauthorizedEvent(() => {
      client.removeQueries({ queryKey: ['auth', 'me'] });
      client.invalidateQueries({ queryKey: ['auth', 'me'] }).catch(() => {
        // no-op
      });
    });
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

