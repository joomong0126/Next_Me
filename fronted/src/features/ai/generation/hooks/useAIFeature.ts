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
  confirmFeature: () => void;
  closeProjectSelectDialog: () => void;
}

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

  const openFeature = useCallback(
    (feature: string) => {
      if (projects.length === 0) {
        toast.error('프로젝트를 먼저 추가해주세요');
        return;
      }

      setSelectedFeature(feature);
      setSelectedProjectsForFeature([]);
      setProjectSelectDialogOpen(true);

      const preparationMessage = createFeaturePreparationMessage({
        feature,
        projectId: selectedProjectId ?? 0,
      });

      if (preparationMessage) {
        setMessages((previous) => [...previous, preparationMessage]);
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

  const confirmFeature = useCallback(() => {
    if (selectedProjectsForFeature.length === 0) {
      toast.error('최소 1개의 프로젝트를 선택해주세요');
      return;
    }

    setProjectSelectDialogOpen(false);
    setIsGenerating(true);

    setTimeout(() => {
      const selectedProjects = projects.filter((project) => selectedProjectsForFeature.includes(project.id));
      const aiResponse = createFeatureResultContent({
        feature: selectedFeature,
        projects: selectedProjects,
        userRole,
      });

      const aiMessage = createFeatureResultMessage(selectedProjectId ?? 0, aiResponse);

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
  };
}

