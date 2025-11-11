import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';

import type { Project } from '@/entities/project';

import { supabaseClient } from '@/shared/api/supabaseClient';

import type { AssistantMessage } from '../types';

const DEFAULT_WELCOME_MESSAGE =
  '안녕하세요! 저는 Nexter, 당신의 커리어 성장 파트너입니다.\n업로드한 프로젝트 속에서 당신의 강점과 잠재력을 발견하고,\n커리어 방향과 자기소개서까지 함께 정리해드릴게요!\n왼쪽에서 프로젝트를 선택하거나 새 프로젝트를 추가해보세요!';

const HISTORY_LIMIT = 10;

const buildWelcomeMessage = (projectId: number, projectTitle?: string | null): AssistantMessage => ({
  projectId,
  role: 'ai',
  content: projectTitle
    ? `안녕하세요! "${projectTitle}" 프로젝트를 함께 정리해볼까요?\n궁금한 내용을 자유롭게 말씀해 주세요.`
    : DEFAULT_WELCOME_MESSAGE,
  timestamp: new Date(),
});

type AssistantMessageRow = {
  id: string | number;
  project_id: number;
  role: 'ai' | 'user';
  content: string;
  created_at: string;
};

const mapRowToMessage = (row: AssistantMessageRow): AssistantMessage => ({
  id: String(row.id),
  projectId: row.project_id,
  role: row.role,
  content: row.content,
  timestamp: new Date(row.created_at),
});

const resolveAIBaseUrl = () => {
  const raw =
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_AI_BASE_URL ?? (import.meta as any)?.env?.VITE_AI_BASE_URL;
  if (typeof raw === 'string') {
    return raw.replace(/\/$/, '');
  }
  return undefined;
};

interface UseAssistantChatParams {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: number | null;
  userRole: string;
  setSelectedProjectId: Dispatch<SetStateAction<number | null>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setProjectToEdit: Dispatch<SetStateAction<Project | null>>;
  setIsEditDialogOpen: Dispatch<SetStateAction<boolean>>;
}

interface DemoScenarioStep {
  step: number;
  userMessage: string;
  aiMessage: string;
}

const DEMO_SCENARIO: DemoScenarioStep[] = [
  {
    step: 1,
    userMessage: '10월 요가페스티벌 기간 동안 방문을 늘리려는 목적이었어요.',
    aiMessage:
      '페스티벌 연계 방문 유도 캠페인이었군요.\n그럼 이 이벤트는 어떤 식으로 진행되었나요? 예를 들어 오프라인 참여나 신청 방식 같은 부분이 궁금해요.',
  },
  {
    step: 2,
    userMessage:
      '오프라인 방문 고객 중 체험한 사람에게 밀양사랑상품권을 지급했어요. 선착순으로 진행됐고, 예산이 빨리 소진됐어요.',
    aiMessage:
      '예산이 조기 소진됐다는 건 반응이 예상보다 좋았다는 뜻이네요 😊\n혹시 목표 대비 얼마나 달성하셨는지 수치적으로도 파악된 게 있을까요?',
  },
  {
    step: 3,
    userMessage: '네, 방문자가 전월 대비 약 200% 증가했어요.',
    aiMessage:
      '방문자 수는 크게 올랐지만, 예산 관리나 운영 측면에서 어려움은 있었던 것 같아요.\n다음에 같은 캠페인을 진행한다면 어떤 점을 바꾸고 싶으세요?',
  },
  {
    step: 4,
    userMessage: '선착순 대신 예약제로 바꾸고, 후기 공유형 이벤트로 바꾸려고요.',
    aiMessage:
      '정리해보면 이렇게 요약할 수 있겠네요 👇\n\n🎯 **목표**: 요가컬처타운 방문 유도 및 페스티벌 연계 홍보\n📊 **성과**: 방문자 수 200% 증가 (예산 조기 소진)\n⚙️ **운영 이슈**: 선착순 참여 혼잡\n💡 **개선 방향**: 예약제 + 후기 공유형 참여 구조\n\nKPI와 근거도 함께 정리해둘게요. 다음엔 이 데이터를 기반으로 비슷한 캠페인 설계 시 비교분석도 가능하겠어요!',
  },
];

