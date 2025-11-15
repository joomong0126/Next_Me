import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Progress } from '@/shared/ui/shadcn/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { Target, TrendingUp, Sparkles, ArrowRight, CheckCircle2, Plus, Calendar as CalendarIcon, ListTodo, ChevronLeft, ChevronRight } from 'lucide-react';

const careerGoal = {
  title: '데이터 기반 마케팅 전문가',
  description: 'AI가 추천한 적합한 커리어 방향',
  confidence: 92,
};

const requiredSkills = [
  { name: '캠페인 기획', required: 90, current: 85, status: 'good' },
  { name: '데이터 분석', required: 85, current: 70, status: 'focus' },
  { name: '콘텐츠 관리', required: 90, current: 80, status: 'good' },
  { name: 'A/B 테스팅', required: 80, current: 60, status: 'focus' },
  { name: 'SEO/SEM', required: 75, current: 65, status: 'good' },
  { name: '협업 능력', required: 95, current: 90, status: 'excellent' },
];

const projectSuggestions = [
  {
    id: 1,
    title: '전시회 캠페인 프로젝트 확장',
    description: '데이터 분석 섹션을 추가하여 캠페인 성과를 측정하고 인사이트를 도출해보세요.',
    impact: '데이터 분석 +15%',
    difficulty: '중',
  },
  {
    id: 2,
    title: 'A/B 테스팅 사례 연구',
    description: '기존 SNS 캠페인에 A/B 테스팅을 적용하여 최적화 경험을 쌓아보세요.',
    impact: 'A/B 테스팅 +20%',
    difficulty: '중상',
  },
  {
    id: 3,
    title: 'SEO 최적화 프로젝트',
    description: '브랜드 웹사이트의 SEO를 분석하고 개선안을 제시하는 프로젝트를 진행해보세요.',
    impact: 'SEO/SEM +15%',
    difficulty: '하',
  },
];

