import { inject, Injectable } from '@angular/core';

import { SocketService } from '../../../core/services/socket.service';
import { Observable } from 'rxjs';
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
}


@Injectable({
  providedIn: 'root',
})
export class ChatsService {

  private readonly socketService = inject(SocketService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  sendMessage(conversationId: string, text: string): void {
    this.socketService.emit('message:send', { conversationId, text });
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

  getConversations(): Observable<ConversationSummaryOutput[]> {
   return this.http.get<ConversationSummaryOutput[]>(`${this.apiUrl}/conversations/my-conversations`);
  }

  getMessagesForConversation(conversationId: string): Observable<ConversationOutput> {
    return this.http.get<ConversationOutput>(`${this.apiUrl}/conversations/${conversationId}`);
  }

}