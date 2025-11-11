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

type AssistantUploadKind = 'file' | 'link' | 'text';

type AssistantUploadRequest =
  | { kind: 'file'; fileName: string; mimeType: string; size: number }
  | { kind: 'link'; url: string }
  | { kind: 'text'; title: string; content: string };

interface AssistantUploadRecord {
  uploadId: string;
  kind: AssistantUploadKind;
  name: string;
  mimeType?: string;
  sourceUrl?: string;
  size?: number;
  createdAt: string;
  contentPreview?: string;
  rawContent?: string;
}

interface AssistantAnalysisRecord {
  analysisId: string;
  uploadId: string;
  project: {
    title: string;
    summary: string;
    tags: string[];
    category: string;
  };
  metadata: {
    format: string;
    type: 'file' | 'link' | 'project';
    sourceUrl?: string;
    confidence: number;
    recommendedNextActions: string[];
  };
}

const assistantUploadsStore = new Map<string, AssistantUploadRecord>();
const assistantAnalysisStore = new Map<string, AssistantAnalysisRecord>();

const assistantRemoveFileExtension = (name: string) => name.replace(/\.[^/.]+$/, '');

const assistantResolveFormat = (upload: AssistantUploadRecord) => {
  if (upload.kind === 'link') return '링크';
  if (upload.kind === 'text') return '텍스트';
  if (upload.mimeType?.startsWith('image/')) return '이미지';
  if (upload.mimeType === 'application/pdf') return 'PDF';
  return '문서';
};

const assistantResolveCategory = (kind: AssistantUploadKind, userRole: string) => {
  const lowerRole = userRole.toLowerCase();
  const isMarketing = ['marketing', '마케팅'].some((keyword) => lowerRole.includes(keyword));
  const isDeveloper = ['developer', '개발', '프론트엔드', '백엔드'].some((keyword) => lowerRole.includes(keyword));

  if (isMarketing) {
    switch (kind) {
      case 'file':
        return '브랜드 마케팅';
      case 'link':
        return 'SNS 마케팅';
      case 'text':
        return '콘텐츠 마케팅';
      default:
        return '브랜드 마케팅';
    }
  }

  if (isDeveloper) {
    switch (kind) {
      case 'file':
        return '프론트엔드';
      case 'link':
        return '데이터 분석';
      case 'text':
        return '백엔드';
      default:
        return '프론트엔드';
    }
  }

  switch (kind) {
    case 'file':
      return '협업';
    case 'link':
      return '기획';
    case 'text':
      return '프레젠테이션';
    default:
      return '기획';
  }
};

const assistantGenerateTags = (upload: AssistantUploadRecord) => {
  const baseTags = ['AI 분석', '자동 생성'];

  if (upload.kind === 'file') {
    return [assistantResolveFormat(upload), '파일 업로드', ...baseTags];
  }

  if (upload.kind === 'link' && upload.sourceUrl) {
    return [upload.sourceUrl, '링크', ...baseTags];
  }

  if (upload.kind === 'text') {
    return [upload.name || '텍스트 입력', '요약', ...baseTags];
  }

  return baseTags;
};

const assistantGenerateSummary = (upload: AssistantUploadRecord) => {
  if (upload.kind === 'file') {
    return `"${assistantRemoveFileExtension(upload.name)}" 파일을 분석하여 프로젝트 개요와 주요 인사이트를 정리했습니다.`;
  }

  if (upload.kind === 'link' && upload.sourceUrl) {
    return `${upload.sourceUrl}의 핵심 콘텐츠를 분석해 프로젝트 아이디어와 적용 포인트를 도출했습니다.`;
  }

  if (upload.kind === 'text' && upload.rawContent) {
    const trimmed = upload.rawContent.trim();
    const preview = trimmed.slice(0, 120).replace(/\s+/g, ' ');
    const suffix = trimmed.length > 120 ? '...' : '';
    return `제공하신 텍스트를 기반으로 프로젝트 요약과 개선 아이디어를 구성했습니다: ${preview}${suffix}`;
  }

  return '업로드한 자료를 바탕으로 프로젝트 정보를 구성했습니다.';
};

