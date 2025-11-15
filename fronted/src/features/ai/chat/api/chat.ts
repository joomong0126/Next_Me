import { isMockSupabaseClient, supabaseClient } from '@/shared/api/supabaseClient';
import type { AssistantMessage } from '../types';

type AssistantMessageRow = {
  id: string | number;
  project_id: number;
  role: 'ai' | 'user';
  content: string;
  created_at: string;
  is_project_organizing?: boolean | null;
};

const mapRowToMessage = (row: AssistantMessageRow): AssistantMessage => ({
  id: String(row.id),
  projectId: row.project_id,
  role: row.role,
  content: row.content,
  timestamp: new Date(row.created_at),
  isProjectOrganizing: (row as any).is_project_organizing ?? undefined,
});

// 공통 함수: 환경 변수 또는 supabaseClient mock 여부로 현재가 mock 모드인지 판단합니다.
export const shouldUseAssistantMock = () => {
  const explicit =
    (globalThis as any)?.process?.env?.VITE_ASSISTANT_USE_MOCK ?? (import.meta as any)?.env?.VITE_ASSISTANT_USE_MOCK;
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim().toLowerCase() === 'true';
  }
  const viteUseMock = (import.meta as any)?.env?.VITE_USE_MOCK;
  if (typeof viteUseMock === 'string' && viteUseMock.trim()) {
    return viteUseMock.trim().toLowerCase() === 'true';
  }
  return isMockSupabaseClient;
};

const resolveOrganizeStartFunctionName = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_START ??
    (import.meta as any)?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_START;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'assistant-organize-start';
};

const resolveOrganizeSummarizeFunctionName = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_SUMMARIZE ??
    (import.meta as any)?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_SUMMARIZE;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'assistant-organize-summarize';
};

const resolveOrganizeRefineFunctionName = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_REFINE ??
    (import.meta as any)?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_REFINE;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'ai-projects-refine';
};

export type OrganizeStartResponse = {
  messages?: (AssistantMessageRow & { is_project_organizing?: boolean })[];
  message?: (AssistantMessageRow & { is_project_organizing?: boolean }) | null;
};

export type OrganizeSummarizeResponse = {
  project?: {
    role?: string;
    achievements?: string;
    tools?: string;
    description?: string;
    summary?: string;
  };
  message?: AssistantMessageRow | null;
};

export type OrganizeRefineResponse = {
  message?: string;
  content?: string; // message의 별칭
  project?: {
    id?: string; // uuid
    title?: string;
    category?: string;
    tags?: string[];
    summary?: string;
    start_date?: string;
    end_date?: string;
    roles?: string[];
    achievements?: string[];
    tools?: string[];
    description?: string;
    files?: Array<{ name: string; url: string }>;
    links?: string[];
    // 기존 필드들도 유지
    role?: string;
  } | null;
  // API가 직접 문자열을 반환할 수도 있음
  [key: string]: any;
};

/**
 * 프로젝트별로 저장된 전체 메시지 로그를 읽어옵니다.
 */
export async function fetchMessages(projectId: number): Promise<AssistantMessage[]> {
  try {
    const { data, error } = (await supabaseClient
      .from('assistant_messages')
      .select('id, project_id, role, content, created_at, is_project_organizing')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })) as {
      data: AssistantMessageRow[] | null;
      error: Error | null;
    };

    // 테이블이 없거나 접근할 수 없는 경우 빈 배열 반환 (Mock 모드로 fallback)
    if (error) {
      const errorCode = (error as any)?.code;
      if (errorCode === 'PGRST205' || errorCode === '42P01') {
        console.warn('[fetchMessages] assistant_messages 테이블이 없습니다. 로컬 모드로 진행합니다.');
        return [];
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapRowToMessage);
  } catch (error) {
    console.warn('[fetchMessages] 메시지 조회 실패, 빈 배열 반환:', error);
    return [];
  }
}

/**
 * 메시지를 전송합니다.
 */
