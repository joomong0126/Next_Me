import type { Dispatch, SetStateAction } from 'react';
import type { Project } from '@/entities/project';

export interface AppOutletContext {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  themeName: string;
  setThemeName: Dispatch<SetStateAction<string>>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  openUploadDialog: () => void;
  userRole: string;
}

