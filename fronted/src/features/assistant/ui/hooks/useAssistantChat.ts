import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';

import type { Project } from '@/entities/project';

import { isMockSupabaseClient, supabaseClient } from '@/shared/api/supabaseClient';

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

// 공통 함수: 환경 변수 또는 supabaseClient mock 여부로 현재가 mock 모드인지 판단합니다.
const shouldUseAssistantMock = () => {
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
  // 🧭 실제 환경: Supabase Edge Function 호출용 이름 (환경 변수로 주입). mock일 땐 기본값만 사용하고 호출하지 않습니다.
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_START ??
    (import.meta as any)?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_START;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'assistant-organize-start';
};

const resolveOrganizeSummarizeFunctionName = () => {
  // 🧭 실제 환경: 요약을 돌려줄 Supabase Edge Function 이름. mock 흐름에서는 호출되지 않습니다.
  const raw =
    (globalThis as any)?.process?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_SUMMARIZE ??
    (import.meta as any)?.env?.VITE_SUPABASE_ASSISTANT_ORGANIZE_SUMMARIZE;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return 'assistant-organize-summarize';
};

type OrganizeStartResponse = {
  messages?: (AssistantMessageRow & { is_project_organizing?: boolean })[];
  message?: (AssistantMessageRow & { is_project_organizing?: boolean }) | null;
};

