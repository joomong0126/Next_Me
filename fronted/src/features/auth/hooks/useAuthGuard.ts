import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '@/entities/user/queries';

export function useAuthGuard() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    retry: false,
  });
}

