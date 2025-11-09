import type { AuthAPI, LoginInput, LoginOutput, MeOutput } from '../../contracts';

let token: string | null = null;

const me: MeOutput = {
  id: 'u_1',
  email: 'demo@demo.com',
  name: '데모',
  headline: 'AI 마케터',
};

export const auth: AuthAPI = {
  async login({ email }: LoginInput): Promise<LoginOutput> {
    token = `mock.${btoa(email)}`;
    return { token, user: { id: me.id, email: me.email, name: me.name } };
  },
  async logout() {
    token = null;
  },
  async me() {
    if (!token) {
      throw new Error('401 Unauthorized');
    }
    return me;
  },
};