export interface UseAssistantChatResult {
  messages: AssistantMessage[];
  setMessages: Dispatch<SetStateAction<AssistantMessage[]>>;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  handleSendMessage: () => Promise<void>;
  handleResetChat: () => Promise<void> | void;
  startDemoConversation: () => void;
  isDemoRunning: boolean;
  handleOrganizeWithAI: (project: Project) => void;
  handleSaveProjectOrganizing: (projectId: number) => void;
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
}: UseAssistantChatParams): UseAssistantChatResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([buildWelcomeMessage(0)]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const selectedProjectIdRef = useRef<number | null>(selectedProjectId);
  const messagesRef = useRef<AssistantMessage[]>(messages);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (selectedProjectId === null) {
      setMessages([buildWelcomeMessage(0)]);
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('assistant_messages')
          .select('id, project_id, role, content, created_at')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          const welcomeMessage = buildWelcomeMessage(selectedProjectId, selectedProject?.title);
          const { data: insertedWelcome, error: insertError } = (await supabaseClient
            .from('assistant_messages')
            .insert({
              project_id: selectedProjectId,
              role: welcomeMessage.role,
              content: welcomeMessage.content,
              created_at: welcomeMessage.timestamp.toISOString(),
            })
            .select('id, project_id, role, content, created_at')
            .single()) as {
            data: AssistantMessageRow | null;
            error: Error | null;
          };

          if (insertError) {
            throw insertError;
          }

          if (!isCancelled) {
            setMessages(insertedWelcome ? [mapRowToMessage(insertedWelcome)] : [welcomeMessage]);
          }
          return;
        }

        if (!isCancelled) {
          setMessages(data.map(mapRowToMessage));
        }
      } catch (error) {
        console.error('Failed to load messages', error);
        toast.error('메시지를 불러오지 못했습니다.');
        if (!isCancelled) {
          setMessages([buildWelcomeMessage(selectedProjectId, selectedProject?.title)]);
        }
      }
    };

    fetchMessages();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId, selectedProject?.title]);

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
      const baseUrl = resolveAIBaseUrl();
      const endpoint = baseUrl ? `${baseUrl}/chat` : '/chat';

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

      const { data: insertedRows, error: insertError } = (await supabaseClient
        .from('assistant_messages')
        .insert([
          {
            project_id: currentProjectId,
            role: 'user',
            content: trimmed,
            created_at: userTimestamp.toISOString(),
          },
          {
            project_id: currentProjectId,
            role: 'ai',
            content: generatedContent,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id, project_id, role, content, created_at')) as {
        data: AssistantMessageRow[] | null;
        error: Error | null;
      };

      if (insertError) {
        console.error('Failed to persist messages', insertError);
        toast.error('대화 내용을 저장하지 못했습니다.');
      } else if (insertedRows && insertedRows.length > 0) {
        setMessages((previous) =>
          previous.map((message) => {
            if (message.id === userTempId) {
              const insertedUser = insertedRows.find((row) => row.role === 'user');
              if (insertedUser) {
                return {
                  ...message,
                  id: String(insertedUser.id),
                  timestamp: new Date(insertedUser.created_at),
                };
              }
            }

            if (message.id === aiTempId) {
              const insertedAi = insertedRows.find((row) => row.role === 'ai');
              if (insertedAi) {
                return {
                  ...message,
                  id: String(insertedAi.id),
                  content: insertedAi.content,
                  timestamp: new Date(insertedAi.created_at),
                };
              }
            }

            return message;
          }),
        );
      }
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
  }, [inputValue, selectedProjectId, userRole]);

  const handleResetChat = useCallback(async () => {
    if (!confirm('대화 내용을 모두 삭제하시겠습니까?')) return;

    if (selectedProjectId === null) {
      setMessages([buildWelcomeMessage(0)]);
      toast.success('대화가 초기화되었습니다');
      return;
    }

    try {
      await supabaseClient.from('assistant_messages').delete().eq('project_id', selectedProjectId);

      const welcomeMessage = buildWelcomeMessage(selectedProjectId, selectedProject?.title);
      const { data: insertedWelcome, error: insertError } = (await supabaseClient
        .from('assistant_messages')
        .insert({
          project_id: selectedProjectId,
          role: welcomeMessage.role,
          content: welcomeMessage.content,
          created_at: welcomeMessage.timestamp.toISOString(),
        })
        .select('id, project_id, role, content, created_at')
        .single()) as {
        data: AssistantMessageRow | null;
        error: Error | null;
      };

      if (insertError) {
        throw insertError;
      }

      setMessages(insertedWelcome ? [mapRowToMessage(insertedWelcome)] : [welcomeMessage]);
      toast.success('대화가 초기화되었습니다');
    } catch (error) {
      console.error('Failed to reset chat', error);
      toast.error('대화를 초기화하지 못했습니다.');
    }
  }, [selectedProjectId, selectedProject?.title]);

  const startDemoConversation = useCallback(() => {
    setIsDemoRunning(true);
    setDemoStep(0);
    setMessages([buildWelcomeMessage(selectedProjectId ?? 0, selectedProject?.title)]);

    setTimeout(() => {
      const message: AssistantMessage = {
        projectId: selectedProjectId ?? 0,
        role: 'ai',
        content:
          '올려주신 이미지는 "10월 한달간 체험료 1인 1만원 한도 전액 페이백" 캠페인 안내네요.\n이 프로젝트는 어떤 목표로 진행하신 건가요?',
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, message]);
      setDemoStep(1);
    }, 1000);
  }, [selectedProject?.title, selectedProjectId]);

  useEffect(() => {
    if (!isDemoRunning) return;

    const currentScenario = DEMO_SCENARIO.find((scenario) => scenario.step === demoStep);
    if (!currentScenario) return;

    const userTimer = setTimeout(() => {
      const userMessage: AssistantMessage = {
        projectId: selectedProjectId ?? 0,
        role: 'user',
        content: currentScenario.userMessage,
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, userMessage]);

      const aiTimer = setTimeout(() => {
        const aiMessage: AssistantMessage = {
          projectId: selectedProjectId ?? 0,
          role: 'ai',
          content: currentScenario.aiMessage,
          timestamp: new Date(),
          isProjectOrganizing: true,
        };

        setMessages((previous) => [...previous, aiMessage]);

        if (demoStep < DEMO_SCENARIO.length) {
          setDemoStep((prev) => prev + 1);
        } else {
          setIsDemoRunning(false);
          toast.success('데모 대화가 완료되었습니다!');
        }
      }, 1500);

      return () => clearTimeout(aiTimer);
    }, 1000);

    return () => clearTimeout(userTimer);
  }, [demoStep, isDemoRunning, selectedProjectId]);

  const handleOrganizeWithAI = useCallback(
    (project: Project) => {
      setIsEditDialogOpen(false);
      setSelectedProjectId(project.id);

      const aiMessage: AssistantMessage = {
        role: 'ai',
        content: `"${project.title}" 프로젝트를 함께 정리해볼까요? 😊\n\n다음 질문들에 답변해주시면 프로젝트를 체계적으로 정리할 수 있어요:\n\n1. 이 프로젝트의 주요 목표는 무엇이었나요?\n2. 어떤 역할을 맡으셨나요?\n3. 가장 어려웠던 점과 어떻게 해결하셨나요?\n4. 이 프로젝트를 통해 얻은 성과나 배운 점은 무엇인가요?\n\n자유롭게 답변해주세요!`,
        timestamp: new Date(),
        isProjectOrganizing: true,
        projectId: project.id,
      };

      setMessages((previous) => [...previous, aiMessage]);
      toast.success('AI와 대화를 시작합니다');
    },
    [setIsEditDialogOpen, setMessages, setSelectedProjectId],
  );

  const handleSaveProjectOrganizing = useCallback(
    (projectId: number) => {
      const targetProject = projects.find((project) => project.id === projectId);
      if (!targetProject) return;

      if (isDemoRunning) {
        toast.loading('프로젝트 정보를 업데이트하는 중...');
        setTimeout(() => {
          toast.dismiss();
          toast.success('프로젝트 정보가 업데이트되었습니다!');

          setTimeout(() => {
            const summaryMessage: AssistantMessage = {
              projectId,
              role: 'ai',
              content:
                '✅ **저장 완료!**\n\n다음 정보가 "10월 페이백 이벤트 캠페인" 프로젝트에 추가되었어요:\n\n**목표**: 요가컬처타운 방문 유도 및 페스티벌 연계 홍보\n**성과**: 방문자 수 200% 증가 (예산 조기 소진)\n**운영 방식**: 오프라인 방문 → 체험 → 밀양사랑상품권 지급 (선착순)\n**개선점**: 예약제 + 후기 공유형 참여 구조로 전환 예정\n\n언제든 이 프로젝트를 다시 불러와서 포트폴리오나 자기소개서에 활용할 수 있어요! 💪',
              timestamp: new Date(),
            };

            setMessages((previous) => [...previous, summaryMessage]);
          }, 500);
        }, 1500);

        return;
      }

      const firstProjectMessageIndex = messages.findIndex((message) => message.projectId === projectId);
      const projectMessages = firstProjectMessageIndex === -1 ? [] : messages.slice(firstProjectMessageIndex);

      const userResponses = projectMessages
        .filter((message) => message.role === 'user')
        .map((message) => message.content)
        .join('\n\n');

      const updatedProject: Project = {
        ...targetProject,
        description: userResponses
          ? `${targetProject.description || targetProject.summary}\n\n=== AI와 함께 정리한 내용 ===\n${userResponses}`
          : targetProject.description,
      };

      setProjects((previous) => previous.map((project) => (project.id === projectId ? updatedProject : project)));
      setProjectToEdit(updatedProject);
      setIsEditDialogOpen(true);
      toast.success('대화 내용이 프로젝트에 반영되었습니다');
    },
    [isDemoRunning, messages, projects, setIsEditDialogOpen, setMessages, setProjectToEdit, setProjects],
  );

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isGenerating,
    setIsGenerating,
    handleSendMessage,
    handleResetChat,
    startDemoConversation,
    isDemoRunning,
    handleOrganizeWithAI,
    handleSaveProjectOrganizing,
  };
}


