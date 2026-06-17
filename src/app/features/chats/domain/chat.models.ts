export interface ChatContact {
  id: number;
  publicId: string;
  conversationId: string;
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

export interface ConversationSummaryOutput {
    publicId: string;
    otherUser: {
        publicId: string;
        username: string;
        photoUrl: string | null;  
    };
    lastMessage: {
        text: string;
        isRead: boolean;
        createdAt: Date;
    } | null;
    createdAt: Date;
}


interface UserOutput {
    publicId: string;
    username: string;
    photoUrl: string;
}

interface MessageOutput {
    publicId: string;
    text: string;
    senderId: string;
    isRead: boolean;
    createdAt: Date;
}

export interface ConversationOutput {
    publicId: string;
    otherUser: UserOutput;
    messages: MessageOutput[];
    createdAt: Date;
}