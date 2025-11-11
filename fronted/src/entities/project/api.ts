import { api } from '@/shared/api';
import type { Project } from './model';
import { mapProjectRecordToProject } from './lib/mapProject';

export async function fetchProjects(): Promise<Project[]> {
  const records = await api.projects.list();
  return records.map(mapProjectRecordToProject);
}


