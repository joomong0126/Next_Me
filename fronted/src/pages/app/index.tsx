import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Megaphone, MessageSquare, TrendingUp } from 'lucide-react';
import { applyTheme } from '@/shared/lib/themes';
import { Toaster } from '@/shared/ui/shadcn/sonner';
import { AppPage } from '@/shared/types/app';
import Sidebar from '@/widgets/Sidebar/Sidebar';
import Header from '@/widgets/Header/Header';
import { UploadDialog } from '@/features/project-upload';
import WelcomeDialog from './components/WelcomeDialog';
import type { Project } from '@/entities/project';
import type { AppOutletContext } from './types';

const initialProjects: Project[] = [
  {
    id: 1,
    title: '10월 페이백 이벤트 캠페인',
    category: '콘텐츠 마케팅',
    tags: ['오프라인 프로모션', '지역 마케팅', '페이백 이벤트', '페스티벌'],
    summary: '페스티벌 기간 동안 방문 유도를 위해 진행한 지역형 페이백 이벤트로 방문자 200% 증가를 달성',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-500',
    type: 'file',
    sourceUrl: 'KakaoTalk_20251005_194830764_01.png',
  },
  {
    id: 2,
    title: '신규 브랜드 런칭 캠페인',
    category: '마케팅',
    tags: ['캠페인 기획', '인플루언서 관리', 'SNS'],
    summary: '캠페인 기획 / 콘텐츠 관리 / 협업 능력 강화',
    icon: Megaphone,
    gradient: 'from-blue-500 to-cyan-500',
    type: 'project',
  },
  {
    id: 3,
    title: 'SNS 콘텐츠 전략 프로젝트',
    category: '콘텐츠',
    tags: ['데이터 분석', '콘텐츠 기획', '전략 수립'],
    summary: '데이터 분석 / 콘텐츠 기획 / 성과 측정',
    icon: MessageSquare,
    gradient: 'from-purple-500 to-pink-500',
    type: 'project',
  },
  {
    id: 4,
    title: '브랜드 포트폴리오',
    category: '디자인',
    tags: ['브랜딩', '비주얼 디자인', '포트폴리오'],
    summary: '브랜드 아이덴티티 디자인 작업물 모음',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-500',
    type: 'file',
    sourceUrl: 'portfolio_main.jpg',
  },
  {
    id: 5,
    title: '마케팅 캠페인 보고서',
    category: '마케팅',
    tags: ['분석', '보고서', '성과 측정'],
    summary: 'Q4 마케팅 캠페인 성과 분석 및 인사이트',
    icon: Megaphone,
    gradient: 'from-blue-500 to-indigo-500',
    type: 'file',
    sourceUrl: 'marketing_report.pdf',
  },
  {
    id: 6,
    title: '프로젝트 기획안',
    category: '기획',
    tags: ['기획', '제안서', '문서'],
    summary: '신규 서비스 론칭을 위한 상세 기획안',
    icon: MessageSquare,
    gradient: 'from-green-500 to-emerald-500',
    type: 'file',
    sourceUrl: 'project_proposal.docx',
  },
  {
    id: 7,
    title: '디자인 컨셉 시안',
    category: '디자인',
    tags: ['UI/UX', '목업', '시안'],
    summary: '앱 리뉴얼 프로젝트 디자인 컨셉 이미지',
    icon: Megaphone,
    gradient: 'from-pink-500 to-rose-500',
    type: 'file',
    sourceUrl: 'design_concept.png',
  },
  {
    id: 8,
    title: '발표 자료',
    category: '프레젠테이션',
    tags: ['발표', '피칭', 'PT'],
    summary: '투자 유치를 위한 비즈니스 프레젠테이션',
    icon: MessageSquare,
    gradient: 'from-purple-500 to-violet-500',
    type: 'file',
    sourceUrl: 'presentation.pdf',
  },
  {
    id: 9,
    title: '회의록 및 액션 아이템',
    category: '협업',
    tags: ['회의', '문서', '협업'],
    summary: '주간 팀 미팅 회의록 및 업무 분장',
    icon: MessageSquare,
    gradient: 'from-cyan-500 to-blue-500',
    type: 'file',
    sourceUrl: 'meeting_notes.doc',
  },
  {
    id: 10,
    title: '제품 목업 이미지',
    category: '디자인',
    tags: ['목업', '제품 디자인', '비주얼'],
    summary: '신제품 패키징 및 목업 디자인',
    icon: Megaphone,
    gradient: 'from-amber-500 to-orange-500',
    type: 'file',
    sourceUrl: 'product_mockup.webp',
  },
  {
    id: 11,
    title: '데이터 분석 리포트',
    category: '분석',
    tags: ['데이터', '분석', '인사이트'],
    summary: '사용자 행동 패턴 분석 및 개선 방안',
    icon: MessageSquare,
    gradient: 'from-teal-500 to-cyan-500',
    type: 'file',
    sourceUrl: 'data_analysis.pdf',
  },
  {
    id: 12,
    title: '아이콘 세트',
    category: '디자인',
    tags: ['아이콘', 'UI', '그래픽'],
    summary: '서비스용 커스텀 아이콘 디자인 세트',
    icon: Megaphone,
    gradient: 'from-indigo-500 to-purple-500',
    type: 'file',
    sourceUrl: 'icon_set.svg',
  },
];

