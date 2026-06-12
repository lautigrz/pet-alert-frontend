export interface ChatContact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
}

export interface ChatMessage {
  id: number;
  sender: 'me' | 'other';
  text?: string;
  time: string;
  imageUrl?: string;
  audioUrl?: string;
}