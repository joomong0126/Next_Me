import { ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from 'react';

import type { Project } from '@/entities/project';
import { getCategoryIcon } from '@/entities/project/lib/categoryIcons';

import { Card } from '@/shared/ui/shadcn/card';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AssistantInfoPanel } from './components/AssistantInfoPanel';
import { ChatPanel, useAssistantChat } from '@/features/ai/chat';
import { EditProjectDialog, EditProjectFormValues } from './components/EditProjectDialog';
import { LoadProjectsDialog } from './components/LoadProjectsDialog';
import { ProjectDetailDialog } from './components/ProjectDetailDialog';
import { ProjectSelectDialog } from './components/ProjectSelectDialog';
import { ProjectSidebar } from './components/ProjectSidebar';
import { UploadProjectDialog } from './components/UploadProjectDialog';
import { DEFAULT_SUGGESTED_PROMPTS, DEVELOPMENT_CATEGORIES, MARKETING_CATEGORIES } from './constants';
import { useAIFeature } from '@/features/ai/generation/hooks/useAIFeature';
import { useAssistantUserProfile } from '@/features/ai/generation/hooks/useAssistantUserProfile';
import {
  processWithRealService,
  processWithMockService,
  type UploadRequestPayload,
} from './api/assistant';
import type { AIGeneratedData } from './types';

export interface AIAssistantProps {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  userRole: string;
  welcomeMessage?: string;
  showProjectSidebar?: boolean;
  showInfoPanel?: boolean;
}

