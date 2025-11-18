import { MouseEvent } from 'react';

import type { Project } from '@/entities/project';

import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/shadcn/card';
import { Badge } from '@/shared/ui/shadcn/badge';

import { Download, Edit2, Plus, Trash2, Upload } from 'lucide-react';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: number | string | null;
  onOpenUploadDialog: () => void;
  onOpenLoadDialog: () => void;
  onDeleteProject: (id: number | string) => void;
  onEditProject: (project: Project) => void;
  onViewProjectDetail: (project: Project) => void;
}

const MAX_RECENT_PROJECTS = 5;

export function ProjectSidebar({
  projects,
  selectedProjectId,
  onOpenUploadDialog,
  onOpenLoadDialog,
  onDeleteProject,
  onEditProject,
  onViewProjectDetail,
}: ProjectSidebarProps) {
  if (projects.length === 0) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            프로젝트
          </h2>
        </div>
        <div className="space-y-2">
          <Button
            onClick={onOpenUploadDialog}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            프로젝트 등록
          </Button>
          <Button onClick={onOpenLoadDialog} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            프로젝트 불러오기
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 overflow-y-auto min-h-0">
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">아직 프로젝트가 없습니다</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">프로젝트를 추가해보세요</p>
        </div>
      </div>
    );
  }

  const displayProjects = buildDisplayProjects(projects, selectedProjectId);

  return (
    <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            프로젝트
          </h2>
        </div>
        <div className="space-y-2">
          <Button
            onClick={onOpenUploadDialog}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            프로젝트 등록
          </Button>
          <Button onClick={onOpenLoadDialog} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            프로젝트 불러오기
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin-translucent min-h-0">
        {displayProjects.map((project) => {
          const Icon = project.icon;
          const isSelected = selectedProjectId === project.id;

          return (
            <Card
              key={project.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md group relative ${
                isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => onViewProjectDetail(project)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onDeleteProject(project.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-gray-900 dark:text-white mb-1 truncate pr-8">{project.title}</h3>
                  <Badge variant="outline" className="text-xs mb-2">
                    {project.category}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onEditProject(project);
                }}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                편집
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const buildDisplayProjects = (projects: Project[], selectedProjectId: number | string | null) => {
  if (!projects.length) return [];

  if (!selectedProjectId) {
    return projects.slice(0, MAX_RECENT_PROJECTS);
  }

  const selected = projects.find((project) => project.id === selectedProjectId);

  if (!selected) {
    return projects.slice(0, MAX_RECENT_PROJECTS);
  }

  const otherProjects = projects.filter((project) => project.id !== selectedProjectId).slice(0, 4);
  return [selected, ...otherProjects];
};