export async function sendMessage(params: {
  projectId: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isProjectOrganizing?: boolean;
}): Promise<AssistantMessage> {
  try {
    const { data, error } = (await supabaseClient
      .from('assistant_messages')
      .insert({
        project_id: params.projectId,
        role: params.role,
        content: params.content,
        created_at: params.timestamp.toISOString(),
        is_project_organizing: params.isProjectOrganizing ?? null,
      })
      .select('id, project_id, role, content, created_at, is_project_organizing')
      .single()) as { data: AssistantMessageRow | null; error: Error | null };

    // 테이블이 없거나 접근할 수 없는 경우 메모리 메시지 반환
    if (error) {
      const errorCode = (error as any)?.code;
      if (errorCode === 'PGRST205' || errorCode === '42P01') {
        console.warn('[sendMessage] assistant_messages 테이블이 없습니다. 메모리 메시지로 반환합니다.');
        // 메모리 메시지 반환 (ID는 타임스탬프 기반)
        return {
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: params.projectId,
          role: params.role,
          content: params.content,
          timestamp: params.timestamp,
          isProjectOrganizing: params.isProjectOrganizing,
        };
      }
      throw error;
    }

    if (!data) {
      throw new Error('Failed to insert message');
    }

    return mapRowToMessage(data);
  } catch (error) {
    // 예상치 못한 에러도 메모리 메시지로 fallback
    console.warn('[sendMessage] 메시지 저장 실패, 메모리 메시지로 반환:', error);
    return {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: params.projectId,
      role: params.role,
      content: params.content,
      timestamp: params.timestamp,
      isProjectOrganizing: params.isProjectOrganizing,
    };
  }
}

/**
 * 여러 메시지를 한 번에 전송합니다.
 */
export async function sendMessages(params: Array<{
  projectId: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isProjectOrganizing?: boolean;
}>): Promise<AssistantMessage[]> {
  try {
    const { data, error } = (await supabaseClient
      .from('assistant_messages')
      .insert(
        params.map((p) => ({
          project_id: p.projectId,
          role: p.role,
          content: p.content,
          created_at: p.timestamp.toISOString(),
          is_project_organizing: p.isProjectOrganizing ?? null,
        }))
      )
      .select('id, project_id, role, content, created_at, is_project_organizing')) as {
      data: AssistantMessageRow[] | null;
      error: Error | null;
    };

    // 테이블이 없거나 접근할 수 없는 경우 메모리 메시지 반환
    if (error) {
      const errorCode = (error as any)?.code;
      if (errorCode === 'PGRST205' || errorCode === '42P01') {
        console.warn('[sendMessages] assistant_messages 테이블이 없습니다. 메모리 메시지로 반환합니다.');
        return params.map((p) => ({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: p.projectId,
          role: p.role,
          content: p.content,
          timestamp: p.timestamp,
          isProjectOrganizing: p.isProjectOrganizing,
        }));
      }
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to insert messages');
    }

    return data.map(mapRowToMessage);
  } catch (error) {
    // 예상치 못한 에러도 메모리 메시지로 fallback
    console.warn('[sendMessages] 메시지 저장 실패, 메모리 메시지로 반환:', error);
    return params.map((p) => ({
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: p.projectId,
      role: p.role,
      content: p.content,
      timestamp: p.timestamp,
      isProjectOrganizing: p.isProjectOrganizing,
    }));
  }
}

/**
 * 프로젝트의 모든 메시지를 삭제합니다.
 */