type OrganizeSummarizeResponse = {
  project?: {
    role?: string;
    achievements?: string;
    tools?: string;
    description?: string;
    summary?: string;
  };
  message?: (AssistantMessageRow & { is_project_organizing?: boolean }) | null;
};

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
}: UseAssistantChatParams): UseAssistantChatResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([buildWelcomeMessage(0)]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [organizingProjectIds, setOrganizingProjectIds] = useState<number[]>([]);
  const [organizingQuestionIndex, setOrganizingQuestionIndex] = useState<Record<number, number>>({});

  const selectedProjectIdRef = useRef<number | null>(selectedProjectId);
  const messagesRef = useRef<AssistantMessage[]>(messages);
  const autoSaveTriggeredProjectIdsRef = useRef<Set<number>>(new Set());

  // 프로젝트별로 Supabase에 저장된 전체 메시지 로그를 읽어옵니다.
  const fetchMessagesForProject = useCallback(async (projectId: number, projectTitle?: string | null) => {
    // 공통 유틸: 실제/모두 동일 API로 메시지를 읽어오기 때문에 여기서 한 번만 구현합니다.
    const { data, error } = (await supabaseClient
      .from('assistant_messages')
      .select('id, project_id, role, content, created_at, is_project_organizing')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })) as {
      data: AssistantMessageRow[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [buildWelcomeMessage(projectId, projectTitle)];
    }

    return data.map(mapRowToMessage);
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
      setMessages([buildWelcomeMessage(0)]);
      return;
    }

    if (!organizingProjectIds.includes(selectedProjectId)) {
      setMessages([buildWelcomeMessage(selectedProjectId, selectedProject?.title)]);
      return;
    }

    let isCancelled = false;

    const loadMessages = async () => {
      try {
        const fetchedMessages = await fetchMessagesForProject(selectedProjectId, selectedProject?.title);
        if (!isCancelled) {
          setMessages(fetchedMessages);
        }
      } catch (error) {
        console.error('Failed to load messages', error);
        if (!isCancelled) {
          toast.error('메시지를 불러오지 못했습니다.');
          setMessages([buildWelcomeMessage(selectedProjectId, selectedProject?.title)]);
        }
      }
    };

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [fetchMessagesForProject, organizingProjectIds, selectedProject?.title, selectedProjectId]);

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
      try {
        const { data: insertedUser, error: userInsertError } = (await supabaseClient
          .from('assistant_messages')
          .insert({
            project_id: currentProjectId,
            role: 'user',
            content: trimmed,
            created_at: userTimestamp.toISOString(),
          })
          .select('id, project_id, role, content, created_at, is_project_organizing')
          .single()) as { data: AssistantMessageRow | null; error: Error | null };

        if (userInsertError) {
          throw userInsertError;
        }

        if (insertedUser) {
          setMessages((previous) =>
            previous.map((message) => (message.id === userTempId ? mapRowToMessage(insertedUser) : message)),
          );
        }

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

          const { data: insertedFollowUp, error: followUpInsertError } = (await supabaseClient
            .from('assistant_messages')
            .insert({
              project_id: currentProjectId,
              role: 'ai',
              content: followUpContent,
              created_at: now.toISOString(),
              is_project_organizing: false,
            })
            .select('id, project_id, role, content, created_at, is_project_organizing')
            .single()) as { data: AssistantMessageRow | null; error: Error | null };

          if (followUpInsertError) {
            throw followUpInsertError;
          }

          if (insertedFollowUp) {
            setMessages((previous) =>
              previous.map((message) => (message.id === aiTempId ? mapRowToMessage(insertedFollowUp) : message)),
            );
          }
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

          const { data: insertedClosing, error: closingInsertError } = (await supabaseClient
            .from('assistant_messages')
            .insert({
              project_id: currentProjectId,
              role: 'ai',
              content: closingContent,
              created_at: now.toISOString(),
              is_project_organizing: true,
            })
            .select('id, project_id, role, content, created_at, is_project_organizing')
            .single()) as { data: AssistantMessageRow | null; error: Error | null };

          if (closingInsertError) {
            throw closingInsertError;
          }

          if (insertedClosing) {
            setMessages((previous) =>
              previous.map((message) => (message.id === aiTempId ? mapRowToMessage(insertedClosing) : message)),
            );
          }
        }
      } catch (error) {
        console.error('Failed to handle mock organizing response', error);
        toast.error('답변을 처리하지 못했습니다.');
      }

      return;
    }

    // 🧭 실제 흐름: 이후 로직은 AI 백엔드(`/chat`)와의 통신을 통해 응답을 스트리밍으로 받아옵니다.
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
        .select('id, project_id, role, content, created_at, is_project_organizing')) as {
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
  }, [inputValue, organizingProjectIds, organizingQuestionIndex, selectedProjectId, userRole]);

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
        .select('id, project_id, role, content, created_at, is_project_organizing')
        .single()) as {
        data: AssistantMessageRow | null;
        error: Error | null;
      };

      if (insertError) {
        throw insertError;
      }

      setMessages(insertedWelcome ? [mapRowToMessage(insertedWelcome)] : [welcomeMessage]);
      autoSaveTriggeredProjectIdsRef.current.delete(selectedProjectId);
      toast.success('대화가 초기화되었습니다');
    } catch (error) {
      console.error('Failed to reset chat', error);
      toast.error('대화를 초기화하지 못했습니다.');
    }
  }, [selectedProjectId, selectedProject?.title]);

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
        try {
          const existingMessages = await fetchMessagesForProject(project.id, project.title);
          setMessages(existingMessages);
          const answeredCount = Math.min(
            existingMessages.filter((message) => message.projectId === project.id && message.role === 'user').length,
            ORGANIZE_QUESTION_SEQUENCE.length,
          );
          setOrganizingQuestionIndex((previous) => ({
            ...previous,
            [project.id]: answeredCount,
          }));
          toast.success('기존 대화를 불러왔습니다');
        } catch (error) {
          console.error('Failed to reload existing conversation', error);
          toast.error('대화를 불러오지 못했습니다.');
        }
        return;
      }

      setIsGenerating(true);

      try {
        // ✨ mock 흐름: Supabase Edge Function이 없으므로 프런트에서 단계별 질문을 직접 만들어 저장합니다.
        if (shouldUseAssistantMock()) {
          const prompt = buildOrganizeQuestionMessage(0, project.title);
          const { data, error } = (await supabaseClient
            .from('assistant_messages')
            .insert({
              project_id: project.id,
              role: 'ai',
              content: prompt,
              created_at: new Date().toISOString(),
              is_project_organizing: false,
            })
            .select('id, project_id, role, content, created_at, is_project_organizing')
            .single()) as { data: AssistantMessageRow | null; error: Error | null };

          if (error) {
            throw error;
          }

          if (data) {
            setMessages((previous) => [...previous, mapRowToMessage(data)]);
          }
        } else {
          // 🧭 실제 흐름: Supabase Edge Function이 첫 질문(또는 여러 시스템 메시지)을 내려줍니다.
          const functionName = resolveOrganizeStartFunctionName();

          if (!supabaseClient?.functions?.invoke) {
            throw new Error('Supabase Functions API를 사용할 수 없습니다.');
          }

          // 실제 환경에서는 Supabase Edge Function을 호출하여 첫 질문 / 시스템 메시지를 받아옵니다.
          const { data, error } = await supabaseClient.functions.invoke(functionName, {
            body: {
              projectId: project.id,
              projectTitle: project.title,
            },
          });

          if (error) {
            throw error;
          }

          const response = data as OrganizeStartResponse | null;

          const responseMessages = response?.messages ?? (response?.message ? [response.message] : []);
          if (responseMessages.length > 0) {
            setMessages(responseMessages.map(mapRowToMessage));
          }
        }

        registerOrganizingProject(project.id);

        const refreshedMessages = await fetchMessagesForProject(project.id, project.title);
        setMessages(refreshedMessages);
        const answeredCount = Math.min(
          refreshedMessages.filter((message) => message.projectId === project.id && message.role === 'user').length,
          ORGANIZE_QUESTION_SEQUENCE.length,
        );
        setOrganizingQuestionIndex((previous) => ({
          ...previous,
          [project.id]: answeredCount,
        }));

        toast.success('AI와 대화를 시작합니다');
      } catch (error) {
        console.error('Failed to start organizing conversation', error);
        toast.error('AI 대화를 시작하지 못했습니다.');
      } finally {
        setIsGenerating(false);
      }
    },
    [
      fetchMessagesForProject,
      organizingProjectIds,
      registerOrganizingProject,
      setIsEditDialogOpen,
      setMessages,
      setSelectedProjectId,
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

        const { error: summaryPersistError } = (await supabaseClient
          .from('assistant_messages')
          .insert({
            project_id: projectId,
            role: 'ai',
            content: summaryContent,
            created_at: new Date().toISOString(),
            is_project_organizing: true,
          })
          .select('id, project_id, role, content, created_at, is_project_organizing')) as {
          data: AssistantMessageRow[] | null;
          error: Error | null;
        };

        if (summaryPersistError) {
          console.error('Failed to persist mock summary message', summaryPersistError);
        }

        toast.success('대화 내용이 프로젝트에 반영되었습니다');
        return;
      }

      const loadingToastId = toast.loading('프로젝트 정보를 업데이트하는 중...');

      try {
        if (!supabaseClient?.functions?.invoke) {
          throw new Error('Supabase Functions API를 사용할 수 없습니다.');
        }

        const historyPayload = projectMessages.map(({ role, content }) => ({ role, content }));
        const functionName = resolveOrganizeSummarizeFunctionName();

        // 🧭 실제 흐름: Supabase Function에서 요약된 역할/성과/도구/설명을 받아 프로젝트 모델을 최신화합니다.
        const { data, error } = await supabaseClient.functions.invoke(functionName, {
          body: {
            projectId,
            projectTitle: targetProject.title,
            history: historyPayload,
          },
        });

        if (error) {
          throw error;
        }

        const response = data as OrganizeSummarizeResponse | null;
        const summary = response?.project ?? {};
        const responseContent = response?.message?.content;

        const parsedSummary =
          summary.summary ?? pickSectionValue(responseContent, ['요약', '목표', '프로젝트 목표', '핵심 정리']);
        const parsedRole =
          summary.role ?? pickSectionValue(responseContent, ['내 역할', '역할', '책임 역할', '맡은 역할']);
        const parsedAchievements =
          summary.achievements ??
          pickSectionValue(responseContent, ['주요 성과', '성과', '임팩트', '어필 포인트']);
        const parsedTools =
          summary.tools ??
          pickSectionValue(responseContent, ['사용 기술/도구', '사용 기술', '기술 스택', 'Tech Stack']);
        const parsedDescription =
          summary.description ?? pickSectionValue(responseContent, ['상세 설명', '추가 메모', '세부 내용']);

        const updatedProject: Project = {
          ...targetProject,
          role: parsedRole ?? targetProject.role,
          achievements: parsedAchievements ?? targetProject.achievements,
          tools: parsedTools ?? targetProject.tools,
          description: parsedDescription ?? targetProject.description,
          summary: parsedSummary ?? targetProject.summary,
        };

        setProjects((previous) => previous.map((project) => (project.id === projectId ? updatedProject : project)));
        setProjectToEdit(updatedProject);
        setIsEditDialogOpen(true);

        if (response?.message) {
          setMessages((previous) => [...previous, mapRowToMessage(response.message!)]);
        }

        toast.dismiss(loadingToastId);
        toast.success('프로젝트 정보가 업데이트되었습니다!');
      } catch (error) {
        console.error('Failed to save project organizing result', error);
        toast.dismiss(loadingToastId);
        toast.error('프로젝트 정보를 업데이트하지 못했습니다.');
      }
    },
    [messages, projects, setIsEditDialogOpen, setMessages, setProjectToEdit, setProjects],
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


