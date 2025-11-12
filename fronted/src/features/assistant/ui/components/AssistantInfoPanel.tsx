import type { Project } from '@/entities/project';
import type { UserProfile } from '../types';

import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card } from '@/shared/ui/shadcn/card';

import { BarChart3, Briefcase, Edit2, ExternalLink, FileText, MessageSquare, Sparkles, TrendingUp, User } from 'lucide-react';

interface AssistantInfoPanelProps {
  userProfile: UserProfile;
  suggestedPrompts: string[];
  onSelectPrompt: (prompt: string) => void;
  onSelectFeature: (feature: string) => void;
  selectedProject: Project | null;
}

const FEATURE_BUTTONS = [
  { icon: FileText, label: '포트폴리오 작성', gradient: 'from-blue-500 to-cyan-500' },
  { icon: MessageSquare, label: '자기소개서 작성', gradient: 'from-purple-500 to-pink-500' },
  { icon: BarChart3, label: '역량 분석', gradient: 'from-orange-500 to-red-500' },
  { icon: TrendingUp, label: '학습 계획', gradient: 'from-green-500 to-emerald-500' },
  { icon: Briefcase, label: '목표 직무 제안', gradient: 'from-pink-500 to-rose-500' },
] as const;

export function AssistantInfoPanel({
  userProfile,
  suggestedPrompts,
  onSelectPrompt,
  onSelectFeature,
  selectedProject,
}: AssistantInfoPanelProps) {
  const handleEditProfile = () => {
    window.location.hash = '#settings';
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      <div className="mb-8">
        <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          내 기본정보
        </h3>
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">이름</label>
              <p className="text-sm text-gray-900 dark:text-white">{userProfile.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">현재 상태</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {userProfile.currentStatus.length > 0 ? userProfile.currentStatus.join(', ') : '설정되지 않음'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">목표 직무</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {userProfile.targetRoles.length > 0 ? userProfile.targetRoles.join(', ') : '설정되지 않음'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleEditProfile}>
              <Edit2 className="w-3 h-3 mr-1" />
              정보 수정
            </Button>
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          AI 기능
        </h3>
        <div className="space-y-2">
          {FEATURE_BUTTONS.map((feature) => (
            <Button
              key={feature.label}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => onSelectFeature(feature.label)}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                <feature.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm">{feature.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm text-gray-900 dark:text-white mb-4">추천 질문</h3>
        <div className="space-y-2">
          {suggestedPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-3"
              onClick={() => onSelectPrompt(prompt)}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{prompt}</span>
            </Button>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div>
          <h3 className="text-sm text-gray-900 dark:text-white mb-4">선택된 프로젝트</h3>
          <Card className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedProject.gradient} flex items-center justify-center flex-shrink-0`}>
                <selectedProject.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-gray-900 dark:text-white mb-1">{selectedProject.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {selectedProject.category}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {selectedProject.period && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">기간:</span>
                  <span className="text-gray-900 dark:text-white ml-2">{selectedProject.period}</span>
                </div>
              )}
              {selectedProject.role && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">역할:</span>
                  <span className="text-gray-900 dark:text-white ml-2">{selectedProject.role}</span>
                </div>
              )}
              {selectedProject.sourceUrl && (
                <div>
                  <a
                    href={selectedProject.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    원본 보기
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