export function AIAssistant({
  projects,
  setProjects,
  userRole,
  welcomeMessage,
  showProjectSidebar = true,
  showInfoPanel = true,
}: AIAssistantProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [loadProjectDialogOpen, setLoadProjectDialogOpen] = useState(false);
  const [selectedProjectsToLoad, setSelectedProjectsToLoad] = useState<number[]>([]);

  const userProfile = useAssistantUserProfile();

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const {
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
  } = useAssistantChat({
    projects,
    selectedProject,
    selectedProjectId,
    userRole,
    setSelectedProjectId,
    setProjects,
    setProjectToEdit,
    setIsEditDialogOpen,
    welcomeMessage,
  });

  const handleContinueOrganizing = () => {
    if (!selectedProject) {
      toast.error('프로젝트를 선택한 후 계속 진행해 주세요.');
      return;
    }

    void handleOrganizeWithAI(selectedProject);
  };

  const handleChatFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleFileUpload(file);
    event.target.value = '';
  };

  const startAnalysis = (input: UploadRequestPayload) => {
    setIsAnalyzing(true);
    setIsUploadDialogOpen(false);

  // TODO(supabase): 실제 배포 시 VITE_USE_MOCK 값을 'false'로 설정해 processWithRealService만 사용하도록 합니다.
    const processor = import.meta.env.VITE_USE_MOCK === 'true' ? processWithMockService : processWithRealService;

    void processor(input, userRole)
      .then((generatedData) => {
        createProjectFromAI(generatedData);
      })
      .catch((error) => {
        console.error(error);
        const fallbackMessage = 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        if (error instanceof Error && error.message && !error.message.startsWith('MOCK_')) {
          toast.error(`${fallbackMessage}\n(${error.message})`);
        } else {
          toast.error(fallbackMessage);
        }
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  };

  const handleFileUpload = (file: File) => {
    if (!file) {
      toast.error('업로드할 파일을 찾을 수 없습니다.');
      return;
    }

    startAnalysis({
      kind: 'file',
      file,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  };

  const handleLinkUpload = (url: string) => {
    if (!url.trim()) {
      toast.error('링크를 입력해주세요');
      return;
    }

    const normalizedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    try {
      // Throws for invalid URLs
      new URL(normalizedUrl);
    } catch {
      toast.error('유효한 URL을 입력해주세요');
      return;
    }

    startAnalysis({ kind: 'link', url: normalizedUrl });
  };

  const handleTextUpload = ({ title, content }: { title: string; content: string }) => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }

    startAnalysis({
      kind: 'text',
      title: title.trim(),
      content: content.trim(),
    });
  };

  const createProjectFromAI = (data: AIGeneratedData) => {
    const { icon, gradient } = getCategoryIcon(data.category);

    // 날짜 문자열을 Date 객체로 변환
    const parseDate = (dateValue: string | Date | undefined): Date | undefined => {
      if (!dateValue) return undefined;
      if (dateValue instanceof Date) return dateValue;
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const newProject: Project = {
      id: Date.now(),
      title: data.title,
      category: data.category,
      tags: data.tags,
      summary: data.summary,
      icon,
      gradient,
      type: data.type,
      sourceUrl: data.sourceUrl,
      // 추가 필드들 포함
      period: data.period,
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
      role: data.role,
      achievements: data.achievements,
      tools: data.tools,
      description: data.description,
    };

    setProjects((previous) => [...previous, newProject]);
    openEditDialog(newProject);
    toast.success('프로젝트가 생성되었습니다! 정보를 수정해주세요.');
  };

  const openEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsEditDialogOpen(true);
  };

  const handleSaveProject = (projectId: number, data: EditProjectFormValues) => {
    const targetProject = projects.find((project) => project.id === projectId);
    if (!targetProject) return;

    const { icon, gradient } = getCategoryIcon(data.category);
    const updatedProject: Project = {
      ...targetProject,
      title: data.title,
      category: data.category,
      tags: data.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      summary: data.summary,
      icon,
      gradient,
      period: data.period,
      role: data.role,
      achievements: data.achievements,
      tools: data.tools,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    setProjects((previous) => previous.map((project) => (project.id === projectId ? updatedProject : project)));
    setProjectToEdit(updatedProject);
    setIsEditDialogOpen(false);
    toast.success('프로젝트가 업데이트되었습니다');
  };

  const handleDeleteProject = (projectId: number) => {
    if (!confirm('정말 이 프로젝트를 삭제하시겠습니까?')) return;

    setProjects((previous) => previous.filter((project) => project.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    toast.success('프로젝트가 삭제되었습니다');
  };

  const handleViewProjectDetail = (project: Project) => {
    setViewingProject(project);
    setDetailDialogOpen(true);
  };

  const {
    selectedFeature,
    projectSelectDialogOpen,
    selectedProjectsForFeature,
    openFeature,
    toggleProjectSelection,
    confirmFeature,
    closeProjectSelectDialog,
    maxSelectable,
  } = useAIFeature({
    projects,
    selectedProjectId,
    userRole,
    setMessages,
    setIsGenerating,
  });

  const availableCategories = useMemo(() => {
    let baseCategories: string[];

    if (['marketing', '마케팅'].includes(userRole)) {
      baseCategories = [...MARKETING_CATEGORIES];
    } else if (['developer', '개발', '프론트엔드 개발', '백엔드 개발'].includes(userRole)) {
      baseCategories = [...DEVELOPMENT_CATEGORIES];
    } else {
      baseCategories = [...MARKETING_CATEGORIES, ...DEVELOPMENT_CATEGORIES];
    }

    const categorySet = new Set(baseCategories);

    const relatedProjects = projectToEdit ? [projectToEdit] : projects;

    relatedProjects.forEach((project) => {
      if (project.category) {
        categorySet.add(project.category);
      }
    });

    return Array.from(categorySet);
  }, [projects, projectToEdit, userRole]);

  const toggleProjectToLoad = (projectId: number) => {
    setSelectedProjectsToLoad((previous) => {
      if (previous.includes(projectId)) {
        return previous.filter((id) => id !== projectId);
      }

      if (previous.length >= 5) {
        toast.error('최대 5개까지 선택 가능합니다');
        return previous;
      }

      return [...previous, projectId];
    });
  };

  const handleLoadSelectedProjects = () => {
    if (selectedProjectsToLoad.length === 0) {
      toast.error('프로젝트를 선택해주세요');
      return;
    }

    setSelectedProjectId(selectedProjectsToLoad[0]);

    const selectedTitles = projects
      .filter((project) => selectedProjectsToLoad.includes(project.id))
      .map((project) => project.title)
      .join(', ');

    toast.success(`${selectedProjectsToLoad.length}개 프로젝트를 선택했습니다: ${selectedTitles}`);
    setLoadProjectDialogOpen(false);
    setSelectedProjectsToLoad([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {showProjectSidebar && (
        <ProjectSidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onOpenUploadDialog={() => setIsUploadDialogOpen(true)}
          onOpenLoadDialog={() => setLoadProjectDialogOpen(true)}
          onDeleteProject={handleDeleteProject}
          onEditProject={openEditDialog}
          onViewProjectDetail={handleViewProjectDetail}
        />
      )}

      <ChatPanel
        messages={messages}
        selectedProject={selectedProject}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSendMessage}
        onFileUpload={handleChatFileUpload}
        isGenerating={isGenerating}
        onSaveProjectOrganizing={handleSaveProjectOrganizing}
        onContinueOrganizing={handleContinueOrganizing}
        onResetChat={handleResetChat}
        onOpenProjectUpload={() => setIsUploadDialogOpen(true)}
      />

      {showInfoPanel && (
        <AssistantInfoPanel
          userProfile={userProfile}
          suggestedPrompts={[...DEFAULT_SUGGESTED_PROMPTS]}
          onSelectPrompt={setInputValue}
          onSelectFeature={openFeature}
          selectedProject={selectedProject}
        />
      )}

      <UploadProjectDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onFileSelected={handleFileUpload}
        onLinkSubmit={handleLinkUpload}
        onTextSubmit={handleTextUpload}
      />

      <EditProjectDialog
          open={isEditDialogOpen}
          project={projectToEdit}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveProject}
          availableCategories={availableCategories}
          onOrganizeWithAI={handleOrganizeWithAI}
        />

      <ProjectSelectDialog
        open={projectSelectDialogOpen}
        featureName={selectedFeature}
        projects={projects}
        selectedProjectIds={selectedProjectsForFeature}
        onToggleProject={toggleProjectSelection}
        onConfirm={confirmFeature}
        onClose={closeProjectSelectDialog}
        maxSelectable={maxSelectable}
      />

      <ProjectDetailDialog
        open={detailDialogOpen}
        project={viewingProject}
        onClose={() => setDetailDialogOpen(false)}
        onEdit={openEditDialog}
      />

      <LoadProjectsDialog
        open={loadProjectDialogOpen}
        projects={projects}
        selectedProjectIds={selectedProjectsToLoad}
        onToggleProject={toggleProjectToLoad}
        onClose={() => {
          setLoadProjectDialogOpen(false);
          setSelectedProjectsToLoad([]);
        }}
        onConfirm={handleLoadSelectedProjects}
      />

      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-gray-900 dark:text-white">AI가 프로젝트를 분석하고 있습니다...</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


