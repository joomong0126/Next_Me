import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { applyTheme } from '@/shared/lib/themes';
import { Toaster } from '@/shared/ui/shadcn/sonner';
import { AppPage } from '@/shared/types/app';
import Sidebar from '@/widgets/Sidebar/Sidebar';
import Header from '@/widgets/Header/Header';
import { UploadDialog } from '@/features/projects/upload';
import WelcomeDialog from './components/WelcomeDialog';
import type { Project } from '@/entities/project';
import type { AppOutletContext } from './types';
import { api } from '@/shared/api';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { toast } from 'sonner';

const breadcrumbMap: Record<AppPage, string> = {
  assistant: 'AI Assistant',
  'career-generator': 'AI 커리어 생성기',
  projects: 'Projects',
  skills: 'Skills & Insights',
  goals: 'Goals',
  settings: 'Settings',
};

const appPages: AppPage[] = ['assistant', 'career-generator', 'projects', 'skills', 'goals', 'settings'];

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
  const queryClient = useQueryClient();

  const { data: projectsData = [], isLoading: isLoadingProjects } = useProjects();
  // React Query의 데이터를 로컬 상태로 관리 (outletContext에서 setProjects가 필요하므로)
  const [projects, setProjects] = useState<Project[]>([]);
  const prevProjectsDataRef = useRef<Project[]>([]);
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

  // React Query에서 가져온 프로젝트 데이터를 로컬 상태와 동기화
  // (outletContext에서 setProjects가 사용되므로 상태 유지 필요)
  useEffect(() => {
    // 이전 값과 비교하여 실제로 변경되었을 때만 업데이트 (무한 루프 방지)
    const prevIds = prevProjectsDataRef.current.map(p => p.id).join(',');
    const currentIds = projectsData.map(p => p.id).join(',');
    
    if (prevIds !== currentIds || prevProjectsDataRef.current.length !== projectsData.length) {
      setProjects(projectsData);
      prevProjectsDataRef.current = projectsData;
    }
  }, [projectsData]);

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

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
      localStorage.removeItem('onboardingCompleted');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('careerData');
      sessionStorage.removeItem('welcomeShown');
      setProjects([]);
      setUserRole('');
      navigate('/login', { replace: true });
    }
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

