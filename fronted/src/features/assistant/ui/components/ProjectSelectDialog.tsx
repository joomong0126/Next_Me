import type { Project } from '@/entities/project';

import { MouseEvent, useMemo } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/shadcn/card';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';

import { Check, Code, Megaphone } from 'lucide-react';

import {
  DEVELOPMENT_CATEGORIES,
  MARKETING_CATEGORIES,
  type DevelopmentCategory,
  type MarketingCategory,
} from '../constants';

interface ProjectSelectDialogProps {
  open: boolean;
  featureName: string;
  projects: Project[];
  selectedProjectIds: number[];
  onToggleProject: (projectId: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  maxSelectable?: number;
}

export function ProjectSelectDialog({
  open,
  featureName,
  projects,
  selectedProjectIds,
  onToggleProject,
  onConfirm,
  onClose,
  maxSelectable = 3,
}: ProjectSelectDialogProps) {
  const { marketingProjects, developmentProjects } = useMemo(() => {
    const marketing = projects.filter((project) =>
      MARKETING_CATEGORIES.includes(project.category as MarketingCategory),
    );
    const development = projects.filter((project) =>
      DEVELOPMENT_CATEGORIES.includes(project.category as DevelopmentCategory),
    );
    return { marketingProjects: marketing, developmentProjects: development };
  }, [projects]);

  const tabs = [
    { value: 'all', label: `전체 (${projects.length})`, projects },
    { value: 'marketing', label: `마케팅 (${marketingProjects.length})`, projects: marketingProjects },
    { value: 'development', label: `개발 (${developmentProjects.length})`, projects: developmentProjects },
  ];

  return (
    <Dialog open={open} onOpenChange={(nextOpen: boolean) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{featureName}</DialogTitle>
          <DialogDescription>분석할 프로젝트를 선택하세요 (최대 {maxSelectable}개)</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
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
                            onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                          />
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm text-gray-900 dark:text-white">{project.title}</h4>
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                            </div>
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
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button onClick={onConfirm} className="flex-1" disabled={selectedProjectIds.length === 0}>
            실행 ({selectedProjectIds.length}/{maxSelectable})
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
        <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">마케팅 프로젝트가 없습니다</p>
      </div>
    );
  }

  if (variant === 'development') {
    return (
      <div className="text-center py-12">
        <Code className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">개발 프로젝트가 없습니다</p>
      </div>
    );
  }

  return null;
};


