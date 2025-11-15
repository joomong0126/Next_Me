import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';

import type { Project } from '@/entities/project';
import { supabaseClient } from '@/shared/api/supabaseClient';

import type { AssistantMessage } from '../types';
import {
  shouldUseAssistantMock,
  invokeOrganizeRefineFunction,
  type OrganizeRefineResponse,
} from '../api/chat';

const DEFAULT_WELCOME_MESSAGE =
  '안녕하세요! 저는 Nexter, 당신의 커리어 성장 파트너입니다.\n업로드한 프로젝트 속에서 당신의 강점과 잠재력을 발견하고,\n커리어 방향과 자기소개서까지 함께 정리해드릴게요!\n왼쪽에서 프로젝트를 선택하거나 새 프로젝트를 추가해보세요!';

const HISTORY_LIMIT = 10;

const buildWelcomeMessage = (
  projectId: number,
  options?: { projectTitle?: string | null; welcomeMessage?: string },
): AssistantMessage => ({
  projectId,
  role: 'ai',
  content: options?.projectTitle
    ? `안녕하세요! "${options.projectTitle}" 프로젝트를 함께 정리해볼까요?\n궁금한 내용을 자유롭게 말씀해 주세요.`
    : options?.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE,
  timestamp: new Date(),
});

// ✨ mock 전용 질문 시퀀스를 정의합니다. 실제 환경에서는 Supabase/AI가 메시지를 생성합니다.
const ORGANIZE_QUESTION_SEQUENCE = [
  '이 프로젝트의 주요 목표는 무엇이었나요?',
  '어떤 역할을 맡으셨나요?',
  '가장 어려웠던 점과 어떻게 해결하셨나요?',
  '이 프로젝트를 통해 얻은 성과나 배운 점은 무엇인가요?',
] as const;

const buildOrganizeQuestionMessage = (step: number, projectTitle?: string | null) => {
  switch (step) {
    case 0:
      return `안녕하세요! "${projectTitle ?? '이'}" 프로젝트를 함께 정리해볼까요?\n\n먼저, ${ORGANIZE_QUESTION_SEQUENCE[step]}`;
    case 1:
      return `좋아요! 이번에는 ${ORGANIZE_QUESTION_SEQUENCE[step]} 알려주세요.`;
    case 2:
      return `멋진 경험이네요. 이제 ${ORGANIZE_QUESTION_SEQUENCE[step]} 들려주세요.`;
    case 3:
      return `마지막 질문이에요. ${ORGANIZE_QUESTION_SEQUENCE[step]}`;
    default:
      return '정리를 이어가고 싶다면 추가로 알려주세요!';
  }
};

const buildOrganizeClosingMessage = () =>
  '답변 감사합니다! 지금까지 이야기한 내용을 바탕으로 프로젝트 정보를 자동으로 업데이트할게요. 필요하면 언제든 대화를 이어가도 좋아요.';

