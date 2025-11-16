import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import IntroPage from '@/pages/intro';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import SignupDetailsPage from '@/pages/signup/details';
import OnboardingPage from '@/pages/onboarding';
import AppLayout from '@/pages/app';
import AssistantPage from '@/pages/app/assistant';
import ProjectsPage from '@/pages/app/projects';
import SkillsPage from '@/pages/app/skills';
import GoalsPage from '@/pages/app/goals';
import SettingsPage from '@/pages/app/settings';
import CareerGeneratorPage from '@/pages/app/career-generator';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import AuthCallbackPage from '@/pages/auth/callback';

export function AppRouter() {
  const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/intro" replace /> },
    { path: '/intro', element: <IntroPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/signup', element: <SignupPage /> },
    { path: '/signup/details', element: <SignupDetailsPage /> },
    { path: '/onboarding', element: <OnboardingPage /> },
    // OAuth 콜백 라우트 (Supabase Google 로그인 처리)
    { path: '/auth/callback', element: <AuthCallbackPage /> },
    {
      path: '/app',
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Navigate to="assistant" replace /> },
        { path: 'assistant', element: <AssistantPage /> },
        { path: 'career-generator', element: <CareerGeneratorPage /> },
        { path: 'projects', element: <ProjectsPage /> },
        { path: 'skills', element: <SkillsPage /> },
        { path: 'goals', element: <GoalsPage /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
