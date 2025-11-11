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

export type ProjectRecordType = 'file' | 'link' | 'project';

export type ProjectRecord = {
  id: number;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  type: ProjectRecordType;
  sourceUrl?: string | null;
  period?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  role?: string | null;
  achievements?: string | null;
  tools?: string | null;
  description?: string | null;
};

export interface AuthAPI {
  login(input: LoginInput): Promise<LoginOutput>;
  loginWithGoogle(input: GoogleLoginInput): Promise<LoginOutput>;
  signup(input: SignupInput): Promise<SignupOutput>;
  logout(): Promise<void>;
  me(): Promise<MeOutput>;
}

export interface ProjectsAPI {
  list(): Promise<ProjectRecord[]>;
}

export interface API {
  auth: AuthAPI;
  projects: ProjectsAPI;
}
