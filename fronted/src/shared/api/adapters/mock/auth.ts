import type {
  AuthAPI,
  ChangePasswordInput,
  GoogleLoginInput,
  LoginInput,
  LoginOutput,
  MeOutput,
  SignupInput,
  SignupOutput,
  UpdateProfileInput,
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
  async resendEmailConfirmation(_email: string): Promise<void> {
    // Mock에서는 즉시 성공
    await new Promise((resolve) => setTimeout(resolve, 500));
  },
  async changePassword({ currentPassword, newPassword }: ChangePasswordInput): Promise<void> {
    // Mock에서는 현재 비밀번호 확인 없이 즉시 성공
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.info('[mock/auth] Password changed successfully');
  },
  async deleteAccount(): Promise<void> {
    // Mock에서는 즉시 계정 삭제 및 로그아웃
    await new Promise((resolve) => setTimeout(resolve, 500));
    clearAuthToken();
    console.info('[mock/auth] Account deleted successfully');
  },
  async updateProfile(input: UpdateProfileInput): Promise<MeOutput> {
    const currentProfile = await this.me();
    const updatedProfile = {
      ...currentProfile,
      ...input,
    };
    // Mock에서는 즉시 성공
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.info('[mock/auth] Profile updated successfully');
    return updatedProfile;
  },
};