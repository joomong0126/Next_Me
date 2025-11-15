import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/user';
import { UnauthorizedError } from '@/shared/api/errors';
import { readToken } from '@/shared/api/tokenStorage';

export function useUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!readToken()) {
        throw new UnauthorizedError('Missing token');
      }
      return fetchCurrentUser();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

