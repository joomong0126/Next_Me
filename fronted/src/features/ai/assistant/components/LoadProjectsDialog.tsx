import type { Project } from '@/entities/project';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/shadcn/card';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';

import { Download, Upload } from 'lucide-react';

import { MARKETING_CATEGORIES, DEVELOPMENT_CATEGORIES } from '../constants';

interface LoadProjectsDialogProps {
  open: boolean;
  projects: Project[];
  selectedProjectIds: number[];
  onToggleProject: (projectId: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  maxSelectable?: number;
}

export function LoadProjectsDialog({
  open,
  projects,
  selectedProjectIds,
  onToggleProject,
  onClose,
  onConfirm,
  maxSelectable = 5,
}: LoadProjectsDialogProps) {
  const marketingProjects = projects.filter((project) => MARKETING_CATEGORIES.includes(project.category));
  const developmentProjects = projects.filter((project) => DEVELOPMENT_CATEGORIES.includes(project.category));

  const tabs = [
    { value: 'all', label: `전체 (${projects.length})`, projects },
    { value: 'marketing', label: `마케팅 (${marketingProjects.length})`, projects: marketingProjects },
    { value: 'development', label: `개발 (${developmentProjects.length})`, projects: developmentProjects },
  ];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent 
        data-no-drag 
        className="sm:max-w-[700px] flex flex-col"
        style={{
          maxHeight: '70vh',
        }}
      >
        <DialogHeader>
          <DialogTitle>프로젝트 불러오기</DialogTitle>
          <DialogDescription>Nexter에서 대화할 프로젝트를 선택하세요 (최대 {maxSelectable}개)</DialogDescription>
        </DialogHeader>

        {selectedProjectIds.length > 0 && (
          <div className="px-1 py-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProjectIds.length}개 선택됨</p>
          </div>
        )}

        <div className="overflow-y-auto flex-1 min-h-0">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">저장된 프로젝트가 없습니다</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">먼저 프로젝트를 추가해주세요</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-4">
                  {tab.projects.length === 0 ? (
                    <EmptyState variant={tab.value} />
                  ) : (
                    tab.projects.map((project) => {
                      const Icon = project.icon;
                      const isSelected = selectedProjectIds.includes(project.id);

                      return (
                        <Card
                          key={project.id}
                          className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => onToggleProject(project.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onToggleProject(project.id)}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm text-gray-900 dark:text-white mb-1">{project.title}</h4>
                              <Badge variant="outline" className="text-xs mb-2">
                                {project.category}
                              </Badge>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {project.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {project.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{project.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{project.summary}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onConfirm} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={selectedProjectIds.length === 0}>
            불러오기 ({selectedProjectIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EmptyState = ({ variant }: { variant: string }) => {
  if (variant === 'marketing') {
    return (
      <div className="text-center py-12">
        <Download className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">마케팅 프로젝트가 없습니다</p>
      </div>
    );
  }

  if (variant === 'development') {
    return (
      <div className="text-center py-12">
        <Download className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">개발 프로젝트가 없습니다</p>
      </div>
    );
  }

  return null;
};


