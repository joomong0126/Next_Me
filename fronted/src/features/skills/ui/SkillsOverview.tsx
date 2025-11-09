import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Progress } from '@/shared/ui/shadcn/progress';
import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Brain, TrendingUp, Award, Target, Zap, Plus, Minus } from 'lucide-react';

const achievements = [
  {
    title: '캠페인 마스터',
    description: '5개 이상의 마케팅 캠페인 완료',
    icon: Award,
    unlocked: true,
  },
  {
    title: '데이터 분석가',
    description: '데이터 분석 역량 70% 달성',
    icon: Brain,
    unlocked: true,
  },
  {
    title: '협업의 달인',
    description: '10개 이상의 팀 프로젝트 참여',
    icon: Target,
    unlocked: true,
  },
  {
    title: 'AI 파워 유저',
    description: 'AI 어시스턴트 50회 이상 사용',
    icon: Zap,
    unlocked: false,
  },
];

const insights = [
  {
    title: '가장 빠르게 성장한 스킬',
    skill: 'Google Analytics',
    growth: '+25%',
    period: '최근 3개월',
  },
  {
    title: '가장 많이 사용한 스킬',
    skill: '팀 협업',
    count: 12,
    period: '전체 프로젝트',
  },
  {
    title: '추천 학습 스킬',
    skill: 'SQL',
    reason: '목표 직무 달성을 위해',
  },
];

export interface SkillsOverviewProps {
  onRequestUpload: () => void;
}

