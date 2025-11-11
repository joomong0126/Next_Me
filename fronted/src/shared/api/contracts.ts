export type SignupMethod = 'email' | 'google';

export type LoginInput = { email: string; password: string };

export type GoogleLoginInput = { email: string; name: string };

export type SignupInput = {
  email: string;
  password?: string;
  name: string;
  phone: string;
  status: string;
  goals: string[];
  method: SignupMethod;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  headline?: string;
  phone?: string;
  status?: string;
  goals?: string[];
  method?: SignupMethod;
};

export type LoginOutput = {
  token: string;
  user: AuthUser;
};

export type SignupOutput = LoginOutput;

export type MeOutput = AuthUser;

export interface AuthAPI {
  login(input: LoginInput): Promise<LoginOutput>;
  loginWithGoogle(input: GoogleLoginInput): Promise<LoginOutput>;
  signup(input: SignupInput): Promise<SignupOutput>;
  logout(): Promise<void>;
  me(): Promise<MeOutput>;
}

export interface API {
  auth: AuthAPI;
}
