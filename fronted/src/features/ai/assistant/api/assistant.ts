import { isMockSupabaseClient, supabaseClient } from '@/shared/api/supabaseClient';
import type { ProjectType } from '@/entities/project';
import type { AIGeneratedData } from '../types';

export type FileUploadRequestPayload = {
  kind: 'file';
  file: File;
  fileName: string;
  mimeType: string;
  size: number;
};

export type UploadRequestPayload =
  | FileUploadRequestPayload
  | { kind: 'link'; url: string }
  | { kind: 'text'; title: string; content: string };

export interface UploadResponsePayload {
  uploadId: string;
  kind: 'file' | 'link' | 'text';
  name: string;
  mimeType?: string;
  sourceUrl?: string;
  size?: number;
  createdAt: string;
  contentPreview?: string;
}

export interface AnalysisResponsePayload {
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
    type: ProjectType;
    sourceUrl?: string;
    confidence: number;
    recommendedNextActions: string[];
  };
}

// 파일을 저장할 Supabase Storage 버킷 이름을 환경 변수에서 읽어옵니다.
const resolveSupabaseProjectBucket = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_PROJECT_BUCKET ??
    (import.meta as any)?.env?.VITE_SUPABASE_PROJECT_BUCKET;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'assistant-projects';
};

// AI 분석을 담당하는 Supabase Function 이름을 환경 변수에서 읽어옵니다.
const resolveAssistantFunctionName = () => {
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ASSISTANT_FUNCTION ??
    (import.meta as any)?.env?.VITE_SUPABASE_ASSISTANT_FUNCTION;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'ai-projects-analyze';
};

// 저장 경로 충돌을 피하기 위해 난수 기반 식별자를 생성합니다.
const randomIdentifier = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

// 파일 이름에 포함된 안전하지 않은 문자를 밑줄로 치환합니다.
const sanitizeFileName = (name: string) => name.replace(/[^\w.-]/g, '_');

// 날짜/난수와 결합해 Supabase Storage용 업로드 경로를 만들어 줍니다.
const buildSupabaseUploadPath = (fileName: string) => {
  const stamp = new Date().toISOString().split('T')[0];
  const identifier = randomIdentifier();
  return `assistant/${stamp}/${identifier}-${sanitizeFileName(fileName)}`;
};

// Supabase Functions가 돌려준 AI 분석 결과를 화면에서 쓰기 좋은 형태로 변환합니다.
const mapAnalysisToGeneratedData = (analysis: AnalysisResponsePayload | any): AIGeneratedData => {
  // 안전하게 데이터 추출 (실제 API 응답 구조에 맞게)
  const project = analysis.project || analysis;
  const metadata = analysis.metadata || {};
  
  // 모든 필드를 포함하는 기본 객체 생성
  const result: AIGeneratedData = {
    title: project.title || '제목 없음',
    date: new Date().toLocaleDateString('ko-KR'),
    format: metadata.format || '문서',
    tags: Array.isArray(project.tags) ? project.tags : [],
    summary: project.summary || '',
    category: project.category || '기타',
    type: metadata.type || 'project',
    sourceUrl: metadata.sourceUrl || project.sourceUrl,
    // 추가 필드들 매핑
    period: project.period || metadata.period,
    startDate: project.startDate || project.start_date || metadata.startDate,
    endDate: project.endDate || project.end_date || metadata.endDate,
    role: project.role || project.roles?.[0] || metadata.role,
    achievements: project.achievements || metadata.achievements,
    tools: project.tools || metadata.tools,
    description: project.description || metadata.description,
    metadata: {
      confidence: metadata.confidence || 0,
      recommendedNextActions: Array.isArray(metadata.recommendedNextActions) 
        ? metadata.recommendedNextActions 
        : [],
      // 원본 metadata의 모든 필드 포함
      ...metadata,
    } as Record<string, unknown>,
    analysisId: analysis.analysisId || analysis.id,
    storageId: analysis.uploadId || analysis.storageId,
  };
  
  // API 응답의 모든 추가 필드를 포함 (위에서 명시적으로 매핑하지 않은 필드들)
  Object.keys(analysis).forEach((key) => {
    if (!['project', 'metadata', 'analysisId', 'uploadId', 'id'].includes(key) && !(key in result)) {
      result[key] = analysis[key];
    }
  });
  
  // project 객체의 모든 추가 필드도 포함
  if (project && typeof project === 'object') {
    Object.keys(project).forEach((key) => {
      if (!['title', 'tags', 'summary', 'category', 'sourceUrl', 'period', 'startDate', 'endDate', 'role', 'achievements', 'tools', 'description', 'start_date', 'end_date', 'roles'].includes(key)) {
        result[key] = project[key];
      }
    });
  }
  
  return result;
};

