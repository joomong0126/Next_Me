import type { Project } from '@/entities/project';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';

import { Edit2, ExternalLink } from 'lucide-react';

interface ProjectDetailDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

export function ProjectDetailDialog({ open, project, onClose, onEdit }: ProjectDetailDialogProps) {
  if (!project) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>프로젝트 상세 정보</DialogTitle>
          <DialogDescription>저장된 프로젝트 정보를 확인하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
              <project.icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 dark:text-white mb-2">{project.title}</h3>
              <Badge variant="outline" className="mb-2">
                {project.category}
              </Badge>
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {project.period && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">프로젝트 기간</label>
                <p className="text-sm text-gray-900 dark:text-white">{project.period}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">요약</label>
              <p className="text-sm text-gray-900 dark:text-white">{project.summary}</p>
            </div>

            {project.role && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">내 역할</label>
                <p className="text-sm text-gray-900 dark:text-white">{project.role}</p>
              </div>
            )}

            {project.achievements && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">주요 성과</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{project.achievements}</p>
              </div>
            )}

            {project.tools && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">사용 기술/도구</label>
                <p className="text-sm text-gray-900 dark:text-white">{project.tools}</p>
              </div>
            )}

            {project.description && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">상세 설명</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{project.description}</p>
              </div>
            )}

            {project.sourceUrl && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">원본 링크</label>
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {project.sourceUrl}
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(project);
              }}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              편집
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


