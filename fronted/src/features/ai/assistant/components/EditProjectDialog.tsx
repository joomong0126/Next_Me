import { useEffect, useMemo, useState } from 'react';

import type { Project } from '@/entities/project';

import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Textarea } from '@/shared/ui/shadcn/textarea';

import { Bot, CalendarIcon } from 'lucide-react';

import { YearMonthPicker } from '@/shared/ui/custom';
import { formatDate } from '../utils/date';

interface EditProjectDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (projectId: number | string, data: EditProjectFormValues) => void | Promise<void>;
  availableCategories: string[];
  onOrganizeWithAI: (project: Project) => void | Promise<void>;
}

export interface EditProjectFormValues {
  title: string;
  category: string;
  tags: string;
  summary: string;
  period: string;
  role: string;
  achievements: string;
  tools: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
}

const DEFAULT_FORM_VALUES: EditProjectFormValues = {
  title: '',
  category: '',
  tags: '',
  summary: '',
  period: '',
  role: '',
  achievements: '',
  tools: '',
  description: '',
  startDate: undefined,
  endDate: undefined,
};

export function EditProjectDialog({
  open,
  project,
  onClose,
  onSave,
  availableCategories,
  onOrganizeWithAI,
}: EditProjectDialogProps) {
  const [formValues, setFormValues] = useState<EditProjectFormValues>(DEFAULT_FORM_VALUES);

  useEffect(() => {
    if (!project) {
      setFormValues(DEFAULT_FORM_VALUES);
      return;
    }

    setFormValues({
      title: project.title ?? '',
      category: project.category ?? '',
      tags: project.tags?.join(', ') ?? '',
      summary: project.summary ?? '',
      period: project.period ?? '',
      role: project.role ?? '',
      achievements: project.achievements ?? '',
      tools: project.tools ?? '',
      description: project.description ?? '',
      startDate: project.startDate,
      endDate: project.endDate,
    });
  }, [project]);

  const resolvedCategories = useMemo(() => (availableCategories.length ? availableCategories : ['기타']), [availableCategories]);

  const handleChange = <Key extends keyof EditProjectFormValues>(key: Key, value: EditProjectFormValues[Key]) => {
    setFormValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!project) return;
    await onSave(project.id, formValues);
  };

  if (!project) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextState) => !nextState && onClose()}>
      <DialogContent 
        data-no-drag
        className="flex flex-col scrollbar-transparent edit-project-dialog"
        style={{
          maxWidth: '600px',
          maxHeight: '70vh',
          padding: '24px',
          borderRadius: '16px',
        }}
      >
        <DialogHeader>
          <DialogTitle>프로젝트 편집</DialogTitle>
          <DialogDescription>프로젝트 정보를 수정하세요</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-transparent pr-2 -mr-2">
          <div className="space-y-4 py-4">
          <div>
            <label className="text-base font-semibold text-primary mb-2 block">프로젝트 제목</label>
            <Input value={formValues.title} onChange={(event) => handleChange('title', event.target.value)} placeholder="프로젝트 제목" />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">카테고리</label>
            <Select value={formValues.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {resolvedCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">태그 (쉼표로 구분)</label>
            <Input
              value={formValues.tags}
              onChange={(event) => handleChange('tags', event.target.value)}
              placeholder="예: React, TypeScript, 디자인"
            />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">요약</label>
            <Textarea value={formValues.summary} onChange={(event) => handleChange('summary', event.target.value)} placeholder="프로젝트 요약" rows={3} />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">내 역할</label>
            <Input value={formValues.role} onChange={(event) => handleChange('role', event.target.value)} placeholder="예: 프론트엔드 개발, 팀 리더" />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">주요 성과</label>
            <Textarea
              value={formValues.achievements}
              onChange={(event) => handleChange('achievements', event.target.value)}
              placeholder="프로젝트에서 달성한 주요 성과를 작성하세요"
              rows={3}
            />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">사용 기술/도구</label>
            <Input value={formValues.tools} onChange={(event) => handleChange('tools', event.target.value)} placeholder="예: React, Figma, Google Analytics" />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">상세 설명</label>
            <Textarea
              value={formValues.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="프로젝트에 대한 상세 설명"
              rows={4}
            />
          </div>

          <div>
            <label className="text-base font-semibold text-primary mb-2 block">프로젝트 기간</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">시작일</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formValues.startDate ? formatDate(formValues.startDate) : '선택'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <YearMonthPicker date={formValues.startDate} onDateChange={(date) => handleChange('startDate', date)} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">종료일</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formValues.endDate ? formatDate(formValues.endDate) : '진행중'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <YearMonthPicker date={formValues.endDate} onDateChange={(date) => handleChange('endDate', date)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 pb-0 bg-background border-t border-border/50 -mx-6 px-6 mt-4">
          <Button
            variant="outline"
            className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 mb-3"
            onClick={() => void onOrganizeWithAI(project)}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI와 대화를 통해 프로젝트 정리하기
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


