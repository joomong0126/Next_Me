import { Dispatch, SetStateAction } from 'react';

import type { Project } from '@/entities/project';

import { ChatPanel, useAssistantChat } from '@/features/ai/chat';

const DEFAULT_WELCOME_MESSAGE =
  'AI 커리어 제너레이터입니다. 프로젝트를 분석하고 원하는 결과물을 만들어보세요.';

// Career Generator용 채팅 엔드포인트를 환경 변수에서 가져오거나 기본값 사용
const resolveCareerChatEndpoint = () => {
  const envEndpoint =
    (globalThis as any)?.process?.env?.VITE_CAREER_CHAT_ENDPOINT ??
    (import.meta as any)?.env?.VITE_CAREER_CHAT_ENDPOINT;

  if (envEndpoint) {
    return envEndpoint;
  }

  const baseUrl =
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_AI_BASE_URL ??
    (import.meta as any)?.env?.VITE_AI_BASE_URL;

  if (typeof baseUrl === 'string' && baseUrl.trim()) {
    return `${baseUrl.replace(/\/$/, '')}/career/chat`;
  }

  return '/career/chat';
};

export interface AICareerGeneratorProps {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  userRole: string;
  welcomeMessage?: string;
  chatEndpoint?: string;
}

export function AICareerGenerator({
  projects,
  setProjects,
  userRole,
  welcomeMessage = DEFAULT_WELCOME_MESSAGE,
  chatEndpoint,
}: AICareerGeneratorProps) {
  const endpoint = chatEndpoint ?? resolveCareerChatEndpoint();

  // Career Generator는 프로젝트 선택 기능 없이 단순 채팅만 지원
  const {
    messages,
    inputValue,
    setInputValue,
    isGenerating,
    handleSendMessage,
    handleResetChat,
  } = useAssistantChat({
    projects,
    selectedProject: null,
    selectedProjectId: null,
    userRole,
    setSelectedProjectId: () => {},
    setProjects,
    setProjectToEdit: () => {},
    setIsEditDialogOpen: () => {},
    welcomeMessage,
    chatEndpoint: endpoint,
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <ChatPanel
        messages={messages}
        selectedProject={null}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSendMessage}
        isGenerating={isGenerating}
        onResetChat={handleResetChat}
        // Career Generator에서는 파일 업로드 및 프로젝트 관리 기능 사용 안 함
      />
    </div>
  );
}

