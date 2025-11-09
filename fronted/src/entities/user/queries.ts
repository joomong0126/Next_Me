import { api } from '@/shared/api';
import type { User } from './model';

export async function fetchCurrentUser(): Promise<User> {
  const me = await api.auth.me();
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    headline: me.headline,
  };
}

