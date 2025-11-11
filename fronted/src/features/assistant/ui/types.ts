import type { ProjectType } from '@/entities/project';

export type MessageRole = 'ai' | 'user';

export type Message = {
  id?: string;
  projectId: number;
  role: MessageRole;
  content: string;
  timestamp: Date;
};

export interface AssistantMessage extends Message {
  image?: string;
  isProjectOrganizing?: boolean;
  action?: 'registerProject';
}

export interface UserProfile {
  name: string;
  currentStatus: string[];
  targetRoles: string[];
}

export interface AIGeneratedData {
  title: string;
  date: string;
  format: string;
  tags: string[];
  summary: string;
  category: string;
  type: ProjectType;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
  analysisId?: string;
  storageId?: string;
}


