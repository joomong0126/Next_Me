import { Card } from '@/shared/ui/shadcn/card';
import { Lightbulb, User, FileText, Building2, BarChart3, TrendingUp, Target } from 'lucide-react';

interface CareerFeatureCardsProps {
  onSelectFeature: (feature: string) => void;
  onSelectBasicInfo?: () => void;
}

const FEATURES = [
  {
    id: 'basic-info',
    title: '내 기본정보',
    description: '프로필 정보구나 기능별 활용합니다',
    icon: User,
    gradient: 'from-purple-500 to-purple-600',
    color: 'purple',
    requiresProject: false,
  },
  {
    id: 'portfolio',
    title: '포트폴리오 작성',
    description: '프로젝트 경험을 프레젠테이션 문장으로 작성',
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600',
    color: 'blue',
    requiresProject: true,
  },
  {
    id: 'resume',
    title: '자기소개서 작성',
    description: '프로필 정보와 프로젝트를 활용한 맞춤 작성',
    icon: Building2,
    gradient: 'from-red-500 to-red-600',
    color: 'red',
    requiresProject: true,
  },
  {
    id: 'competency',
    title: '역량 분석',
    description: '프로젝트를 분석하여 전략 역량 정량 파악',
    icon: BarChart3,
    gradient: 'from-orange-500 to-orange-600',
    color: 'orange',
    requiresProject: true,
  },
  {
    id: 'final-individual',
    title: '최종 개인',
    description: '당신 자기는 커리어 방향성 파악, 프로젝트 파악',
    icon: TrendingUp,
    gradient: 'from-green-500 to-green-600',
    color: 'green',
    requiresProject: true,
  },
  {
    id: 'job-suggestion',
    title: '목표 직무 제안',
    description: '당신과 역량을 비교분석 및 적합한 직무 추천',
    icon: Target,
    gradient: 'from-red-500 to-pink-600',
    color: 'red',
    requiresProject: true,
  },
] as const;

export function CareerFeatureCards({ onSelectFeature, onSelectBasicInfo }: CareerFeatureCardsProps) {
  const handleFeatureClick = (feature: typeof FEATURES[number]) => {
    if (feature.id === 'basic-info' && onSelectBasicInfo) {
      onSelectBasicInfo();
    } else {
      onSelectFeature(feature.title);
    }
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      {/* Header with info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              최대 3개 프로젝트 선택 가능
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Settings 프로젝트 정보 통합
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="space-y-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              className="p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-gray-200 dark:border-gray-700"
              onClick={() => handleFeatureClick(feature)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

