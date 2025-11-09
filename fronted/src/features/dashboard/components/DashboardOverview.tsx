import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Progress } from '@/shared/ui/shadcn/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { ArrowRight, Sparkles, BookOpen, TrendingUp, Clock, Zap, X, Calendar, Target, Users, Award } from 'lucide-react';
import { ImageWithFallback } from '@/shared/ui/custom';

const recentProjects = [
  {
    id: 1,
    title: '신규 브랜드 런칭 캠페인',
    category: '마케팅',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    insight: '캠페인 전략 수립과 실행력이 돋보입니다',
    progress: 100,
    description: '새로운 브랜드의 런칭을 위한 종합 마케팅 캠페인을 기획하고 실행했습니다.',
    period: '2024.01 - 2024.03',
    role: '캠페인 매니저',
    team: '마케팅팀 (5명)',
    achievements: [
      '타겟 고객 도달률 120% 달성',
      '브랜드 인지도 35% 향상',
      '소셜 미디어 참여율 50% 증가'
    ],
    skills: ['캠페인 기획', '인플루언서 관리', 'SNS 마케팅', '데이터 분석'],
    details: '인플루언서 협업, 콘텐츠 제작, SNS 광고 집행 등 통합 마케팅 활동을 주도하여 성공적인 브랜드 런칭을 이끌었습니다.'
  },
  {
    id: 2,
    title: 'SNS 콘텐츠 전략 개선',
    category: '콘텐츠',
    thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
    insight: '데이터 기반 콘텐츠 최적화 역량 향상',
    progress: 85,
    description: 'Instagram과 Facebook의 콘텐츠 전략을 데이터 분석을 통해 개선하고 최적화했습니다.',
    period: '2024.04 - 진행중',
    role: '콘텐츠 전략가',
    team: '콘텐츠팀 (3명)',
    achievements: [
      '참여율 35% 향상',
      '팔로워 증가율 2배 달성',
      '콘텐츠 도달률 40% 개선'
    ],
    skills: ['콘텐츠 기획', '데이터 분석', 'A/B 테스팅', 'Google Analytics'],
    details: 'Google Analytics와 소셜 미디어 인사이트를 활용하여 콘텐츠 전략을 수립하고, A/B 테스팅을 통해 최적의 콘텐츠 포맷을 발견했습니다.'
  },
];

