import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { applyTheme } from '@/shared/lib/themes';
import { Toaster } from '@/shared/ui/shadcn/sonner';
import { AppPage } from '@/shared/types/app';
import Sidebar from '@/widgets/Sidebar/Sidebar';
import Header from '@/widgets/Header/Header';
import { UploadDialog } from '@/features/project-upload';
import WelcomeDialog from './components/WelcomeDialog';
import type { Project } from '@/entities/project';
import type { AppOutletContext } from './types';
import { api } from '@/shared/api';
import { fetchProjects } from '@/entities/project/api';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const [projects, setProjects] = useState<Project[]>([]);
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
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const loadedProjects = await fetchProjects();
        if (!cancelled) {
          setProjects(loadedProjects);
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
        if (!cancelled) {
          toast.error('프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
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