export function GoalsDashboard() {
  const [milestones, setMilestones] = useState([
    { title: '기초 역량 확보', completed: true, date: '2024년 1월', dateObj: new Date(2024, 0, 15) },
    { title: '중급 프로젝트 3개 완료', completed: true, date: '2024년 6월', dateObj: new Date(2024, 5, 15) },
    { title: '데이터 분석 역량 강화', completed: false, date: '2024년 12월', dateObj: new Date(2024, 11, 15) },
    { title: '전문가 수준 달성', completed: false, date: '2025년 6월', dateObj: new Date(2025, 5, 15) },
  ]);

  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [newGoalData, setNewGoalData] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const toggleMilestone = (index: number) => {
    const newMilestones = [...milestones];
    newMilestones[index].completed = !newMilestones[index].completed;
    setMilestones(newMilestones);
  };

  const handleAddGoal = () => {
    if (!newGoalData.title || !newGoalData.targetDate) return;

    // Parse date from string (e.g., "2025년 12월" or "2025-12-15")
    const parseDateString = (dateStr: string): Date => {
      // Try YYYY-MM-DD format first
      if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
      // Try Korean format "YYYY년 MM월"
      const match = dateStr.match(/(\d{4})년\s*(\d{1,2})월/);
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 15);
      }
      // Default to current date
      return new Date();
    };

    const newMilestone = {
      title: newGoalData.title,
      completed: false,
      date: newGoalData.targetDate,
      dateObj: parseDateString(newGoalData.targetDate),
    };

    setMilestones([...milestones, newMilestone]);
    setIsAddGoalDialogOpen(false);
    setNewGoalData({ title: '', description: '', targetDate: '', category: '' });
  };

  // Get milestones for specific date
  const getMilestonesForSpecificDate = (date: Date) => {
    return milestones.filter(m => {
      return m.dateObj.getFullYear() === date.getFullYear() &&
             m.dateObj.getMonth() === date.getMonth() &&
             m.dateObj.getDate() === date.getDate();
    });
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameDate = (date1: Date | null, date2: Date | undefined) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-gray-900 dark:text-white mb-2">커리어 목표</h1>
        <p className="text-gray-600 dark:text-gray-400">AI가 분석한 당신의 최적 커리어 경로를 확인하세요</p>
      </div>

      {/* Tabs for View Switching */}
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-lg">
          <TabsTrigger value="goals" className="rounded-lg">
            <ListTodo className="w-4 h-4 mr-2" />
            목표 뷰
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg">
            <CalendarIcon className="w-4 h-4 mr-2" />
            스케줄 뷰
          </TabsTrigger>
        </TabsList>

        {/* Goals View */}
        <TabsContent value="goals" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Goal Card */}
            <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700 bg-primary-light dark:bg-primary-dark">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-primary" />
                <CardTitle className="text-gray-900 dark:text-white">목표 직무</CardTitle>
              </div>
              <h2 className="text-gray-900 dark:text-white">{careerGoal.title}</h2>
              <CardDescription className="dark:text-gray-300">{careerGoal.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-900 dark:text-white">AI 적합도 분석</span>
                  <span className="text-primary">{careerGoal.confidence}%</span>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-lg transition-all duration-500"
                    style={{ width: `${careerGoal.confidence}%` }}
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-3">
                  현재 보유한 역량과 진행한 프로젝트를 분석한 결과, 데이터 기반 마케팅 전문가가
                  가장 적합한 커리어 방향입니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills Gap Analysis */}
          <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">역량 대비 그래프</CardTitle>
              <CardDescription className="dark:text-gray-400">필요 스킬 vs 보유 스킬</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {requiredSkills.map((skill) => {
                const gap = skill.required - skill.current;
                const percentage = (skill.current / skill.required) * 100;

                return (
                  <div key={skill.name} className="group">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-900 dark:text-white">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {skill.current}% / {skill.required}%
                        </span>
                        {gap <= 5 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="relative h-full">
                          {/* 목표선 표시 */}
                          <div 
                            className="absolute h-full w-1 bg-gray-400 dark:bg-gray-500 opacity-50"
                            style={{ left: `${skill.required}%` }}
                          />
                          {/* 현재 진행도 */}
                          <div
                            className={`h-full rounded-full transition-all duration-500 shadow-md ${
                              percentage >= 95 
                                ? 'bg-gradient-to-r from-primary to-primary-dark' 
                                : percentage >= 80
                                ? 'bg-gradient-to-r from-primary to-primary-light'
                                : 'bg-gradient-to-r from-primary-light to-[#BFDBFE]'
                            }`}
                            style={{ width: `${skill.current}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {gap > 5 && (
                      <p className="text-gray-500 dark:text-gray-400 mt-1.5">
                        목표까지 +{gap}% 향상 필요
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Project Suggestions */}
          <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">관련 프로젝트 제안</CardTitle>
              </div>
              <CardDescription className="dark:text-gray-400">이 목표를 달성하기 위한 추천 프로젝트</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectSuggestions.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-gray-900 dark:text-white">{project.title}</h4>
                    <Badge variant="outline" className="rounded-lg">
                      {project.difficulty}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-primary">{project.impact}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                      시작하기
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Milestones */}
        <div className="space-y-6">
          <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">마일스톤</CardTitle>
              <CardDescription className="dark:text-gray-400">커리어 목표 달성 단계</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative pl-6 cursor-pointer group" onClick={() => toggleMilestone(index)}>
                    {index !== milestones.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div
                      className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 transition-all ${
                        milestone.completed
                          ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white shadow-md'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                      }`}
                    />
                    <div className={milestone.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400'}>
                      <div className="mb-1">{milestone.title}</div>
                      <div className="text-gray-500 dark:text-gray-500 text-sm">{milestone.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">빠른 액션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full rounded-xl justify-start hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsAddGoalDialogOpen(true)}
              >
                <Target className="w-4 h-4 mr-2" />
                새 목표 설정
              </Button>
              <Button variant="outline" className="w-full rounded-xl justify-start hover:bg-gray-100 dark:hover:bg-gray-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                진행 상황 업데이트
              </Button>
              <Button variant="outline" className="w-full rounded-xl justify-start hover:bg-gray-100 dark:hover:bg-gray-700">
                <Sparkles className="w-4 h-4 mr-2" />
                AI 추천 받기
              </Button>
            </CardContent>
          </Card>

          {/* Progress Stats */}
          <Card className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700 bg-primary-light dark:bg-primary-dark">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="text-primary mb-1">전체 진행률</div>
                <div className="text-gray-900 dark:text-white">78%</div>
              </div>
              <div className="relative h-3 bg-white/50 dark:bg-gray-900/50 rounded-full overflow-hidden mb-4">
                <div 
                  className="absolute h-full bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-lg"
                  style={{ width: '78%' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">완료 스킬</div>
                  <div className="text-gray-900 dark:text-white">4 / 6</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">예상 달성</div>
                  <div className="text-gray-900 dark:text-white">6개월</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        {/* Schedule View - Notion Style */}
        <TabsContent value="schedule" className="mt-6">
          {/* Calendar Header */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white">
                    {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    목표를 클릭하여 상세 정보를 확인하세요
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    className="rounded-lg"
                  >
                    오늘
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsAddGoalDialogOpen(true)}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg ml-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 목표
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="w-full">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div
                      key={day}
                      className="text-center py-3 text-gray-600 dark:text-gray-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {generateCalendarDays().map((date, index) => {
                    const dayMilestones = date ? getMilestonesForSpecificDate(date) : [];
                    const isSelected = isSameDate(date, selectedDate);
                    const isTodayDate = isToday(date);

                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 rounded-xl border transition-all cursor-pointer ${
                          !date
                            ? 'bg-gray-50/50 dark:bg-gray-800/30 border-transparent'
                            : isSelected
                            ? 'bg-primary-light dark:bg-primary-dark border-primary shadow-md'
                            : isTodayDate
                            ? 'bg-white dark:bg-gray-800 border-primary'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                        }`}
                        onClick={() => date && setSelectedDate(date)}
                      >
                        {date && (
                          <>
                            <div className={`mb-2 flex items-center justify-between ${
                              isTodayDate
                                ? 'text-primary'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              <span className={isTodayDate ? '' : ''}>
                                {date.getDate()}
                              </span>
                              {isTodayDate && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                            
                            {/* Milestones for this day */}
                            <div className="space-y-1">
                              {dayMilestones.slice(0, 3).map((milestone, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs p-1.5 rounded-lg truncate ${
                                    milestone.completed
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through'
                                      : 'bg-primary text-white'
                                  }`}
                                  title={milestone.title}
                                >
                                  {milestone.title}
                                </div>
                              ))}
                              {dayMilestones.length > 3 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 pl-1.5">
                                  +{dayMilestones.length - 3} 더보기
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          {selectedDate && (
            <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700 mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="dark:text-white">
                      {selectedDate.toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      {getMilestonesForSpecificDate(selectedDate).length}개의 목표
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {getMilestonesForSpecificDate(selectedDate).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getMilestonesForSpecificDate(selectedDate).map((milestone, index) => {
                      const milestoneIndex = milestones.findIndex(m => m.title === milestone.title);
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            milestone.completed
                              ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                              : 'bg-white dark:bg-gray-900 border-primary shadow-sm hover:shadow-md'
                          }`}
                          onClick={() => {
                            if (milestoneIndex !== -1) toggleMilestone(milestoneIndex);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                milestone.completed
                                  ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                                  : 'bg-white dark:bg-gray-900 border-primary'
                              }`}
                            >
                              {milestone.completed && (
                                <CheckCircle2 className="w-3 h-3 text-white dark:text-gray-900" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={milestone.completed ? 'text-gray-500 dark:text-gray-400 line-through mb-1' : 'text-gray-900 dark:text-white mb-1'}>
                                {milestone.title}
                              </div>
                              <div className="text-gray-500 dark:text-gray-500 text-sm">
                                {milestone.date}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="mb-4">이 날짜에 설정된 목표가 없습니다</p>
                    <Button
                      onClick={() => setIsAddGoalDialogOpen(true)}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      목표 추가하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Goal Dialog */}
      <Dialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 목표 설정</DialogTitle>
            <DialogDescription>
              달성하고 싶은 커리어 목표를 설정하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">목표 제목</Label>
              <Input
                id="goal-title"
                placeholder="예) 프론트엔드 개발자로 이직하기"
                value={newGoalData.title}
                onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-description">목표 설명 (선택사항)</Label>
              <Textarea
                id="goal-description"
                placeholder="목표에 대한 상세한 설명을 입력하세요"
                value={newGoalData.description}
                onChange={(e) => setNewGoalData({ ...newGoalData, description: e.target.value })}
                className="rounded-xl min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-category">카테고리 (선택사항)</Label>
              <Select
                value={newGoalData.category}
                onValueChange={(value) => setNewGoalData({ ...newGoalData, category: value })}
              >
                <SelectTrigger id="goal-category" className="rounded-xl">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">커리어 전환</SelectItem>
                  <SelectItem value="skill">스킬 향상</SelectItem>
                  <SelectItem value="project">프로젝트 완성</SelectItem>
                  <SelectItem value="certification">자격증 취득</SelectItem>
                  <SelectItem value="networking">네트워킹</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-date">목표 달성 시기</Label>
              <Input
                id="goal-date"
                placeholder="예) 2025년 6월"
                value={newGoalData.targetDate}
                onChange={(e) => setNewGoalData({ ...newGoalData, targetDate: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddGoalDialogOpen(false);
                setNewGoalData({ title: '', description: '', targetDate: '', category: '' });
              }}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleAddGoal}
              disabled={!newGoalData.title || !newGoalData.targetDate}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              목표 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}