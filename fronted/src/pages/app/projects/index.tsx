import { useOutletContext } from 'react-router-dom';
import { ProjectsBoard } from '@/features/projects/board';
import type { AppOutletContext } from '../types';

export default function ProjectsPage() {
  const { projects, setProjects } = useOutletContext<AppOutletContext>();

  return <ProjectsBoard projects={projects} setProjects={setProjects} />;
}

