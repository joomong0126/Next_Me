import { http, HttpResponse, delay } from 'msw';

type SignupMethod = 'email' | 'google';

type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status?: string;
  goals?: string[];
  headline?: string;
  method: SignupMethod;
};

type StoredUser = User & { password?: string };

const users: Record<string, StoredUser> = {
  'demo@demo.com': {
    id: 'u_demo',
    email: 'demo@demo.com',
    name: '데모',
    password: '1234',
    headline: 'AI 마케터',
    method: 'email',
    phone: '010-0000-0000',
    status: '직장인',
    goals: ['마케터'],
  },
};

function parseToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || 'e30=')) as { sub: string; email: string };
    return payload;
  } catch {
    return null;
  }
}

function issueMockToken(user: StoredUser) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email }));
  return `${header}.${payload}.mock`;
}

export const handlers = [
  // 회원가입: 입력 정보를 저장하고 즉시 로그인 토큰 발급
  http.post('/auth/signup', async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as {
      email: string;
      password?: string;
      name: string;
      phone: string;
      status: string;
      goals: string[];
      method: SignupMethod;
    };

    const existing = users[body.email];
    if (existing) {
      return HttpResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    const id = `u_${crypto.randomUUID()}`;
    const user: StoredUser = {
      id,
      email: body.email,
      name: body.name,
      phone: body.phone,
      status: body.status,
      goals: body.goals,
      headline: body.goals?.[0] ? `${body.goals[0]} 전문가` : undefined,
      method: body.method,
      password: body.method === 'email' ? body.password : undefined,
    };

    users[body.email] = user;

    const token = issueMockToken(user);
    return HttpResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        status: user.status,
        goals: user.goals,
        method: user.method,
      },
    });
  }),

  // 로그인: 이메일/비밀번호 확인 후 모의 JWT 발급
  http.post('/auth/login', async ({ request }) => {
    await delay(400);
    const { email, password } = (await request.json()) as { email: string; password: string };
    const u = users[email];
    if (!u || u.password !== password) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = issueMockToken(u);
    return HttpResponse.json({
      token,
      user: { id: u.id, email: u.email, name: u.name, phone: u.phone, status: u.status, goals: u.goals },
    });
  }),

  // Google 로그인 (mock): 이메일만 받아 토큰 발급
  http.post('/auth/google', async ({ request }) => {
    await delay(300);
    const { email, name } = (await request.json()) as { email: string; name: string };

    const existing = users[email];
    if (!existing) {
      const id = `u_${crypto.randomUUID()}`;
      users[email] = {
        id,
        email,
        name,
        method: 'google',
      };
    } else if (existing.method !== 'google') {
      return HttpResponse.json({ message: '다른 가입 방식이 존재합니다.' }, { status: 409 });
    }

    const user = users[email];
    const token = issueMockToken(user);
    return HttpResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        status: user.status,
        goals: user.goals,
        method: user.method,
      },
    });
  }),

  // 내 프로필: 토큰 검증 후 사용자별 데이터 반환
  http.get('/profiles/me', async ({ request }) => {
    await delay(200);
    const t = parseToken(request);
    if (!t) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const u = Object.values(users).find((x) => x.id === t.sub);
    if (!u) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      id: u.id,
      email: u.email,
      name: u.name,
      headline: u.headline,
      phone: u.phone,
      status: u.status,
      goals: u.goals,
      method: u.method,
    });
  }),

  // 예시: 사용자별 자산 업로드(메타만) — 사용자 ID로 구분 저장
  http.post('/assets', async ({ request }) => {
    await delay(300);
    const t = parseToken(request);
    if (!t) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = (await request.json()) as { url: string; title: string };
    const item = { id: crypto.randomUUID(), userId: t.sub, ...body };
    return HttpResponse.json(item, { status: 201 });
  }),
];
