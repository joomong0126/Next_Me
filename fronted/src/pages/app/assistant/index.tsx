import { useOutletContext } from 'react-router-dom';
import { AIAssistant } from '@/features/assistant';
import type { AppOutletContext } from '../types';

export default function AssistantPage() {
  const { projects, setProjects, userRole } = useOutletContext<AppOutletContext>();

  return (
    <AIAssistant
      projects={projects}
      setProjects={setProjects}
      userRole={userRole}
    />
  );
}

