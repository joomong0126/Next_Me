import { supabaseClient } from '@/shared/api/supabaseClient';

export type CareerAssistantPurpose = '포트폴리오' | '자기소개서' | '역량 분석' | '최종 개인' | '목표 직무 제안';

export interface CareerAssistantStartRequest {
  project_ids: (number | string)[];
  purpose: CareerAssistantPurpose;
  state: 'start';
}

export interface CareerAssistantMessageRequest {
  answer: string;
}

export interface CareerAssistantResponse {
  message: string;
  url?: string; // 다운로드 URL (파일 생성 완료 시)
  filename?: string; // 파일명
}

// Career Generator용 Supabase Function 이름을 환경 변수에서 읽어옵니다.
const resolveCareerAssistantFunctionName = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_CAREER_ASSISTANT_FUNCTION ??
    (import.meta as any)?.env?.VITE_SUPABASE_CAREER_ASSISTANT_FUNCTION;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  // 기본값: ai-projects-assistant
  return 'ai-projects-assistant';
};

const resolveSupabaseUrl = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_URL ?? (import.meta as any)?.env?.VITE_SUPABASE_URL;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'https://sqxojkaavbfmwhcdlwqt.supabase.co';
};

/**
 * Career Generator용 ai-projects-assistant API를 호출합니다.
 * START 단계: 프로젝트 선택 후 대화 시작
 */
export async function invokeCareerAssistantStart(
  params: CareerAssistantStartRequest,
): Promise<CareerAssistantResponse> {
  const functionName = resolveCareerAssistantFunctionName();
  const supabaseUrl = resolveSupabaseUrl();

  // 인증 토큰 가져오기
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.access_token) {
    throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
  }

  // 개발 환경에서는 Vite 프록시를 사용하여 CORS 문제 우회
  const isDevelopment = import.meta.env.DEV;
  let endpointUrl: string;

  if (isDevelopment) {
    // Vite 프록시 사용: /api/supabase-functions/{functionName}
    endpointUrl = `/api/supabase-functions/${functionName}`;
    console.log('[career-assistant] 개발 환경: Vite 프록시 사용:', endpointUrl);
  } else {
    // 프로덕션 환경: 직접 Supabase URL 사용
    endpointUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    console.log('[career-assistant] 프로덕션 환경: Supabase URL 직접 사용:', endpointUrl);
  }

  console.log('[career-assistant] START 호출:', {
    functionName,
    endpointUrl,
    project_ids: params.project_ids,
    purpose: params.purpose,
  });

  try {
    const requestBody = {
      project_ids: params.project_ids,
      purpose: params.purpose,
      state: params.state,
    };

    console.log('[career-assistant] 요청 본문:', requestBody);

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[career-assistant] HTTP 에러:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('[career-assistant] START 응답:', data);

    if (!data) {
      throw new Error('API 응답이 비어있습니다.');
    }

    return {
      message: data.message || data.content || '',
      url: data.url,
      filename: data.filename,
    };
  } catch (error) {
    console.error('[career-assistant] START 예외 발생:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('포트폴리오/자기소개서 생성 시작 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * Career Generator용 ai-projects-assistant API를 호출합니다.
 * 대화 진행 단계: 사용자 답변 전송
 */
export async function invokeCareerAssistantMessage(
  params: CareerAssistantMessageRequest,
): Promise<CareerAssistantResponse> {
  const functionName = resolveCareerAssistantFunctionName();
  const supabaseUrl = resolveSupabaseUrl();

  // 인증 토큰 가져오기
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.access_token) {
    throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
  }

  // 개발 환경에서는 Vite 프록시를 사용하여 CORS 문제 우회
  const isDevelopment = import.meta.env.DEV;
  let endpointUrl: string;

  if (isDevelopment) {
    // Vite 프록시 사용: /api/supabase-functions/{functionName}
    endpointUrl = `/api/supabase-functions/${functionName}`;
    console.log('[career-assistant] 개발 환경: Vite 프록시 사용:', endpointUrl);
  } else {
    // 프로덕션 환경: 직접 Supabase URL 사용
    endpointUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    console.log('[career-assistant] 프로덕션 환경: Supabase URL 직접 사용:', endpointUrl);
  }

  console.log('[career-assistant] MESSAGE 호출:', {
    functionName,
    endpointUrl,
    answer: params.answer.substring(0, 50) + '...',
  });

  try {
    const requestBody = {
      answer: params.answer,
    };

    console.log('[career-assistant] 요청 본문:', { answer: params.answer.substring(0, 50) + '...' });

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[career-assistant] HTTP 에러:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('[career-assistant] MESSAGE 응답:', data);

    if (!data) {
      throw new Error('API 응답이 비어있습니다.');
    }

    return {
      message: data.message || data.content || '',
      url: data.url,
      filename: data.filename,
    };
  } catch (error) {
    console.error('[career-assistant] MESSAGE 예외 발생:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('메시지 전송 중 알 수 없는 오류가 발생했습니다.');
  }
}


