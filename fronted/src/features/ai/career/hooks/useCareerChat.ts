import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';

import type { AssistantMessage } from '@/features/ai/chat/types';
import { invokeCareerAssistantMessage } from '../api/careerAssistant';

const DEFAULT_WELCOME_MESSAGE =
  'AI 커리어 제너레이터입니다. 프로젝트를 분석하고 원하는 결과물을 만들어보세요.';

interface UseCareerChatParams {
  welcomeMessage?: string;
}

interface UseCareerChatResult {
  messages: AssistantMessage[];
  setMessages: Dispatch<SetStateAction<AssistantMessage[]>>;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  handleSendMessage: () => Promise<void>;
  handleResetChat: () => void;
  isCareerAssistantMode: boolean; // 포트폴리오/자기소개서 모드인지 여부
  setIsCareerAssistantMode: Dispatch<SetStateAction<boolean>>;
}

export function useCareerChat({ welcomeMessage = DEFAULT_WELCOME_MESSAGE }: UseCareerChatParams = {}): UseCareerChatResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      projectId: 0,
      role: 'ai',
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCareerAssistantMode, setIsCareerAssistantMode] = useState(false);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      projectId: 0,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setInputValue('');

    // 포트폴리오/자기소개서 모드인 경우 ai-projects-assistant API 호출
    if (isCareerAssistantMode) {
      setIsGenerating(true);

      const aiTempId = `ai-${Date.now()}`;
      const aiMessage: AssistantMessage = {
        id: aiTempId,
        projectId: 0,
        role: 'ai',
        content: '',
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, aiMessage]);

      try {
        const response = await invokeCareerAssistantMessage({
          answer: trimmed,
        });

        const finalMessage: AssistantMessage = {
          id: aiTempId,
          projectId: 0,
          role: 'ai',
          content: response.message,
          timestamp: new Date(),
          url: response.url,
          filename: response.filename,
        };

        setMessages((previous) =>
          previous.map((message) => (message.id === aiTempId ? finalMessage : message)),
        );

        if (response.url && response.filename) {
          toast.success(`${response.filename} 파일이 생성되었습니다!`);
        }
      } catch (error) {
        console.error('[useCareerChat] ai-projects-assistant 호출 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        toast.error(`메시지 전송 실패: ${errorMessage}`);
        setMessages((previous) =>
          previous.map((message) =>
            message.id === aiTempId
              ? {
                  ...message,
                  content: `죄송해요, 응답을 생성하지 못했습니다.\n\n오류: ${errorMessage}`,
                  timestamp: new Date(),
                }
              : message,
          ),
        );
      } finally {
        setIsGenerating(false);
      }

      return;
    }

    // 일반 모드: 간단한 응답 (향후 확장 가능)
    setIsGenerating(true);
    setTimeout(() => {
      const aiMessage: AssistantMessage = {
        id: `ai-${Date.now()}`,
        projectId: 0,
        role: 'ai',
        content: '왼쪽에서 원하는 기능을 선택해주세요.',
        timestamp: new Date(),
      };
      setMessages((previous) => [...previous, aiMessage]);
      setIsGenerating(false);
    }, 500);
  }, [inputValue, isCareerAssistantMode]);

  const handleResetChat = useCallback(() => {
    if (!confirm('대화 내용을 모두 삭제하시겠습니까?')) return;
    setMessages([
      {
        id: 'welcome',
        projectId: 0,
        role: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
    setIsCareerAssistantMode(false);
    toast.success('대화가 초기화되었습니다');
  }, [welcomeMessage]);

  return {
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
  };
}

