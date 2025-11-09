import { createClient } from '@supabase/supabase-js';
import type { AuthAPI, LoginInput, LoginOutput, MeOutput } from '../../contracts';

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

export const auth: AuthAPI = {
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    // TODO: Replace with domain-specific login flow and map Supabase response to app model.
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    return {
      token: data.session!.access_token,
      user: { id: data.user!.id, email: data.user!.email! },
    };
  },
  async logout() {
    // TODO: Extend with any local cleanup or telemetry once Supabase integration is finalized.
    await sb.auth.signOut();
  },
  async me(): Promise<MeOutput> {
    // TODO: Map to richer profile data when Supabase schema is available.
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      throw new Error('401 Unauthorized');
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? 'User',
    };
  },
};

