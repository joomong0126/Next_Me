import type { Dispatch, SetStateAction } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ProjectType = 'file' | 'link' | 'project';

export interface Project {
  id: number | string; // Supabase는 UUID(string)를 사용하므로 number | string 허용
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
  files?: Array<{ name: string; url: string }>;
  links?: string[];
}

export type ProjectsState = [Project[], Dispatch<SetStateAction<Project[]>>];

