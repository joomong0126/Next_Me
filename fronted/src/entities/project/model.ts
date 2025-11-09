import type { Dispatch, SetStateAction } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ProjectType = 'file' | 'link' | 'project';

export interface Project {
  id: number;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  icon: LucideIcon;
  gradient: string;
  type: ProjectType;
  sourceUrl?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  role?: string;
  achievements?: string;
  tools?: string;
  description?: string;
}

export type ProjectsState = [Project[], Dispatch<SetStateAction<Project[]>>];