/**
 * 버킷이 존재하는지 확인합니다.
 */
async function checkBucketExists(bucket: string): Promise<boolean> {
  if (isMockSupabaseClient) {
    return true; // Mock 모드에서는 항상 존재한다고 가정
  }

  const storageClient = supabaseClient?.storage;
  if (!storageClient?.listBuckets) {
    return false;
  }

  try {
    const { data: buckets, error } = await storageClient.listBuckets();
    if (error) {
      console.warn('[uploadFile] 버킷 목록 조회 실패:', error);
      return false;
    }
    return buckets?.some((b: { name: string }) => b.name === bucket) ?? false;
  } catch {
    return false;
  }
}

/**
 * 파일을 Supabase Storage에 업로드합니다.
 */
export async function uploadFile(bucket: string, path: string, file: File, options?: {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}): Promise<{ path: string }> {
  const storageClient = supabaseClient?.storage;
  if (!storageClient?.from) {
    throw new Error('Supabase storage 클라이언트를 찾을 수 없습니다.');
  }

  // 버킷 존재 여부 확인
  const bucketExists = await checkBucketExists(bucket);
  if (!bucketExists) {
    const errorMessage = `Storage 버킷 '${bucket}'을(를) 찾을 수 없습니다. ` +
      `Supabase 대시보드에서 Storage > Buckets로 이동하여 '${bucket}' 버킷을 생성해주세요. ` +
      `또는 환경 변수 VITE_SUPABASE_PROJECT_BUCKET에 다른 버킷 이름을 설정할 수 있습니다.`;
    console.error('[uploadFile]', errorMessage);
    throw new Error(errorMessage);
  }

  const { data: uploadResult, error: uploadError } = await storageClient
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      cacheControl: options?.cacheControl ?? '3600',
      upsert: options?.upsert ?? false,
    });

  if (uploadError) {
    // 버킷 관련 오류인 경우 더 명확한 메시지 제공
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
      const errorMessage = `Storage 버킷 '${bucket}'을(를) 찾을 수 없습니다. ` +
        `Supabase 대시보드에서 Storage > Buckets로 이동하여 '${bucket}' 버킷을 생성해주세요. ` +
        `또는 환경 변수 VITE_SUPABASE_PROJECT_BUCKET에 다른 버킷 이름을 설정할 수 있습니다.`;
      throw new Error(errorMessage);
    }
    throw new Error(uploadError.message ?? '파일 업로드에 실패했습니다.');
  }

  if (!uploadResult?.path) {
    throw new Error('파일 업로드 결과를 확인할 수 없습니다.');
  }

  return { path: uploadResult.path };
}

/**
 * Supabase Function을 호출합니다.
 */
