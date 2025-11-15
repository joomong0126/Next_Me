import type { ProjectType } from '@/entities/project';

// 공통 타입 re-export
export type { AssistantMessage, Message, MessageRole } from '@/features/ai/chat/types';

export interface AIGeneratedData {
  title: string;
  date: string;
  format: string;
  tags: string[];
  summary: string;
  category: string;
  type: ProjectType;
  sourceUrl?: string;
  // 추가 필드들
  period?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  role?: string;
  achievements?: string;
  tools?: string;
  description?: string;
  // 기타 필드들
  metadata?: Record<string, unknown>;
  analysisId?: string;
  storageId?: string;
  // API 응답의 모든 필드를 포함할 수 있도록
  [key: string]: unknown;
}

