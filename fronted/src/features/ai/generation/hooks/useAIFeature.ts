import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';

import type { Project } from '@/entities/project';

import type { AssistantMessage } from '@/features/ai/chat/types';
import {
  createFeaturePreparationMessage,
  createFeatureResultContent,
  createFeatureResultMessage,
  MAX_FEATURE_PROJECT_SELECTION,
} from '../utils/featureResponses';
import {
  invokeCareerAssistantStart,
  type CareerAssistantPurpose,
} from '@/features/ai/career/api/careerAssistant';

interface UseAIFeatureParams {
  projects: Project[];
  selectedProjectId: number | string | null;
  userRole: string;
  setMessages: Dispatch<SetStateAction<AssistantMessage[]>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
}

interface UseAIFeatureResult {
  selectedFeature: string;
  projectSelectDialogOpen: boolean;
  selectedProjectsForFeature: (number | string)[];
  maxSelectable: number;
  openFeature: (feature: string) => void;
  toggleProjectSelection: (projectId: number | string) => void;
  confirmFeature: () => void | Promise<void>;
  closeProjectSelectDialog: () => void;
  isAssistantMode: boolean; // 포트폴리오/자기소개서 모드인지 여부
}

// 포트폴리오/자기소개서 기능인지 확인
const isAssistantFeature = (feature: string): boolean => {
  return feature === '포트폴리오 작성' || feature === '자기소개서 작성';
};

// 기능 이름을 API purpose로 변환
const featureToPurpose = (feature: string): CareerAssistantPurpose | null => {
  if (feature === '포트폴리오 작성') return '포트폴리오';
  if (feature === '자기소개서 작성') return '자기소개서';
  return null;
};

export function useAIFeature({
  projects,
  selectedProjectId,
  userRole,
  setMessages,
  setIsGenerating,
}: UseAIFeatureParams): UseAIFeatureResult {
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [projectSelectDialogOpen, setProjectSelectDialogOpen] = useState(false);
  const [selectedProjectsForFeature, setSelectedProjectsForFeature] = useState<(number | string)[]>([]);
  const [isAssistantMode, setIsAssistantMode] = useState(false);

  const openFeature = useCallback(
    (feature: string) => {
      if (projects.length === 0) {
        toast.error('프로젝트를 먼저 추가해주세요');
        return;
      }

      setSelectedFeature(feature);
      setSelectedProjectsForFeature([]);
      setProjectSelectDialogOpen(true);

      // 포트폴리오/자기소개서는 API에서 메시지를 받아오므로 로컬 안내 메시지 제거
      // 다른 기능들은 필요시 preparation message 표시 가능
      if (!isAssistantFeature(feature)) {
        const preparationMessage = createFeaturePreparationMessage({
          feature,
          projectId: typeof selectedProjectId === 'number' ? selectedProjectId : 0,
        });

        if (preparationMessage) {
          setMessages((previous) => [...previous, preparationMessage]);
        }
      }
    },
    [projects.length, selectedProjectId, setMessages],
  );

  const toggleProjectSelection = useCallback((projectId: number | string) => {
    setSelectedProjectsForFeature((previous) => {
      if (previous.includes(projectId)) {
        return previous.filter((id) => id !== projectId);
      }

      if (previous.length >= MAX_FEATURE_PROJECT_SELECTION) {
        toast.error(`최대 ${MAX_FEATURE_PROJECT_SELECTION}개까지 선택 가능합니다`);
        return previous;
      }

      return [...previous, projectId];
    });
  }, []);

  const closeProjectSelectDialog = useCallback(() => {
    setProjectSelectDialogOpen(false);
    setSelectedProjectsForFeature([]);
  }, []);

  const confirmFeature = useCallback(async () => {
    if (selectedProjectsForFeature.length === 0) {
      toast.error('최소 1개의 프로젝트를 선택해주세요');
      return;
    }

    setProjectSelectDialogOpen(false);
    setIsGenerating(true);

    // 포트폴리오/자기소개서 기능인 경우 실제 API 호출
    if (isAssistantFeature(selectedFeature)) {
      const purpose = featureToPurpose(selectedFeature);
      if (!purpose) {
        toast.error('지원하지 않는 기능입니다.');
        setIsGenerating(false);
        return;
      }

      try {
        const response = await invokeCareerAssistantStart({
          project_ids: selectedProjectsForFeature,
          purpose,
          state: 'start',
        });

        const aiMessage: AssistantMessage = {
          id: `assistant-start-${Date.now()}`,
          projectId: selectedProjectsForFeature[0] ?? 0,
          role: 'ai',
          content: response.message,
          timestamp: new Date(),
          url: response.url,
          filename: response.filename,
        };

        setMessages((previous) => [...previous, aiMessage]);
        setIsAssistantMode(true);
        toast.success(`${selectedFeature} 대화를 시작했습니다!`);
      } catch (error) {
        console.error('[useAIFeature] API 호출 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        toast.error(`시작 실패: ${errorMessage}`);
      } finally {
        setIsGenerating(false);
        setSelectedProjectsForFeature([]);
      }
      return;
    }

    // 기존 로직: 다른 기능들은 로컬에서 처리
    setTimeout(() => {
      const selectedProjects = projects.filter((project) => selectedProjectsForFeature.includes(project.id));
      const aiResponse = createFeatureResultContent({
        feature: selectedFeature,
        projects: selectedProjects,
        userRole,
      });

      const aiMessage = createFeatureResultMessage(
        typeof selectedProjectId === 'number' ? selectedProjectId : 0,
        aiResponse,
      );

      setMessages((previous) => [...previous, aiMessage]);
      setIsGenerating(false);
      toast.success(`${selectedFeature} 완료!`);
      setSelectedProjectsForFeature([]);
    }, 2000);
  }, [
    projects,
    selectedProjectsForFeature,
    selectedFeature,
    selectedProjectId,
    setIsGenerating,
    setMessages,
    userRole,
  ]);

  return {
    selectedFeature,
    projectSelectDialogOpen,
    selectedProjectsForFeature,
    maxSelectable: MAX_FEATURE_PROJECT_SELECTION,
    openFeature,
    toggleProjectSelection,
    confirmFeature,
    closeProjectSelectDialog,
    isAssistantMode,
  };
}

