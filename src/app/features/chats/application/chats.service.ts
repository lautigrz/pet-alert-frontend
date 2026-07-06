import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from '../../../core/services/socket.service';
import { firstValueFrom, Observable } from 'rxjs';
import { ConversationOutput, ConversationSummaryOutput } from '../domain/chat.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface MessagePayload {
  publicId:   string;
  text:       string;
  senderId:   string;
  receiverId: string;
  isRead:     boolean;
  createdAt:  Date;
  imageUrl?:  string;
  images?:    { publicId: string; url: string }[];
   conversationId: string;
}

export interface CreateConversationResponse {
  publicId:  string;
  createdAt: string;
}


@Injectable({
  providedIn: 'root',
})


export class ChatsService {

  private readonly socketService = inject(SocketService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private unreadChatsSubject = new BehaviorSubject<number>(0);
    
  

  unreadChats$ = this.unreadChatsSubject.asObservable();
  sendMessage(conversationId: string, text: string): void {
    this.socketService.emit('message:send', { conversationId, text });
  }

  sendImage(conversationId: string, file: File, text?: string): Observable<MessagePayload> {
    const formData = new FormData();
    const data = {
      conversationId,
      content: text || ''
    };
    formData.append('data', JSON.stringify(data));
    formData.append('photos', file);

    return this.http.post<MessagePayload>(`${this.apiUrl}/messages`, formData);
  }

  onMessageSent(): Observable<MessagePayload> {
    return this.socketService.on<MessagePayload>('message:sent');
  }

  onMessageReceived(): Observable<MessagePayload> {
    return this.socketService.on<MessagePayload>('message:received');
  }

  readMessage(conversationId: string){
    this.socketService.emit('message:read', { conversationId });
  }

  onMessageRead(): Observable<{ conversationId: string }> {
    return this.socketService.on<{ conversationId: string }>('message:read');
  }

  onError(): Observable<{ message: string }> {
    return this.socketService.on<{ message: string }>('message:error');
  }

  getPresence(userPublicId: string): void {
    this.socketService.emit('presence:get', { userPublicId });
  }

  onPresenceStatus(): Observable<{ userPublicId: string; online: boolean }> {
    return this.socketService.on<{ userPublicId: string; online: boolean }>('presence:status');
  }

  onPresenceChanged(): Observable<{ userPublicId: string; online: boolean }> {
    return this.socketService.on<{ userPublicId: string; online: boolean }>('presence:changed');
  }

  getConversations(): Observable<ConversationSummaryOutput[]> {
   return this.http.get<ConversationSummaryOutput[]>(`${this.apiUrl}/conversations`);
  }

  getMessagesForConversation(conversationId: string): Observable<ConversationOutput> {
    return this.http.get<ConversationOutput>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  createConversation(publicTargetId: string): Observable<CreateConversationResponse> {
    return this.http.post<CreateConversationResponse>(`${this.apiUrl}/conversations`, { publicTargetId });
  }

  async getOrCreateConversation(publicTargetId: string): Promise<string> {
    try {
      const created = await firstValueFrom(this.createConversation(publicTargetId));
      return created.publicId;
    } catch {
      const conversations = await firstValueFrom(this.getConversations());
      const existing = conversations.find((c) => c.otherUser.publicId === publicTargetId);
      if (existing) return existing.publicId;
      throw new Error('No se pudo abrir el chat');
    }
  }

private listenersInitialized = false;

initializeSocketListeners(): void {

  if (this.listenersInitialized) {
    return;
  }

  this.listenersInitialized = true;

  this.onMessageReceived().subscribe(() => {
    this.refreshUnreadChats();
  });

  this.onMessageRead().subscribe(() => {
    this.refreshUnreadChats();
  });
}

  setUnreadChats(count: number): void {
  this.unreadChatsSubject.next(count);
}



getUnreadChats(): number {
  return this.unreadChatsSubject.value;
}

refreshUnreadChats(): void {
  this.getConversations().subscribe({
    next: (conversations) => {

      console.log("CONVERSACIONES:", conversations);

      const unread = conversations.filter(
        c => (c.unreadCount ?? 0) > 0
      ).length;

      console.log("UNREAD:", unread);

      this.setUnreadChats(unread);
    },
    error: (err) => {
      console.error("ERROR getConversations:", err);
    }
  });
}
}