export async function deleteMessages(projectId: number): Promise<void> {
  try {
    const { error } = await supabaseClient.from('assistant_messages').delete().eq('project_id', projectId);

    // 테이블이 없거나 접근할 수 없는 경우 무시 (이미 삭제된 것으로 간주)
    if (error) {
      const errorCode = (error as any)?.code;
      if (errorCode === 'PGRST205' || errorCode === '42P01') {
        console.warn('[deleteMessages] assistant_messages 테이블이 없습니다. 삭제 작업을 건너뜁니다.');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.warn('[deleteMessages] 메시지 삭제 실패 (무시):', error);
    // 테이블이 없으면 이미 삭제된 것으로 간주
  }
}

/**
 * Organize 시작 함수를 호출합니다.
 */
export async function invokeOrganizeStartFunction(params: {
  projectId: number;
  projectTitle: string;
}): Promise<OrganizeStartResponse> {
  if (!supabaseClient?.functions?.invoke) {
    throw new Error('Supabase Functions API를 사용할 수 없습니다.');
  }

  const functionName = resolveOrganizeStartFunctionName();
  
  console.log('[organize-start] 호출:', {
    functionName,
    projectId: params.projectId,
    projectTitle: params.projectTitle,
  });

  try {
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body: {
        projectId: params.projectId,
        projectTitle: params.projectTitle,
      },
    });

    if (error) {
      console.error('[organize-start] Supabase 에러:', error);
      throw new Error(error.message || `Edge Function 호출 실패: ${functionName}`);
    }

    console.log('[organize-start] 응답:', data);
    
    if (!data) {
      throw new Error('API 응답이 비어있습니다.');
    }

    return data as OrganizeStartResponse;
  } catch (error) {
    console.error('[organize-start] 예외 발생:', error);
    if (error instanceof Error) {
      // FunctionsFetchError를 더 읽기 쉽게 변환
      if (error.message.includes('Failed to send a request to the Edge Function')) {
        throw new Error(`Edge Function "${functionName}"에 연결할 수 없습니다. Supabase URL과 함수 이름을 확인해주세요.`);
      }
      throw error;
    }
    throw new Error('프로젝트 정리 시작 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * Organize 요약 함수를 호출합니다.
 */
export async function invokeOrganizeSummarizeFunction(params: {
  projectId: number;
  projectTitle: string;
  history: Array<{ role: 'user' | 'ai'; content: string }>;
}): Promise<OrganizeSummarizeResponse> {
  const functionName = resolveOrganizeSummarizeFunctionName();
  
  // 개발 환경에서는 Vite 프록시를 사용하여 CORS 문제 우회
  const isDevelopment = import.meta.env.DEV;
  let endpointUrl: string;
  
  if (isDevelopment) {
    // Vite 프록시 사용
    endpointUrl = `/api/supabase-functions/${functionName}`;
    console.log('[assistant-organize-summarize] 개발 환경: Vite 프록시 사용:', endpointUrl);
  } else {
    // 프로덕션 환경: 직접 Supabase URL 사용
    let supabaseUrl = (globalThis as any)?.process?.env?.VITE_SUPABASE_URL ?? 
                      (import.meta as any)?.env?.VITE_SUPABASE_URL;
    
    // 환경 변수가 없으면 supabaseClient에서 추출 시도
    if (!supabaseUrl && !isMockSupabaseClient && supabaseClient) {
      const clientUrl = (supabaseClient as any)?.supabaseUrl ?? (supabaseClient as any)?.rest?.url;
      if (clientUrl) {
        supabaseUrl = typeof clientUrl === 'string' && clientUrl.includes('http') 
          ? clientUrl 
          : undefined;
      }
    }
    
    if (!supabaseUrl) {
      supabaseUrl = 'https://sqxojkaavbfmwhcdlwqt.supabase.co';
      console.warn('[assistant-organize-summarize] VITE_SUPABASE_URL이 설정되지 않아 기본 URL을 사용합니다:', supabaseUrl);
    }

    endpointUrl = `${supabaseUrl}/functions/v1/${functionName}`;
  }

  const body = {
    projectId: params.projectId,
    projectTitle: params.projectTitle,
    history: params.history,
  };

  console.log('[assistant-organize-summarize] 호출:', {
    functionName,
    endpointUrl,
    body: { ...body, history: `[${body.history.length} messages]` },
  });

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[assistant-organize-summarize] HTTP 에러:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('[assistant-organize-summarize] 응답:', data);
    
    if (!data) {
      throw new Error('API 응답이 비어있습니다.');
    }

    return data as OrganizeSummarizeResponse;
  } catch (error) {
    console.error('[assistant-organize-summarize] 예외 발생:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('프로젝트 요약 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 프로젝트 정리 대화 중 사용자 답변을 처리하는 함수를 호출합니다.
 * API 명세에 따라 START/ING/DONE 단계를 지원합니다.
 * 
 * @param params - 요청 파라미터
 * @param params.projectId - 프로젝트 ID (START, DONE 단계에서 필요)
 * @param params.answer - 사용자 답변 (ING, DONE 단계에서 필요)
 * @param params.state - 대화 상태 ("start" | undefined)
 */
export async function invokeOrganizeRefineFunction(params: {
  projectId?: number;
  answer?: string;
  state?: 'start';
}): Promise<OrganizeRefineResponse> {
  // 인증 헤더 없이 진행 (임시)
  const functionName = resolveOrganizeRefineFunctionName();
  
  // 개발 환경에서는 Vite 프록시를 사용하여 CORS 문제 우회
  const isDevelopment = import.meta.env.DEV;
  let endpointUrl: string;
  
  if (isDevelopment) {
    // 개발 환경: 실제 Supabase URL로 직접 호출 (CORS 우회를 위해 프록시 대신 직접 호출)
    // 또는 VITE_USE_DIRECT_SUPABASE=true로 설정하면 프록시 대신 직접 호출
    const useDirectSupabase = (import.meta as any)?.env?.VITE_USE_DIRECT_SUPABASE === 'true';
    
    if (useDirectSupabase) {
      // 직접 Supabase URL 사용 (CORS 허용 필요)
      let supabaseUrl = (globalThis as any)?.process?.env?.VITE_SUPABASE_URL ?? 
                        (import.meta as any)?.env?.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        supabaseUrl = 'https://sqxojkaavbfmwhcdlwqt.supabase.co';
      }
      endpointUrl = `${supabaseUrl}/functions/v1/${functionName}`;
      console.log('[ai-projects-refine] 개발 환경: Supabase URL 직접 사용 (CORS 허용 필요):', endpointUrl);
    } else {
      // Vite 프록시 사용
      endpointUrl = `/api/supabase-functions/${functionName}`;
      console.log('[ai-projects-refine] 개발 환경: Vite 프록시 사용:', endpointUrl);
    }
  } else {
    // 프로덕션 환경: 직접 Supabase URL 사용
    let supabaseUrl = (globalThis as any)?.process?.env?.VITE_SUPABASE_URL ?? 
                      (import.meta as any)?.env?.VITE_SUPABASE_URL;
    
    // 환경 변수가 없으면 supabaseClient에서 추출 시도
    if (!supabaseUrl && !isMockSupabaseClient && supabaseClient) {
      // Supabase 클라이언트에서 URL 추출 시도
      const clientUrl = (supabaseClient as any)?.supabaseUrl ?? (supabaseClient as any)?.rest?.url;
      if (clientUrl) {
        // rest.url이 전체 URL이면 그대로 사용
        supabaseUrl = typeof clientUrl === 'string' && clientUrl.includes('http') 
          ? clientUrl 
          : undefined;
      }
    }
    
    // 여전히 없으면 기본값 사용 (사용자가 제공한 실제 Supabase URL)
    if (!supabaseUrl) {
      supabaseUrl = 'https://sqxojkaavbfmwhcdlwqt.supabase.co';
      console.warn('[ai-projects-refine] VITE_SUPABASE_URL이 설정되지 않아 기본 URL을 사용합니다:', supabaseUrl);
    }

    endpointUrl = `${supabaseUrl}/functions/v1/${functionName}`;
  }

  // 요청 본문 구성
  const body: Record<string, any> = {};
  if (params.state === 'start' && params.projectId !== undefined) {
    // START 단계
    body.project_id = params.projectId;
    body.state = 'start';
  } else if (params.answer !== undefined) {
    // ING 또는 DONE 단계
    body.answer = params.answer;
    if (params.projectId !== undefined) {
      // DONE 단계
      body.project_id = params.projectId;
    }
  } else {
    throw new Error('잘못된 요청 파라미터입니다.');
  }

  console.log('[ai-projects-refine] 호출:', {
    functionName,
    endpointUrl,
    body: { ...body, answer: body.answer ? body.answer.substring(0, 50) + '...' : undefined },
  });

  try {
    console.log('[ai-projects-refine] 요청 전송:', {
      endpointUrl,
      method: 'POST',
      bodyKeys: Object.keys(body),
    });

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[ai-projects-refine] 응답 받음:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-projects-refine] HTTP 에러:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('[ai-projects-refine] 응답:', data);
    
    if (!data) {
      throw new Error('API 응답이 비어있습니다.');
    }

    return data as OrganizeRefineResponse;
  } catch (error) {
    console.error('[ai-projects-refine] 예외 발생:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('프로젝트 정리 중 알 수 없는 오류가 발생했습니다.');
  }
}

