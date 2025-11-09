export type LoginInput = { email: string; password: string };

export type LoginOutput = {
  token: string;
  user: { id: string; email: string; name?: string };
};

export type MeOutput = {
  id: string;
  email: string;
  name: string;
  headline?: string;
};

export interface AuthAPI {
  login(input: LoginInput): Promise<LoginOutput>;
  logout(): Promise<void>;
  me(): Promise<MeOutput>;
}

export interface API {
  auth: AuthAPI;
}

