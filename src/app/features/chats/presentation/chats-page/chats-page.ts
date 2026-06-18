import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatsService, MessagePayload } from '../../application/chats.service';
import { ConversationOutput, ConversationSummaryOutput } from '../../domain/chat.models';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../auth/application/auth.service';

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden bg-[#f4f4f4]' },
  templateUrl: './chats-page.html',
  styleUrl: './chats-page.css',
})
export class ChatsPage implements OnInit, OnDestroy {
  private readonly chatsService = inject(ChatsService);
  private readonly authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  searchTerm = signal('');
  newMessage = signal('');
  selectedContact = signal<ConversationSummaryOutput | null>(null);
  currentUserId = signal<string>(this.authService.getCurrentUserId() ?? '');
  conversationOutput = signal<ConversationOutput | null>(null);
  messages: MessagePayload[] = [];
  contacts: ConversationSummaryOutput[] = [];
  conversationId = '';


  ngOnInit(): void {
    this.chatsService.getConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(contacts => this.contacts = contacts);

    this.chatsService.onMessageReceived()
      .pipe(takeUntil(this.destroy$))
      .subscribe(msg => {
        this.messages = [...this.messages, msg];
        setTimeout(() => this.scrollToBottom(), 100);
      });
     
    this.chatsService.onMessageRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe(msg => {
        console.log('Mensajes leídos en conversación:', msg.conversationId);
      });

    this.chatsService.onError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(err => console.error(err.message));
  }

  get allMessages() {
    const historical = this.conversationOutput()?.messages ?? [];
    return [...historical, ...this.messages];
  }

  selectContact(contact: ConversationSummaryOutput): void {
    setTimeout(() => this.scrollToBottom(), 100);

    this.selectedContact.set(contact);
    this.conversationId = contact.publicId;
    this.messages = [];

    this.chatsService.getMessagesForConversation(this.conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(conv => {
        this.conversationOutput.set(conv)
        if (this.messagesNotRead()) {
          this.chatsService.readMessage(this.conversationId);
        }
      });



  }

  sendMessage(): void {

    const text = this.newMessage().trim();
    if (!text || !this.conversationId) return;
    this.chatsService.sendMessage(this.conversationId, text);

    this.messages = [...this.messages, {
      publicId: crypto.randomUUID(),
      text,
      senderId: this.currentUserId(),
      receiverId: this.selectedContact()!.otherUser.publicId,
      isRead: false,
      createdAt: new Date(),
    }];

    this.newMessage.set('');
    setTimeout(() => this.scrollToBottom(), 100);
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  sendImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // subida de imagen - falta implementación
  }

  sendAudio(): void {
    // grabación de audio - falta implementación
  }

  get filteredContacts(): ConversationSummaryOutput[] {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.contacts;
    return this.contacts.filter(c => c.otherUser.username.toLowerCase().includes(term));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (error) {
      console.error('Error al hacer scroll:', error);
    }
  }


  private messagesNotRead() {

    return this.allMessages.some(m => !m.isRead && m.senderId !== this.currentUserId());
  }
}