import { Dispatch, SetStateAction, useState } from 'react';

import type { Project } from '@/entities/project';

import { ChatPanel } from '@/features/ai/chat';
import { useAIFeature } from '@/features/ai/generation/hooks/useAIFeature';
import { ProjectSelectDialog } from '@/features/ai/assistant/components/ProjectSelectDialog';
import { CareerFeatureCards } from './components/CareerFeatureCards';
import { useCareerChat } from './hooks/useCareerChat';
import { Sparkles } from 'lucide-react';

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
  const [selectedProjectId, setSelectedProjectId] = useState<number | string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('');

  // Career Generator 전용 채팅 훅
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isGenerating,
    setIsGenerating,
    handleSendMessage,
    handleResetChat,
    isCareerAssistantMode,
    setIsCareerAssistantMode,
  } = useCareerChat({
    welcomeMessage,
  });

  // 기능 선택 및 프로젝트 선택 훅
  const {
    projectSelectDialogOpen,
    selectedProjectsForFeature,
    openFeature,
    toggleProjectSelection,
    confirmFeature,
    closeProjectSelectDialog,
    maxSelectable,
    isAssistantMode: featureAssistantMode,
  } = useAIFeature({
    projects,
    selectedProjectId,
    userRole,
    setMessages,
    setIsGenerating,
  });

  // 기능 선택 시 Career Assistant 모드 활성화
  const handleOpenFeature = (feature: string) => {
    setSelectedFeature(feature);
    const isPortfolioOrResume = feature === '포트폴리오 작성' || feature === '자기소개서 작성';
    if (isPortfolioOrResume) {
      setIsCareerAssistantMode(true);
    }
    openFeature(feature);
  };

  // confirmFeature 후 Career Assistant 모드 활성화
  const handleConfirmFeature = async () => {
    await confirmFeature();
    const isPortfolioOrResume = selectedFeature === '포트폴리오 작성' || selectedFeature === '자기소개서 작성';
    if (isPortfolioOrResume && featureAssistantMode) {
      setIsCareerAssistantMode(true);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left: Feature Cards */}
      <CareerFeatureCards 
        onSelectFeature={handleOpenFeature}
        onSelectBasicInfo={() => {
          // 내 기본정보는 Settings 페이지로 이동하거나 프로필 정보를 표시
          window.location.hash = '#settings';
        }}
      />

      {/* Right: Chat Panel with Welcome Section */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 h-full">
        {/* Welcome Section - shown when no messages or only welcome message */}
        {messages.length <= 1 && (
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              AI 커리어 생성을 시작해보세요
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-2">
              왼쪽에서 원하는 기능을 선택하면
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              AI가 대화를 통해 맞춤형 콘텐츠를 생성합니다
            </p>
          </div>
        )}

        {/* Chat Panel */}
        <div className={messages.length <= 1 ? 'hidden' : 'flex-1 min-h-0 h-full'}>
          <ChatPanel
            messages={messages}
            selectedProject={null}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSendMessage}
            isGenerating={isGenerating}
            onResetChat={handleResetChat}
          />
        </div>

        {/* Show chat input at bottom when welcome is shown */}
        {messages.length <= 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="V:에게 질문하거나 추가 요청사항을 알려주세요"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => void handleSendMessage()}
                disabled={!inputValue.trim() || isGenerating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Select Dialog */}
      <ProjectSelectDialog
        open={projectSelectDialogOpen}
        featureName={selectedFeature}
        projects={projects}
        selectedProjectIds={selectedProjectsForFeature}
        onToggleProject={toggleProjectSelection}
        onConfirm={handleConfirmFeature}
        onClose={closeProjectSelectDialog}
        maxSelectable={maxSelectable}
      />
    </div>
  );
}