export async function invokeAssistantFunction(
  functionName: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const functionsClient = supabaseClient?.functions;
  if (!functionsClient?.invoke) {
    throw new Error('Supabase Functions 클라이언트를 찾을 수 없습니다.');
  }

  // 디버깅: 호출 정보 로그
  const supabaseUrl = (globalThis as any)?.process?.env?.VITE_SUPABASE_URL ?? (import.meta as any)?.env?.VITE_SUPABASE_URL;
  const endpointUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/${functionName}` : `functions/v1/${functionName}`;
  
  console.log('[AI Assistant] Function 호출 시작:', {
    functionName,
    endpoint: endpointUrl,
    requestBody: body,
    timestamp: new Date().toISOString(),
  });

  const { data, error } = await functionsClient.invoke(functionName, {
    body,
  });

  // 디버깅: 응답 정보 로그
  if (error) {
    console.error('[AI Assistant] Function 호출 실패:', {
      functionName,
      error: error.message,
      details: error,
    });
    throw new Error(error.message ?? 'Function 호출 중 오류가 발생했습니다.');
  }

  console.log('[AI Assistant] Function 호출 성공:', {
    functionName,
    responseData: data,
  });

  return data;
}

/**
 * Mock 서비스를 사용하여 파일을 처리합니다.
 */
export async function processWithMockService(
  payload: UploadRequestPayload,
  userRole: string,
): Promise<AIGeneratedData> {
  const uploadResponse = await fetch('/assistant/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!uploadResponse.ok) {
    throw new Error('MOCK_UPLOAD_FAILED');
  }

  const uploadData = (await uploadResponse.json()) as UploadResponsePayload;

  const analyzeResponse = await fetch('/assistant/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uploadId: uploadData.uploadId, userRole }),
  });

  if (!analyzeResponse.ok) {
    throw new Error('MOCK_ANALYZE_FAILED');
  }

  const storedAnalysisResponse = await fetch(`/assistant/analysis/${uploadData.uploadId}`);

  if (!storedAnalysisResponse.ok) {
    throw new Error('MOCK_FETCH_ANALYSIS_FAILED');
  }

  const storedAnalysis = (await storedAnalysisResponse.json()) as AnalysisResponsePayload;

  return mapAnalysisToGeneratedData(storedAnalysis);
}

/**
 * 실제 Supabase 서비스를 사용하여 파일을 처리합니다.
 * JWT 인증 없이 formData로 직접 전송합니다.
 */
export async function processWithRealService(
  payload: UploadRequestPayload,
  userRole: string,
): Promise<AIGeneratedData> {
  // VITE_USE_MOCK이 명시적으로 'true'가 아니면 실제 API 호출
  const viteUseMock = (globalThis as any)?.process?.env?.VITE_USE_MOCK ?? (import.meta as any)?.env?.VITE_USE_MOCK;
  const shouldUseMock = viteUseMock === 'true';
  
  if (shouldUseMock) {
    return processWithMockService(payload, userRole);
  }

  const functionName = resolveAssistantFunctionName();
  
  // 개발 환경에서는 Vite 프록시를 사용하여 CORS 문제 우회
  const isDevelopment = import.meta.env.DEV;
  let endpointUrl: string;
  
  if (isDevelopment) {
    // 개발 환경: Vite 프록시 사용
    endpointUrl = `/api/supabase-functions/${functionName}`;
    console.log('[AI Assistant] 개발 환경: Vite 프록시 사용');
  } else {
    // 프로덕션 환경: 직접 Supabase URL 사용
    let supabaseUrl = (globalThis as any)?.process?.env?.VITE_SUPABASE_URL ?? (import.meta as any)?.env?.VITE_SUPABASE_URL;
    
    // 환경 변수가 없으면 supabaseClient에서 추출 시도
    if (!supabaseUrl && !isMockSupabaseClient && supabaseClient) {
      // Supabase 클라이언트에서 URL 추출 시도
      const clientUrl = (supabaseClient as any)?.supabaseUrl ?? (supabaseClient as any)?.rest?.url;
      if (clientUrl) {
        // rest.url이 전체 URL이면 그대로 사용, 아니면 조합
        supabaseUrl = typeof clientUrl === 'string' && clientUrl.includes('http') 
          ? clientUrl 
          : undefined;
      }
    }
    
    // 여전히 없으면 기본값 사용 (사용자가 제공한 실제 Supabase URL)
    if (!supabaseUrl) {
      supabaseUrl = 'https://sqxojkaavbfmwhcdlwqt.supabase.co';
      console.warn('[AI Assistant] VITE_SUPABASE_URL이 설정되지 않아 기본 URL을 사용합니다:', supabaseUrl);
    }

    endpointUrl = `${supabaseUrl}/functions/v1/${functionName}`;
  }

  // 디버깅: 환경 변수 및 설정 확인
  console.log('[AI Assistant] 프로젝트 분석 시작:', {
    functionName,
    endpointUrl,
    userRole,
    payloadKind: payload.kind,
    isMockClient: isMockSupabaseClient,
  });

  // formData 생성
  const formData = new FormData();
  
  if (payload.kind === 'file') {
    // 파일인 경우 파일을 formData에 추가
    formData.append('file', payload.file);
    formData.append('kind', 'file');
    console.log('[AI Assistant] 파일 업로드:', {
      fileName: payload.fileName,
      fileSize: payload.size,
      mimeType: payload.mimeType,
    });
  } else if (payload.kind === 'link') {
    // 링크인 경우 URL을 formData에 추가
    formData.append('url', payload.url);
    formData.append('kind', 'link');
    console.log('[AI Assistant] 링크 분석:', { url: payload.url });
  } else {
    // 텍스트인 경우 input 필드에 내용 추가
    formData.append('input', payload.content);
    formData.append('title', payload.title);
    formData.append('kind', 'text');
    console.log('[AI Assistant] 텍스트 분석:', {
      title: payload.title,
      contentLength: payload.content.length,
    });
  }

  // formData 내용 확인 (디버깅용)
  console.log('[AI Assistant] API 호출 준비:', {
    endpointUrl,
    method: 'POST',
    formDataKeys: Array.from(formData.keys()),
  });

  // JWT 없이 직접 fetch로 호출
  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      body: formData,
      // JWT 인증 헤더 제거 - formData만 전송
      // CORS 문제 해결을 위해 credentials 옵션 추가하지 않음 (기본값 'same-origin')
    });
  } catch (fetchError) {
    console.error('[AI Assistant] Fetch 실패:', {
      error: fetchError,
      endpointUrl,
      errorName: (fetchError as Error)?.name,
      errorMessage: (fetchError as Error)?.message,
      errorStack: (fetchError as Error)?.stack,
    });
    
    // CORS 오류인지 확인
    if ((fetchError as Error)?.message?.includes('CORS') || 
        (fetchError as Error)?.name === 'TypeError' && 
        (fetchError as Error)?.message?.includes('fetch')) {
      throw new Error(
        `CORS 오류가 발생했습니다. Supabase Function이 CORS를 허용하도록 설정되어 있는지 확인해주세요.\n` +
        `엔드포인트: ${endpointUrl}\n` +
        `원본 오류: ${(fetchError as Error)?.message}`
      );
    }
    
    throw new Error(
      `네트워크 요청 실패: ${(fetchError as Error)?.message || '알 수 없는 오류'}\n` +
      `엔드포인트: ${endpointUrl}`
    );
  }

  console.log('[AI Assistant] API 응답 받음:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
  });

  let data;
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AI Assistant] API 호출 실패:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`AI 분석 API 호출 실패: ${response.status} ${response.statusText}\n${errorText}`);
  }

  try {
    const responseText = await response.text();
    console.log('[AI Assistant] 응답 본문 (raw):', responseText.substring(0, 500));
    
    data = JSON.parse(responseText);
    console.log('[AI Assistant] 응답 데이터 (parsed):', data);
  } catch (parseError) {
    console.error('[AI Assistant] JSON 파싱 실패:', parseError);
    throw new Error('응답 데이터를 파싱할 수 없습니다.');
  }

  if (!data) {
    throw new Error('AI 분석 응답이 비어 있습니다.');
  }

  // 응답 데이터 구조 확인 및 변환
  // API 응답이 다양한 형태일 수 있으므로 유연하게 처리
  let analysisPayload: any = data;
  
  // 중첩된 analysis 객체가 있는 경우
  if (data.analysis) {
    analysisPayload = data.analysis;
  }
  
  // project 객체가 있는지 확인
  const hasProject = !!(analysisPayload?.project || analysisPayload?.title);
  
  if (!hasProject) {
    console.error('[AI Assistant] 응답 데이터 구조가 예상과 다릅니다:', {
      fullData: data,
      analysisPayload,
      keys: Object.keys(analysisPayload || {}),
    });
    throw new Error('AI 분석 결과를 확인할 수 없습니다. 응답 데이터 구조를 확인해주세요.');
  }

  console.log('[AI Assistant] 분석 성공:', {
    projectTitle: analysisPayload.project?.title || analysisPayload.title,
    category: analysisPayload.project?.category || analysisPayload.category,
    fullPayload: analysisPayload,
  });

  const mappedData = mapAnalysisToGeneratedData(analysisPayload);
  
  // 매핑된 데이터의 모든 필드 로깅
  console.log('[AI Assistant] 매핑된 데이터:', {
    keys: Object.keys(mappedData),
    data: mappedData,
  });

  return mappedData;
}

