import { api } from '@/shared/api';
import type { Project } from '@/entities/project';
import { mapProjectRecordToProject } from '@/entities/project/lib/mapProject';

export async function fetchProjects(): Promise<Project[]> {
  const records = await api.projects.list();
  return records.map(mapProjectRecordToProject);
}

