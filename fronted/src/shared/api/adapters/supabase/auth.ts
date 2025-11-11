import type {
  AuthAPI,
  GoogleLoginInput,
  LoginInput,
  LoginOutput,
  MeOutput,
  SignupInput,
  SignupOutput,
} from '../../contracts';
import { UnauthorizedError } from '../../errors';
import { supabaseClient } from '../../supabaseClient';

const sb = supabaseClient;

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
  async loginWithGoogle(_input: GoogleLoginInput): Promise<LoginOutput> {
    throw new Error('Google OAuth login is not implemented for the Supabase adapter yet.');
  },
  async signup(_input: SignupInput): Promise<SignupOutput> {
    throw new Error('Signup is not implemented for the Supabase adapter yet.');
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
      throw new UnauthorizedError();
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? 'User',
      headline: user.user_metadata?.headline ?? undefined,
    };
  },
};