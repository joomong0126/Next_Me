import { useOutletContext } from 'react-router-dom';

import { AICareerGenerator } from '@/features/ai/career';

import type { AppOutletContext } from '../types';

const CAREER_WELCOME_MESSAGE =
  'AI 기능을 선택하고 프로젝트를 분석하여 원하는 결과를 생성해드릴게요.\n원하시는 기능을 선택해주세요!';

export default function CareerGeneratorPage() {
  const { projects, setProjects, userRole } = useOutletContext<AppOutletContext>();

  return (
    <AICareerGenerator
      projects={projects}
      setProjects={setProjects}
      userRole={userRole}
      welcomeMessage={CAREER_WELCOME_MESSAGE}
    />
  );
}