const extractSectionValue = (content: string | undefined, heading: string) => {
  if (!content) return undefined;
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\*\\*${escapedHeading}\\*\\*\\s*(?::\\s*)?(?:\\r?\\n)?([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`,
    'i',
  );
  const match = content.match(regex);
  if (!match || !match[1]) {
    return undefined;
  }
  const value = match[1]
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .join('\n\n');
  return value || undefined;
};

const pickSectionValue = (content: string | undefined, headings: string[]) => {
  for (const heading of headings) {
    const value = extractSectionValue(content, heading);
    if (value) {
      return value;
    }
  }
  return undefined;
};

const resolveAIBaseUrl = () => {
  const raw =
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_AI_BASE_URL ?? (import.meta as any)?.env?.VITE_AI_BASE_URL;
  if (typeof raw === 'string') {
    return raw.replace(/\/$/, '');
  }
  return undefined;
};

const resolveChatEndpoint = (customEndpoint?: string) => {
  // 커스텀 엔드포인트가 제공되면 사용
  if (customEndpoint) {
    return customEndpoint;
  }

  // 기본값: /chat 또는 {VITE_AI_BASE_URL}/chat
  const baseUrl = resolveAIBaseUrl();
  const defaultEndpoint = baseUrl ? `${baseUrl}/chat` : '/chat';

  return defaultEndpoint;
};

export interface UseAssistantChatParams {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: number | null;
  userRole: string;
  setSelectedProjectId: Dispatch<SetStateAction<number | null>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setProjectToEdit: Dispatch<SetStateAction<Project | null>>;
  setIsEditDialogOpen: Dispatch<SetStateAction<boolean>>;
  welcomeMessage?: string;
  chatEndpoint?: string; // 커스텀 채팅 엔드포인트 (예: '/career/chat')
}

export interface UseAssistantChatResult {
  messages: AssistantMessage[];
  setMessages: Dispatch<SetStateAction<AssistantMessage[]>>;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  handleSendMessage: () => Promise<void>;
  handleResetChat: () => Promise<void> | void;
  handleOrganizeWithAI: (project: Project) => Promise<void>;
  handleSaveProjectOrganizing: (projectId: number) => Promise<void>;
}

export function useAssistantChat({
  projects,
  selectedProject,
  selectedProjectId,
  userRole,
  setSelectedProjectId,
  setProjects,
  setProjectToEdit,
  setIsEditDialogOpen,
  welcomeMessage,
  chatEndpoint,
}: UseAssistantChatParams): UseAssistantChatResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([buildWelcomeMessage(0, { welcomeMessage })]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [organizingProjectIds, setOrganizingProjectIds] = useState<number[]>([]);
  const [organizingQuestionIndex, setOrganizingQuestionIndex] = useState<Record<number, number>>({});

  const selectedProjectIdRef = useRef<number | null>(selectedProjectId);
  const messagesRef = useRef<AssistantMessage[]>(messages);
  const autoSaveTriggeredProjectIdsRef = useRef<Set<number>>(new Set());

  // 프로젝트를 Supabase에 업데이트하는 함수
  const updateProjectInDatabase = useCallback(async (project: Project) => {
    try {
      // 프로젝트 스키마에 맞게 데이터 변환
      const updateData: Record<string, any> = {};
      
      if (project.title) updateData.title = project.title;
      if (project.category) updateData.category = project.category;
      if (project.tags) updateData.tags = project.tags;
      if (project.summary) updateData.summary = project.summary;
      if (project.startDate) {
        updateData.start_date = project.startDate instanceof Date 
          ? project.startDate.toISOString().split('T')[0] 
          : project.startDate;
      }
      if (project.endDate) {
        updateData.end_date = project.endDate instanceof Date 
          ? project.endDate.toISOString().split('T')[0] 
          : project.endDate;
      }
      // roles는 배열로 저장 (프로젝트 스키마에서 _text 타입)
      if (project.role) {
        updateData.roles = [project.role];
      }
      // achievements는 배열로 저장
      if (project.achievements) {
        updateData.achievements = typeof project.achievements === 'string' 
          ? project.achievements.split(',').map(s => s.trim()).filter(Boolean)
          : Array.isArray(project.achievements) 
            ? project.achievements 
            : [project.achievements];
      }
      // tools는 배열로 저장
      if (project.tools) {
        updateData.tools = typeof project.tools === 'string' 
          ? project.tools.split(',').map(s => s.trim()).filter(Boolean)
          : Array.isArray(project.tools) 
            ? project.tools 
            : [project.tools];
      }
      if (project.description) updateData.description = project.description;
      if (project.sourceUrl) updateData.source_url = project.sourceUrl;
      
      updateData.updated_at = new Date().toISOString();

      // 프로젝트 ID를 UUID 형식으로 변환 (데이터베이스 스키마가 uuid 타입이므로)
      // project.id가 숫자면 UUID로 변환할 수 없으므로 에러 처리
      let projectId: string;
      if (typeof project.id === 'number') {
        // 숫자 ID는 UUID로 변환할 수 없음
        console.warn('[updateProjectInDatabase] 프로젝트 ID가 숫자입니다. UUID 형식이 필요합니다:', project.id);
        throw new Error(`프로젝트 ID가 UUID 형식이 아닙니다: ${project.id}. API 응답에서 받은 project.id (UUID)를 사용해야 합니다.`);
      } else {
        // 문자열이면 UUID 형식으로 가정
        projectId = String(project.id);
      }

      const { error } = await supabaseClient
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) {
        console.error('[updateProjectInDatabase] 프로젝트 업데이트 실패:', error);
        throw error;
      }

      console.log('[updateProjectInDatabase] 프로젝트 업데이트 성공:', project.id);
    } catch (error) {
      console.error('[updateProjectInDatabase] 예외 발생:', error);
      // 에러가 발생해도 UI는 업데이트되도록 함 (로컬 상태는 유지)
    }
  }, []);

  const registerOrganizingProject = useCallback((projectId: number) => {
    // 이미 organize 흐름을 시작한 프로젝트 목록을 기억하여 이후 재호출 시 메시지를 재사용합니다.
    setOrganizingProjectIds((previous) => (previous.includes(projectId) ? previous : [...previous, projectId]));
  }, []);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (selectedProjectId === null) {
      // 프로젝트가 선택되지 않았을 때는 기본 환영 메시지 사용
      setMessages([buildWelcomeMessage(0, { welcomeMessage })]);
      return;
    }

    // 프로젝트가 선택되었을 때는 항상 Supabase에서 환영 메시지를 받아옴
    let isCancelled = false;

    const loadWelcomeMessage = async () => {
      try {
        console.log('[useAssistantChat] 환영 메시지 로드 시작:', selectedProjectId);
        const response = await invokeOrganizeRefineFunction({
          projectId: selectedProjectId,
          state: 'start',
        });

        if (isCancelled) return;

        const messageContent = response.message || response.content || '';
        console.log('[useAssistantChat] 환영 메시지 응답:', { messageContent: messageContent.substring(0, 50) + '...' });
        
        if (messageContent) {
          const welcomeMsg: AssistantMessage = {
            id: `welcome-${selectedProjectId}-${Date.now()}`,
            projectId: selectedProjectId,
            role: 'ai',
            content: messageContent,
            timestamp: new Date(),
            isProjectOrganizing: false,
          };
          setMessages([welcomeMsg]);
          console.log('[useAssistantChat] 환영 메시지 설정 완료');
        } else {
          console.warn('[useAssistantChat] API 응답에 메시지가 없음, 기본 메시지 사용');
          setMessages([buildWelcomeMessage(selectedProjectId, { projectTitle: selectedProject?.title, welcomeMessage })]);
        }
      } catch (error) {
        console.error('[useAssistantChat] 환영 메시지 로드 실패:', error);
        if (isCancelled) return;
        // 에러 발생 시 기본 환영 메시지 사용
        setMessages([buildWelcomeMessage(selectedProjectId, { projectTitle: selectedProject?.title, welcomeMessage })]);
      }
    };

    loadWelcomeMessage();

    return () => {
      isCancelled = true;
    };
  }, [selectedProject?.title, selectedProjectId, welcomeMessage]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (selectedProjectId === null) {
      setMessages((previous) => {
        if (previous.some((message) => message.action === 'registerProject')) {
          return previous;
        }

        const registerProjectMessage: AssistantMessage = {
          id: `register-project-${Date.now()}`,
          projectId: 0,
          role: 'ai',
          content: '프로젝트를 먼저 선택하거나 새 프로젝트를 등록해주세요.',
          timestamp: new Date(),
          action: 'registerProject',
        };

        return [...previous, registerProjectMessage];
      });
      return;
    }

    const currentProjectId = selectedProjectId;
    const userTempId = `temp-user-${Date.now()}`;
    const userTimestamp = new Date();

    const userMessage: AssistantMessage = {
      id: userTempId,
      projectId: currentProjectId,
      role: 'user',
      content: trimmed,
      timestamp: userTimestamp,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInputValue('');

    if (shouldUseAssistantMock() && organizingProjectIds.includes(currentProjectId)) {
      // ✨ mock 흐름: 사용자가 답변할 때마다 프런트가 다음 질문/마무리 메시지를 직접 이어 붙입니다.
      // 메시지는 로컬 상태로만 관리 (데이터베이스 저장 안함)
      try {
        const currentStep = organizingQuestionIndex[currentProjectId] ?? 0;
        const nextStep = Math.min(currentStep + 1, ORGANIZE_QUESTION_SEQUENCE.length);

        setOrganizingQuestionIndex((previous) => ({
          ...previous,
          [currentProjectId]: nextStep,
        }));

        const now = new Date();

        if (nextStep < ORGANIZE_QUESTION_SEQUENCE.length) {
          const followUpContent = buildOrganizeQuestionMessage(nextStep);
          const aiTempId = `mock-ai-${Date.now()}`;
          const followUpMessage: AssistantMessage = {
            id: aiTempId,
            projectId: currentProjectId,
            role: 'ai',
            content: followUpContent,
            timestamp: now,
          };

          setMessages((previous) => [...previous, followUpMessage]);
        } else {
          const closingContent = buildOrganizeClosingMessage();
          const aiTempId = `mock-ai-complete-${Date.now()}`;
          const closingMessage: AssistantMessage = {
            id: aiTempId,
            projectId: currentProjectId,
            role: 'ai',
            content: closingContent,
            timestamp: now,
            isProjectOrganizing: true,
          };

          setMessages((previous) => [...previous, closingMessage]);
        }
      } catch (error) {
        console.error('Failed to handle mock organizing response', error);
        toast.error('답변을 처리하지 못했습니다.');
      }

      return;
    }

    // 🧭 실제 흐름: 프로젝트 정리 대화 중일 때는 ai-projects-refine API를 호출합니다.
    if (organizingProjectIds.includes(currentProjectId) && !shouldUseAssistantMock()) {
      setIsGenerating(true);

      const aiTempId = `temp-ai-${Date.now()}`;
      const aiMessage: AssistantMessage = {
        id: aiTempId,
        projectId: currentProjectId,
        role: 'ai',
        content: '',
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, aiMessage]);

      try {
        // 사용자 답변이 "네", "완료" 등인지 확인하여 DONE 단계로 판단
        const isDoneAnswer = /^(네|완료|yes|ok|확인)$/i.test(trimmed.trim());
        
        // ING 단계: answer만 전송
        // DONE 단계: project_id와 answer를 함께 전송
        const response = await invokeOrganizeRefineFunction({
          projectId: isDoneAnswer ? currentProjectId : undefined,
          answer: trimmed,
        });

        console.log('[useAssistantChat] ai-projects-refine 응답:', response);

        let generatedContent = '';
        let isFinalAnalysis = false;

        // 응답 처리: DONE 단계에서는 project 객체가 포함됨
        if (response.project) {
          // DONE 단계: 프로젝트 업데이트와 함께 완료 메시지
          isFinalAnalysis = true;
          const project = response.project;
          
          // API 응답의 message를 우선 사용, 없으면 기본 메시지
          generatedContent = response.message || response.content || '프로젝트 내용을 보강했어! 다음에 보자!';

          // 프로젝트 정보 업데이트
          const targetProject = projects.find((p) => p.id === currentProjectId);
          if (targetProject) {
            const updatedProject: Project = {
              ...targetProject,
              // API 응답의 project 객체에서 필드 매핑
              title: project.title ?? targetProject.title,
              category: project.category ?? targetProject.category,
              tags: project.tags ?? targetProject.tags,
              summary: project.summary ?? targetProject.summary,
              startDate: project.start_date 
                ? (typeof project.start_date === 'string' ? new Date(project.start_date) : project.start_date)
                : targetProject.startDate,
              endDate: project.end_date 
                ? (typeof project.end_date === 'string' ? new Date(project.end_date) : project.end_date)
                : targetProject.endDate,
              role: project.role ?? project.roles?.[0] ?? targetProject.role,
              achievements: Array.isArray(project.achievements) 
                ? project.achievements.join(', ') 
                : project.achievements ?? targetProject.achievements,
              tools: Array.isArray(project.tools)
                ? project.tools.join(', ')
                : project.tools ?? targetProject.tools,
              description: project.description ?? targetProject.description,
            };

            setProjects((previous) => previous.map((p) => (p.id === currentProjectId ? updatedProject : p)));
            setProjectToEdit(updatedProject);
          }
        } else if (response.message || response.content) {
          // ING 단계: 일반 메시지
          const messageContent = response.message || response.content;
          generatedContent = typeof messageContent === 'string' 
            ? messageContent 
            : String(messageContent || '');
        } else if (typeof response === 'string') {
          // API가 직접 문자열을 반환한 경우
          generatedContent = response;
        } else {
          // 응답 형식이 예상과 다른 경우
          console.warn('[useAssistantChat] 예상치 못한 응답 형식:', response);
          generatedContent = JSON.stringify(response, null, 2);
        }

        if (selectedProjectIdRef.current !== currentProjectId) {
          return;
        }

        const finalMessage: AssistantMessage = {
          id: aiTempId,
          projectId: currentProjectId,
          role: 'ai',
          content: generatedContent,
          timestamp: new Date(),
          isProjectOrganizing: isFinalAnalysis,
        };

        setMessages((previous) =>
          previous.map((message) => (message.id === aiTempId ? finalMessage : message)),
        );

        // 프로젝트 업데이트가 완료된 경우 데이터베이스에 저장
        if (isFinalAnalysis && response.project?.id) {
          // API 응답에서 받은 project.id (UUID)를 사용하여 업데이트
          const targetProject = projects.find((p) => p.id === currentProjectId);
          if (targetProject) {
            try {
              // API 응답의 project.id를 사용하여 업데이트 (UUID 형식)
              const projectToUpdate: Project = {
                ...targetProject,
                // API 응답의 project.id를 문자열로 변환하여 사용
                id: response.project.id as any, // UUID를 문자열로 처리
              };
              await updateProjectInDatabase(projectToUpdate);
              toast.success('프로젝트 정보가 업데이트되었습니다!');
            } catch (updateError) {
              console.error('[useAssistantChat] 프로젝트 업데이트 실패:', updateError);
              toast.success('프로젝트 분석이 완료되었습니다! (로컬에만 저장됨)');
            }
          }
        }
      } catch (error) {
        console.error('[useAssistantChat] 프로젝트 정리 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '프로젝트 정리 중 오류가 발생했습니다.';
        console.error('[useAssistantChat] 에러 상세:', {
          error,
          errorMessage,
          currentProjectId,
          organizingProjectIds,
        });
        toast.error(errorMessage);
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

    // 🧭 실제 흐름: 일반 대화는 AI 백엔드(`/chat`)와의 통신을 통해 응답을 스트리밍으로 받아옵니다.
    setIsGenerating(true);

    const aiTempId = `temp-ai-${Date.now()}`;
    const aiMessage: AssistantMessage = {
      id: aiTempId,
      projectId: currentProjectId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
    };

    setMessages((previous) => [...previous, aiMessage]);

    const historyPayload = [...messagesRef.current, userMessage]
      .slice(-HISTORY_LIMIT)
      .map(({ role, content }) => ({ role, content }));

    let generatedContent = '';
    let hasReceivedFirstChunk = false;

    try {
      // 커스텀 엔드포인트 또는 기본 엔드포인트 사용
      const endpoint = resolveChatEndpoint(chatEndpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          userRole,
          history: historyPayload,
          input: trimmed,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('AI 서버 응답이 올바르지 않습니다.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            generatedContent += chunk;
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setIsGenerating(false);
            }

            setMessages((previous) =>
              previous.map((message) =>
                message.id === aiTempId
                  ? {
                      ...message,
                      content: generatedContent,
                      timestamp: new Date(),
                    }
                  : message,
              ),
            );
          }
        }
      }

      if (!hasReceivedFirstChunk) {
        setIsGenerating(false);
      }

      generatedContent = generatedContent.trim();

      if (selectedProjectIdRef.current !== currentProjectId) {
        return;
      }

      if (generatedContent) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === aiTempId
              ? {
                  ...message,
                  content: generatedContent,
                }
              : message,
          ),
        );
      }

      // 메시지는 로컬 상태로만 관리 (데이터베이스 저장 안함)
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('메시지를 전송하지 못했습니다.');
      setMessages((previous) =>
        previous.map((message) =>
          message.id === aiTempId
            ? {
                ...message,
                content: '죄송해요, 응답을 생성하지 못했습니다.',
                timestamp: new Date(),
              }
            : message,
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, organizingProjectIds, organizingQuestionIndex, selectedProjectId, userRole, chatEndpoint, projects, setProjects, setProjectToEdit]);

  const handleResetChat = useCallback(async () => {
    if (!confirm('대화 내용을 모두 삭제하시겠습니까?')) return;

    if (selectedProjectId === null) {
      setMessages([buildWelcomeMessage(0, { welcomeMessage })]);
      toast.success('대화가 초기화되었습니다');
      return;
    }

    // Supabase에서 환영 메시지를 받아옴
    try {
      const response = await invokeOrganizeRefineFunction({
        projectId: selectedProjectId,
        state: 'start',
      });

      const messageContent = response.message || response.content || '';
      if (messageContent) {
        const welcomeMsg: AssistantMessage = {
          id: `welcome-reset-${selectedProjectId}-${Date.now()}`,
          projectId: selectedProjectId,
          role: 'ai',
          content: messageContent,
          timestamp: new Date(),
          isProjectOrganizing: false,
        };
        setMessages([welcomeMsg]);
      } else {
        // API 응답이 없으면 기본 환영 메시지 사용
        const projectWelcomeMessage = buildWelcomeMessage(selectedProjectId, {
          projectTitle: selectedProject?.title,
          welcomeMessage,
        });
        setMessages([projectWelcomeMessage]);
      }
    } catch (error) {
      console.error('[handleResetChat] 환영 메시지 로드 실패:', error);
      // 에러 발생 시 기본 환영 메시지 사용
      const projectWelcomeMessage = buildWelcomeMessage(selectedProjectId, {
        projectTitle: selectedProject?.title,
        welcomeMessage,
      });
      setMessages([projectWelcomeMessage]);
    }

    autoSaveTriggeredProjectIdsRef.current.delete(selectedProjectId);
    toast.success('대화가 초기화되었습니다');
  }, [selectedProjectId, selectedProject?.title, welcomeMessage]);

  const handleOrganizeWithAI = useCallback(
    async (project: Project) => {
      setIsEditDialogOpen(false);
      setSelectedProjectId(project.id);
      setOrganizingQuestionIndex((previous) => ({
        ...previous,
        [project.id]: 0,
      }));
      autoSaveTriggeredProjectIdsRef.current.delete(project.id);

      if (organizingProjectIds.includes(project.id)) {
        // 이미 대화를 시작한 프로젝트는 환영 메시지만 표시
        setMessages([buildWelcomeMessage(project.id, { projectTitle: project.title, welcomeMessage })]);
        toast.success('기존 대화를 불러왔습니다');
        return;
      }

      setIsGenerating(true);

      try {
        // ✨ mock 흐름: Supabase Edge Function이 없으므로 프런트에서 단계별 질문을 직접 만들어 저장합니다.
        if (shouldUseAssistantMock()) {
          const prompt = buildOrganizeQuestionMessage(0, project.title);
          const aiMessage: AssistantMessage = {
            id: `ai-start-mock-${Date.now()}`,
            projectId: project.id,
            role: 'ai',
            content: prompt,
            timestamp: new Date(),
            isProjectOrganizing: false,
          };

          setMessages([aiMessage]);
        } else {
          // 🧭 실제 흐름: ai-projects-refine API에 START 요청을 보냅니다.
          try {
            const response = await invokeOrganizeRefineFunction({
              projectId: project.id,
              state: 'start',
            });

            // API 응답에서 메시지 추출
            const messageContent = response.message || response.content || '';
            if (messageContent) {
              // 메시지는 로컬 상태로만 관리
              const aiMessage: AssistantMessage = {
                id: `ai-start-${Date.now()}`,
                projectId: project.id,
                role: 'ai',
                content: messageContent,
                timestamp: new Date(),
                isProjectOrganizing: false,
              };

              setMessages([aiMessage]);
            } else {
              throw new Error('API 응답에 메시지가 없습니다.');
            }
          } catch (startError) {
            // ai-projects-refine 함수가 없거나 접근할 수 없는 경우
            // Mock 모드로 fallback하여 대화를 계속 진행할 수 있도록 함
            console.warn('[useAssistantChat] ai-projects-refine START 실패, Mock 모드로 fallback:', startError);
            
            const prompt = buildOrganizeQuestionMessage(0, project.title);
            const aiMessage: AssistantMessage = {
              id: `ai-start-fallback-${Date.now()}`,
              projectId: project.id,
              role: 'ai',
              content: prompt,
              timestamp: new Date(),
              isProjectOrganizing: false,
            };

            setMessages([aiMessage]);
            
            toast.info('AI 서버에 연결할 수 없어 로컬 모드로 진행합니다.');
          }
        }

        registerOrganizingProject(project.id);

        // 메시지는 로컬 상태로만 관리하므로 추가 작업 불필요
        toast.success('AI와 대화를 시작합니다');
      } catch (error) {
        console.error('[useAssistantChat] 프로젝트 정리 시작 실패:', error);
        const errorMessage = error instanceof Error ? error.message : 'AI 대화를 시작하지 못했습니다.';
        console.error('[useAssistantChat] 에러 상세:', {
          error,
          errorMessage,
          projectId: project.id,
          projectTitle: project.title,
        });
        toast.error(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      organizingProjectIds,
      registerOrganizingProject,
      setIsEditDialogOpen,
      setMessages,
      setSelectedProjectId,
      welcomeMessage,
    ],
  );

  const handleSaveProjectOrganizing = useCallback(
    async (projectId: number) => {
      const targetProject = projects.find((project) => project.id === projectId);
      if (!targetProject) return;

      const firstProjectMessageIndex = messages.findIndex((message) => message.projectId === projectId);
      const projectMessages = firstProjectMessageIndex === -1 ? [] : messages.slice(firstProjectMessageIndex);

      if (projectMessages.length === 0) {
        toast.error('대화 기록이 없습니다.');
        return;
      }

      if (shouldUseAssistantMock()) {
        // ✨ mock 흐름: 사용자 답변을 간단히 요약해 필드에 채우고, 완료 메시지를 바로 작성합니다.
        const userResponses = projectMessages.filter((message) => message.role === 'user').map((message) => message.content);

        const goal = userResponses[0]?.trim() || targetProject.summary || '프로젝트 목표가 아직 입력되지 않았어요.';
        const role = userResponses[1]?.trim() || targetProject.role || '맡은 역할을 정리해 주세요.';
        const achievementsText =
          userResponses[2]?.trim() || targetProject.achievements || '주요 성과를 추가하면 더 풍부해집니다.';
        const improvements = userResponses[3]?.trim();
        const tools = targetProject.tools || '사용한 기술/도구를 정리해 주세요.';
        const description = [targetProject.description, improvements, userResponses.slice(4).join('\n\n')]
          .filter(Boolean)
          .join('\n\n')
          .trim();

        const updatedProject: Project = {
          ...targetProject,
          role,
          achievements: achievementsText,
          tools,
          description: description || targetProject.description,
          summary: goal,
        };

        setProjects((previous) => previous.map((project) => (project.id === projectId ? updatedProject : project)));
        setProjectToEdit(updatedProject);
        setIsEditDialogOpen(true);

        const summaryContent = [
          '✅ **저장 완료!**',
          '',
          `🎯 **목표**\n${goal}`,
          `👤 **내 역할**\n${role}`,
          `🚀 **주요 성과**\n${achievementsText}`,
          `🛠️ **사용 기술/도구**\n${tools}`,
          `📝 **상세 설명**\n${description || '추가 메모를 입력해 보세요.'}`,
        ].join('\n');

        const summaryMessage: AssistantMessage = {
          projectId,
          role: 'ai',
          content: summaryContent,
          timestamp: new Date(),
          isProjectOrganizing: true,
        };

        setMessages((previous) => [...previous, summaryMessage]);

        // 프로젝트를 데이터베이스에 저장
        try {
          await updateProjectInDatabase(updatedProject);
          toast.success('대화 내용이 프로젝트에 반영되었습니다');
        } catch (updateError) {
          console.error('[handleSaveProjectOrganizing] 프로젝트 업데이트 실패:', updateError);
          toast.success('대화 내용이 프로젝트에 반영되었습니다 (로컬에만 저장됨)');
        }
        return;
      }

      // 실제 흐름: ai-projects-refine API의 DONE 응답에서 이미 프로젝트 정보를 받았으므로
      // 별도의 요약 함수를 호출할 필요 없이 이미 업데이트된 프로젝트 정보를 사용합니다.
      // (assistant-organize-summarize 함수는 사용하지 않음)
      
      // 이미 DONE 단계에서 프로젝트가 업데이트되었으므로, 
      // 여기서는 프로젝트 편집 다이얼로그만 열면 됩니다.
      setProjectToEdit(targetProject);
      setIsEditDialogOpen(true);
      toast.success('프로젝트 정보가 업데이트되었습니다!');
    },
    [messages, projects, setIsEditDialogOpen, setMessages, setProjectToEdit, setProjects, updateProjectInDatabase],
  );

  useEffect(() => {
    if (messages.length === 0) return;

    const latestOrganizingMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === 'ai' &&
          message.isProjectOrganizing &&
          typeof message.projectId === 'number' &&
          organizingProjectIds.includes(message.projectId),
      );

    if (!latestOrganizingMessage) {
      return;
    }

    const projectId = latestOrganizingMessage.projectId!;

    if (autoSaveTriggeredProjectIdsRef.current.has(projectId)) {
      return;
    }

    autoSaveTriggeredProjectIdsRef.current.add(projectId);

    void handleSaveProjectOrganizing(projectId);
  }, [messages, organizingProjectIds, handleSaveProjectOrganizing]);

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isGenerating,
    setIsGenerating,
    handleSendMessage,
    handleResetChat,
    handleOrganizeWithAI,
    handleSaveProjectOrganizing,
  };
}

