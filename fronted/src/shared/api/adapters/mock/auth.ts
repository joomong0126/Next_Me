import type {
  AuthAPI,
  GoogleLoginInput,
  LoginInput,
  LoginOutput,
  MeOutput,
  SignupInput,
  SignupOutput,
} from '../../contracts';
import { clearAuthToken, requestJSON, setAuthToken } from './client';

export const auth: AuthAPI = {
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    const result = await requestJSON<LoginOutput>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      { skipAuth: true },
    );
    setAuthToken(result.token);
    return result;
  },
  async loginWithGoogle({ email, name }: GoogleLoginInput): Promise<LoginOutput> {
    const result = await requestJSON<LoginOutput>(
      '/auth/google',
      {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      },
      { skipAuth: true },
    );
    setAuthToken(result.token);
    return result;
  },
  async signup(input: SignupInput): Promise<SignupOutput> {
    const result = await requestJSON<SignupOutput>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      { skipAuth: true },
    );
    setAuthToken(result.token);
    return result;
  },
  async logout() {
    clearAuthToken();
  },
  async me(): Promise<MeOutput> {
    return requestJSON<MeOutput>('/profiles/me');
  },
};