const assistantGenerateRecommendedActions = (category: string) => [
  `${category} 관점에서 핵심 성과 및 수치를 추가해보세요.`,
  '필요하다면 프로젝트 역할과 사용 도구 정보를 보완해주세요.',
];

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

  // AI Assistant chat 응답 목업
  http.post('/chat', async ({ request }) => {
    await delay(600);
    const { input, projectId, userRole, history } = (await request.json()) as {
      input: string;
      projectId?: number;
      userRole?: string;
      history?: Array<{ role: string; content: string }>;
    };

    const lastQuestion =
      (history ?? []).slice().reverse().find((entry) => entry.role === 'user')?.content ?? input ?? '';

    const roleLabel = userRole ? `${userRole} 관점에서 ` : '';
    const context = projectId ? `프로젝트 #${projectId}을 기준으로 ` : '';

    const answer = [
      `안녕하세요! ${roleLabel}${context}요청하신 내용을 정리해봤어요.`,
      '',
      `• 핵심 질문: "${lastQuestion || '현재 질문'}"`,
      '• 주요 포인트를 단계별로 분석하고, 실행 가능한 다음 액션을 함께 제안드릴게요.',
      '',
      '1) 현재 상황 요약: 입력해 주신 내용을 기반으로 맥락을 파악했습니다.',
      '2) 분석 인사이트: 목표, 성과, 개선 아이디어 관점에서 살펴보면 도움이 됩니다.',
      '3) 추천 액션: 바로 실행 가능한 2~3가지 후속 조치를 제안드려요.',
      '',
      '더 구체적인 세부 정보나 다른 프로젝트에 대해서도 언제든지 말씀해 주세요!',
    ].join('\n');

    return HttpResponse.text(answer);
  }),

  // Assistant project upload → mock Supabase stage
  http.post('/assistant/uploads', async ({ request }) => {
    await delay(600);
    const payload = (await request.json()) as AssistantUploadRequest;

    const uploadId = `upload_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    let record: AssistantUploadRecord;

    if (payload.kind === 'file') {
      record = {
        uploadId,
        kind: 'file',
        name: payload.fileName,
        mimeType: payload.mimeType,
        size: payload.size,
        createdAt,
      };
    } else if (payload.kind === 'link') {
      const normalizedUrl = payload.url.startsWith('http') ? payload.url : `https://${payload.url}`;
      const url = new URL(normalizedUrl);
      record = {
        uploadId,
        kind: 'link',
        name: url.hostname,
        sourceUrl: normalizedUrl,
        createdAt,
      };
    } else {
      record = {
        uploadId,
        kind: 'text',
        name: payload.title,
        rawContent: payload.content,
        contentPreview: payload.content.slice(0, 200),
        createdAt,
      };
    }

    assistantUploadsStore.set(uploadId, record);

    return HttpResponse.json(record);
  }),

  // Assistant analysis via mock AI server
  http.post('/assistant/analyze', async ({ request }) => {
    await delay(1200);
    const { uploadId, userRole } = (await request.json()) as { uploadId: string; userRole: string };
    const upload = assistantUploadsStore.get(uploadId);

    if (!upload) {
      return HttpResponse.json({ message: 'Upload not found' }, { status: 404 });
    }

    const analysis: AssistantAnalysisRecord = {
      analysisId: `analysis_${crypto.randomUUID()}`,
      uploadId,
      project: {
        title:
          upload.kind === 'file'
            ? assistantRemoveFileExtension(upload.name)
            : upload.kind === 'link'
            ? upload.name
            : upload.name || 'AI 생성 프로젝트',
        summary: assistantGenerateSummary(upload),
        tags: assistantGenerateTags(upload),
        category: assistantResolveCategory(upload.kind, userRole ?? ''),
      },
      metadata: {
        format: assistantResolveFormat(upload),
        type: upload.kind === 'text' ? 'project' : upload.kind === 'link' ? 'link' : 'file',
        sourceUrl: upload.sourceUrl,
        confidence: 0.92,
        recommendedNextActions: assistantGenerateRecommendedActions(
          assistantResolveCategory(upload.kind, userRole ?? ''),
        ),
      },
    };

    assistantAnalysisStore.set(uploadId, analysis);

    return HttpResponse.json(analysis);
  }),

  // Assistant analysis fetch from mock Supabase
  http.get('/assistant/analysis/:uploadId', async ({ params }) => {
    await delay(500);
    const uploadId = params.uploadId as string;
    const analysis = assistantAnalysisStore.get(uploadId);

    if (!analysis) {
      return HttpResponse.json({ message: 'Analysis not found' }, { status: 404 });
    }

    return HttpResponse.json(analysis);
  }),
];
