import type { ProjectRecord, ProjectsAPI } from '../../contracts';

export const projects: ProjectsAPI = {
  async list(): Promise<ProjectRecord[]> {
    // TODO: Replace with Supabase query once project storage is available.
    return [];
  },
};


