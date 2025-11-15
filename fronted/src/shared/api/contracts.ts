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

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

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
  role?: string | null; // API 응답 시에는 string | null, 입력 시에는 string | string[] | null도 허용
  achievements?: string | null;
  tools?: string | null; // API 응답 시에는 string | null, 입력 시에는 string | string[] | null도 허용
  description?: string | null;
};

// 프로젝트 생성/수정 시 입력 타입 (배열 필드가 string | string[] | null을 받을 수 있도록 확장)
export type ProjectRecordInput = Omit<ProjectRecord, 'role' | 'tools' | 'tags'> & {
  role?: string | string[] | null;
  tools?: string | string[] | null;
  tags?: string | string[] | null;
};

export interface AuthAPI {
  login(input: LoginInput): Promise<LoginOutput>;
  loginWithGoogle(input: GoogleLoginInput): Promise<LoginOutput>;
  signup(input: SignupInput): Promise<SignupOutput>;
  logout(): Promise<void>;
  me(): Promise<MeOutput>;
  resendEmailConfirmation(email: string): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  deleteAccount(): Promise<void>;
}

export interface ProjectsAPI {
  list(): Promise<ProjectRecord[]>;
  create(data: Partial<ProjectRecordInput>): Promise<ProjectRecord>;
  update(id: number | string, data: Partial<ProjectRecordInput>): Promise<ProjectRecord>;
  delete(id: number | string): Promise<void>;
}

export interface API {
  auth: AuthAPI;
  projects: ProjectsAPI;
}
