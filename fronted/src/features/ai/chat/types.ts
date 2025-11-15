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

