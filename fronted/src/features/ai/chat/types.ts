export type MessageRole = 'ai' | 'user';

export type Message = {
  id?: string;
  projectId: number | string; // Supabase는 UUID를 사용하므로 number | string 허용
  role: MessageRole;
  content: string;
  timestamp: Date;
};

export interface AssistantMessage extends Message {
  image?: string;
  isProjectOrganizing?: boolean;
  action?: 'registerProject';
  url?: string; // 다운로드 URL (포트폴리오/자기소개서 생성 완료 시)
  filename?: string; // 파일명
}