const skills = [
  { name: '캠페인 기획', current: 85, target: 90 },
  { name: '데이터 분석', current: 70, target: 85 },
  { name: '콘텐츠 관리', current: 80, target: 90 },
];

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardOverview({ onNavigate }: DashboardPageProps) {
  const [selectedProject, setSelectedProject] = useState<typeof recentProjects[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleProjectClick = (project: typeof recentProjects[0]) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header - Enhanced */}
      <div className="relative overflow-hidden bg-gray-900 dark:bg-gray-950 rounded-2xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-blue-100 font-medium">안녕하세요</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">예진님, 오늘도 성장하는 하루 되세요! 🚀</h1>
          <p className="text-blue-100 text-lg">최근 활동과 AI 추천을 확인하고 커리어 목표에 한 걸음 더 다가가보세요</p>
          <div className="flex gap-3 mt-6">
            <Button 
              className="bg-white hover:bg-blue-50 text-gray-900 rounded-lg shadow-lg font-medium"
              onClick={() => onNavigate?.('projects')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              프로젝트 관리
            </Button>
            <Button 
              variant="outline" 
              className="border-white/80 text-white hover:bg-white/20 rounded-lg backdrop-blur-sm shadow-lg hover:shadow-xl transition-all bg-white/10 font-semibold"
              onClick={() => onNavigate?.('goals')}
            >
              <Target className="w-4 h-4 mr-2" />
              목표 관리
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Projects */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-2xl shadow-lg border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white text-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gray-900 dark:text-white" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400 mt-1">최근 작업한 프로젝트를 확인하세요</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => onNavigate?.('projects')}
                >
                  전체 보기 →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="flex gap-5">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-28 h-28 rounded-lg object-cover shadow-md"
                      />
                      <div className="absolute top-2 right-2 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                        <Sparkles className="w-3 h-3 text-gray-900 dark:text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">{project.title}</h4>
                          <Badge variant="secondary" className="rounded-lg bg-accent text-accent-foreground border-0 font-medium">
                            {project.category}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-900 dark:text-white" />
                        <span>{project.insight}</span>
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">완료율</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{project.progress}%</span>
                        </div>
                        <div className="relative h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Graph - Enhanced */}
          <Card className="rounded-3xl shadow-lg border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="dark:text-white text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                My Progress Graph
              </CardTitle>
              <CardDescription className="dark:text-gray-400 mt-1">목표 직무 대비 현재 역량</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {skills.map((skill) => {
                const percentage = (skill.current / skill.target) * 100;
                return (
                  <div key={skill.name} className="group">
                    <div className="flex justify-between mb-3">
                      <span className="text-gray-900 dark:text-white font-medium text-lg">{skill.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          현재 {skill.current}%
                        </span>
                        <span className="text-primary font-semibold">
                          목표 {skill.target}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      <div className="relative h-full">
                        {/* 목표선 표시 */}
                        <div 
                          className="absolute h-full w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
                          style={{ left: `${skill.target}%` }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                        </div>
                        {/* 현재 진행도 */}
                        <div
                          className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-700 shadow-lg group-hover:shadow-xl"
                          style={{ 
                            width: `${skill.current}%`,
                            opacity: percentage >= 95 ? 1 : percentage >= 80 ? 0.9 : 0.7
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {skill.target - skill.current > 0 && (
                        <span>목표까지 +{skill.target - skill.current}% 필요</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* AI Recommendation - Enhanced */}
          <Card className="rounded-3xl shadow-lg border-0 overflow-hidden bg-gray-900 dark:bg-gray-950">
            <CardHeader className="border-b border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-white text-xl">AI 추천 포커스</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 mb-4 shadow-xl">
                <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gray-900 dark:text-white" />
                  데이터 기반 마케팅 분석
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  다음 프로젝트에서 Google Analytics를 활용한 데이터 분석을 추가하면 역량이 15% 향상될 것으로 예상됩니다.
                </p>
                <Button 
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all hover:bg-gray-800 dark:hover:bg-gray-100"
                  onClick={() => onNavigate?.('assistant')}
                >
                  자세히 보기
                </Button>
              </div>
              <div className="text-center text-white/80 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                마지막 업데이트: 방금 전
              </div>
            </CardContent>
          </Card>

          {/* Learning Resources - Enhanced */}
          <Card className="rounded-2xl shadow-lg border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white text-xl">추천 학습 리소스</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {[
                { title: 'Google Analytics 실전 코스', desc: '데이터 분석 기초부터 실전까지', url: 'https://analytics.google.com/analytics/academy/' },
                { title: '마케팅 캠페인 전략', desc: '성공적인 캠페인 기획 방법', url: 'https://www.coursera.org/courses?query=marketing%20campaign' },
                { title: '소셜 미디어 트렌드 2024', desc: '최신 SNS 마케팅 전략', url: 'https://www.hubspot.com/marketing-statistics' },
              ].map((resource, index) => (
                <div
                  key={index}
                  onClick={() => window.open(resource.url, '_blank')}
                  className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-accent transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition-colors">
                      <BookOpen className="w-4 h-4 text-gray-900 dark:text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-white font-medium mb-1">{resource.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{resource.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats - Enhanced */}
          <Card className="rounded-2xl shadow-lg border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  {[
                    { label: '총 프로젝트', value: '12', color: 'from-blue-500 to-blue-600' },
                    { label: '보유 스킬', value: '8', color: 'from-purple-500 to-purple-600' },
                    { label: '달성 목표', value: '3', color: 'from-green-500 to-green-600' },
                    { label: '평균 진행률', value: '85%', color: 'from-orange-500 to-orange-600' },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                      <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform`}>
                        {stat.value}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProject.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedProject.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Project Image */}
                <div className="relative rounded-xl overflow-hidden">
                  <ImageWithFallback
                    src={selectedProject.thumbnail}
                    alt={selectedProject.title}
                    className="w-full h-64 object-cover"
                  />
                  <Badge className="absolute top-4 right-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                    {selectedProject.category}
                  </Badge>
                </div>

                {/* Project Info Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-900 dark:text-white" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">기간</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedProject.period}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-gray-900 dark:text-white" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">역할</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedProject.role}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-900 dark:text-white" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">팀</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedProject.team}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-900 dark:text-white font-medium">프로젝트 진행률</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{selectedProject.progress}%</span>
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-500"
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-3">프로젝트 상세</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedProject.details}
                  </p>
                </div>

                {/* Achievements */}
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    주요 성과
                  </h4>
                  <ul className="space-y-2">
                    {selectedProject.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white mt-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-3">활용 스킬</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* AI Insight */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium mb-1">AI 인사이트</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedProject.insight}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}