const breadcrumbMap: Record<AppPage, string> = {
  assistant: 'AI Assistant',
  projects: 'Projects',
  skills: 'Skills & Insights',
  goals: 'Goals',
  settings: 'Settings',
};

const appPages: AppPage[] = ['assistant', 'projects', 'skills', 'goals', 'settings'];

const derivePageFromPath = (pathname: string): AppPage => {
  const [, , segment] = pathname.split('/');
  if (appPages.includes(segment as AppPage)) {
    return segment as AppPage;
  }
  return 'assistant';
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [darkMode, setDarkMode] = useState(false);
  const [themeName, setThemeName] = useState<string>('black');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const currentPage = useMemo<AppPage>(() => derivePageFromPath(location.pathname), [location.pathname]);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted !== 'true') {
      navigate('/intro', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/assistant', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const profileRaw = localStorage.getItem('userProfile');
    if (profileRaw) {
      try {
        const profile = JSON.parse(profileRaw) as { goals?: string[] };
        const goals = profile.goals || [];
        if (goals.includes('마케팅')) {
          setUserRole('마케팅');
        } else if (goals.includes('프론트엔드 개발') || goals.includes('백엔드 개발')) {
          setUserRole('개발');
        } else {
          setUserRole('');
        }
      } catch {
        setUserRole('');
      }
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    applyTheme(themeName, darkMode);
  }, [darkMode, themeName]);

  useEffect(() => {
    applyTheme(themeName, darkMode);
  }, []);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('welcomeShown');
    if (!hasShown && localStorage.getItem('onboardingCompleted') === 'true') {
      setWelcomeDialogOpen(true);
      sessionStorage.setItem('welcomeShown', 'true');
    }
  }, []);

  const handleNavigate = (page: AppPage) => {
    navigate(`/app/${page}`);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('careerData');
    sessionStorage.removeItem('welcomeShown');
    setProjects(initialProjects);
    setUserRole('');
    navigate('/intro');
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const outletContext: AppOutletContext = {
    projects,
    setProjects,
    themeName,
    setThemeName,
    darkMode,
    toggleDarkMode,
    handleLogout,
    openUploadDialog: () => setQuickActionOpen(true),
    userRole,
  };

  if (!appPages.includes(currentPage)) {
    return <Navigate to="/app/assistant" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Header
        breadcrumb={breadcrumbMap[currentPage]}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
        onQuickAction={() => setQuickActionOpen(true)}
        onLogout={handleLogout}
      />

      <main className="md:ml-72 mt-16 md:mt-20 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <Outlet context={outletContext} />
        </div>
      </main>

      <UploadDialog open={quickActionOpen} onOpenChange={setQuickActionOpen} />
      <Toaster />
      <WelcomeDialog open={welcomeDialogOpen} onOpenChange={setWelcomeDialogOpen} />
    </div>
  );
}

