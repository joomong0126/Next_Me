import { api } from '@/shared/api';
import type { User } from '@/entities/user/model';

export async function fetchCurrentUser(): Promise<User> {
  const me = await api.auth.me();
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    headline: me.headline,
    avatar_url: me.avatar_url,
    goals: me.goals,
    phone: me.phone,
  };
}

