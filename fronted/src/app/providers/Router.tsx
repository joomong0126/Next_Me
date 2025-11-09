import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import IntroPage from '@/pages/intro';
import LoginPage from '@/pages/login';
import OnboardingPage from '@/pages/onboarding';
import AppLayout from '@/pages/app';
import AssistantPage from '@/pages/app/assistant';
import ProjectsPage from '@/pages/app/projects';
import SkillsPage from '@/pages/app/skills';
import GoalsPage from '@/pages/app/goals';
import SettingsPage from '@/pages/app/settings';

export function AppRouter() {
  const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/intro" replace /> },
    { path: '/intro', element: <IntroPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/onboarding', element: <OnboardingPage /> },
    {
      path: '/app',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="assistant" replace /> },
        { path: 'assistant', element: <AssistantPage /> },
        { path: 'projects', element: <ProjectsPage /> },
        { path: 'skills', element: <SkillsPage /> },
        { path: 'goals', element: <GoalsPage /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
