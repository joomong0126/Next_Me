export type UserId = string;

export interface User {
  id: UserId;
  email: string;
  name?: string;
  headline?: string;
  avatar_url?: string;
  goals?: string[];
  phone?: string;
}