export function SkillsOverview({ onRequestUpload }: SkillsOverviewProps) {
  const [skillCategories, setSkillCategories] = useState([
    {
      category: '마케팅',
      skills: [
        { name: '캠페인 기획', level: 85, trend: 'up' as const, projects: 5 },
        { name: '콘텐츠 관리', level: 80, trend: 'up' as const, projects: 4 },
        { name: 'SEO/SEM', level: 65, trend: 'stable' as const, projects: 2 },
        { name: 'A/B 테스팅', level: 60, trend: 'up' as const, projects: 2 },
      ],
    },
    {
      category: '데이터 분석',
      skills: [
        { name: 'Google Analytics', level: 75, trend: 'up' as const, projects: 4 },
        { name: 'Excel 데이터 분석', level: 70, trend: 'stable' as const, projects: 6 },
        { name: 'SQL', level: 55, trend: 'up' as const, projects: 1 },
        { name: '데이터 시각화', level: 65, trend: 'up' as const, projects: 3 },
      ],
    },
    {
      category: '협업 & 커뮤니케이션',
      skills: [
        { name: '프로젝트 관리', level: 85, trend: 'stable' as const, projects: 8 },
        { name: '팀 협업', level: 90, trend: 'up' as const, projects: 12 },
        { name: '프레젠테이션', level: 80, trend: 'stable' as const, projects: 7 },
      ],
    },
  ]);

  const [isAddSkillDialogOpen, setIsAddSkillDialogOpen] = useState(false);
  const [newSkillData, setNewSkillData] = useState({
    name: '',
    category: '',
    level: 50,
    projects: 0,
  });

  const adjustSkillLevel = (categoryIndex: number, skillIndex: number, delta: number) => {
    const newCategories = [...skillCategories];
    const currentLevel = newCategories[categoryIndex].skills[skillIndex].level;
    const newLevel = Math.max(0, Math.min(100, currentLevel + delta));
    newCategories[categoryIndex].skills[skillIndex].level = newLevel;
    setSkillCategories(newCategories);
  };

  const handleAddSkill = () => {
    if (!newSkillData.name || !newSkillData.category) return;

    const newCategories = [...skillCategories];
    const categoryIndex = newCategories.findIndex(c => c.category === newSkillData.category);

    if (categoryIndex !== -1) {
      // 기존 카테고리에 추가
      newCategories[categoryIndex].skills.push({
        name: newSkillData.name,
        level: newSkillData.level,
        trend: 'stable' as const,
        projects: newSkillData.projects,
      });
    } else {
      // 새 카테고리 생성
      newCategories.push({
        category: newSkillData.category,
        skills: [{
          name: newSkillData.name,
          level: newSkillData.level,
          trend: 'stable' as const,
          projects: newSkillData.projects,
        }],
      });
    }

    setSkillCategories(newCategories);
    setIsAddSkillDialogOpen(false);
    setNewSkillData({ name: '', category: '', level: 50, projects: 0 });
  };

  const handleViewGrowthReport = () => {
    // 성장 리포트 페이지로 이동하거나 다이얼로그 표시
    alert('성장 리포트 기능이 준비 중입니다.\n\n최근 3개월간 스킬 성장 추이:\n• Google Analytics: +25%\n• 캠페인 기획: +15%\n• 팀 협업: +10%');
  };

  const handleRequestAIAnalysis = () => {
    onRequestUpload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-gray-900 dark:text-white mb-2">Skills & Insights</h1>
        <p className="text-gray-600 dark:text-gray-400">보유한 역량과 성장 인사이트를 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Categories */}
          {skillCategories.map((category, categoryIndex) => (
            <Card key={category.category} className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">{category.category}</CardTitle>
                <CardDescription className="dark:text-gray-400">{category.skills.length}개 스킬</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white">{skill.name}</span>
                        {skill.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-gray-900 dark:text-white" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0">
                          {skill.projects}개 프로젝트
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => adjustSkillLevel(categoryIndex, skillIndex, -5)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                            {skill.level}%
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => adjustSkillLevel(categoryIndex, skillIndex, 5)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full rounded-full transition-all duration-500 shadow-md ${
                          skill.level >= 80 
                            ? 'bg-gray-900 dark:bg-white' 
                            : skill.level >= 60
                            ? 'bg-gray-700 dark:bg-gray-300'
                            : 'bg-gray-500 dark:bg-gray-500'
                        }`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Insights */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-gray-900 dark:text-white" />
                <CardTitle className="dark:text-white">AI 인사이트</CardTitle>
              </div>
              <CardDescription className="dark:text-gray-400">데이터 기반 역량 분석</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight) => (
                <div key={insight.title} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">{insight.title}</div>
                  <div className="text-gray-900 dark:text-white mb-1 font-medium">
                    {insight.skill}
                  </div>
                  {'growth' in insight && (
                    <div className="text-gray-900 dark:text-white font-semibold">{insight.growth}</div>
                  )}
                  {'count' in insight && (
                    <div className="text-gray-900 dark:text-white font-semibold">{insight.count}회</div>
                  )}
                  {'reason' in insight && (
                    <div className="text-gray-600 dark:text-gray-400 text-sm">{insight.reason}</div>
                  )}
                  <div className="text-gray-500 dark:text-gray-500 text-xs mt-2">{insight.period}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Overall Stats */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">전체 통계</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                <div className="text-gray-900 dark:text-white text-sm mb-1">평균 스킬 레벨</div>
                <div className="text-gray-900 dark:text-white text-2xl font-semibold">73%</div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2 mx-4">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-md"
                    style={{ width: '73%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">총 스킬</div>
                  <div className="text-gray-900 dark:text-white">11</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">숙련 스킬</div>
                  <div className="text-gray-900 dark:text-white">6</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">성장 중</div>
                  <div className="text-gray-900 dark:text-white">8</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">학습 필요</div>
                  <div className="text-gray-900 dark:text-white">3</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">업적</CardTitle>
              </div>
              <CardDescription className="dark:text-gray-400">달성한 마일스톤</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.title}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      achievement.unlocked
                        ? 'bg-primary-light dark:bg-primary-dark border-2 border-primary shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800 opacity-60 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                        achievement.unlocked
                          ? 'bg-primary'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${achievement.unlocked ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className={achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                      >
                        {achievement.title}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">{achievement.description}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">빠른 액션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full rounded-xl justify-start hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsAddSkillDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                새 스킬 추가
              </Button>
              <Button 
                variant="outline" 
                className="w-full rounded-xl justify-start hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleViewGrowthReport}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                성장 리포트 보기
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start border-primary text-primary hover:bg-primary-light dark:hover:bg-primary-dark"
                onClick={handleRequestAIAnalysis}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI 분석 요청
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Skill Dialog */}
      <Dialog open={isAddSkillDialogOpen} onOpenChange={setIsAddSkillDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 스킬 추가</DialogTitle>
            <DialogDescription>
              보유한 스킬을 추가하고 현재 레벨을 설정하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">스킬 이름</Label>
              <Input
                id="skill-name"
                placeholder="예) JavaScript, Python, UX 디자인"
                value={newSkillData.name}
                onChange={(e) => setNewSkillData({ ...newSkillData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-category">카테고리</Label>
              <Select
                value={newSkillData.category}
                onValueChange={(value) => setNewSkillData({ ...newSkillData, category: value })}
              >
                <SelectTrigger id="skill-category" className="rounded-xl">
                  <SelectValue placeholder="카테고리 선택 또는 입력" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((cat) => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category}
                    </SelectItem>
                  ))}
                  <SelectItem value="디자인">디자인</SelectItem>
                  <SelectItem value="개발">개발</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-level">스킬 레벨: {newSkillData.level}%</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNewSkillData({ ...newSkillData, level: Math.max(0, newSkillData.level - 10) })}
                  className="rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <input
                  type="range"
                  id="skill-level"
                  min="0"
                  max="100"
                  step="5"
                  value={newSkillData.level}
                  onChange={(e) => setNewSkillData({ ...newSkillData, level: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNewSkillData({ ...newSkillData, level: Math.min(100, newSkillData.level + 10) })}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`absolute h-full rounded-full transition-all duration-300 shadow-md ${
                    newSkillData.level >= 80 
                      ? 'bg-gray-900 dark:bg-white' 
                      : newSkillData.level >= 60
                      ? 'bg-gray-700 dark:bg-gray-300'
                      : 'bg-gray-500 dark:bg-gray-500'
                  }`}
                  style={{ width: `${newSkillData.level}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-projects">프로젝트 수 (선택사항)</Label>
              <Input
                id="skill-projects"
                type="number"
                min="0"
                placeholder="0"
                value={newSkillData.projects || ''}
                onChange={(e) => setNewSkillData({ ...newSkillData, projects: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddSkillDialogOpen(false);
                setNewSkillData({ name: '', category: '', level: 50, projects: 0 });
              }}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleAddSkill}
              disabled={!newSkillData.name || !newSkillData.category}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl"
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
