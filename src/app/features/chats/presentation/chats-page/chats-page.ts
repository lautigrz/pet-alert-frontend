import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatsService, MessagePayload } from '../../application/chats.service';
import { ConversationOutput, ConversationSummaryOutput } from '../../domain/chat.models';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../auth/application/auth.service';
import { ReportModalComponent } from '../../../../shared/component/report-modal/report-modal';

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportModalComponent],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden bg-[#f4f4f4]' },
  templateUrl: './chats-page.html',
  styleUrl: './chats-page.css',
})
export class ChatsPage implements OnInit, OnDestroy {
  private readonly chatsService = inject(ChatsService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
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
  selectedImageFile = signal<File | null>(null);
  selectedImagePreview = signal<string | null>(null);
  activePreviewImageUrl = signal<string | null>(null);
  mostrandoModalDenuncia = signal(false);
  menuOpcionesAbierto = signal(false);

  toggleMenuOpciones(event: Event) {
    event.stopPropagation();
    this.menuOpcionesAbierto.update((abierto) => !abierto);
  }

  @HostListener('document:click')
  cerrarMenuOpciones() {
    this.menuOpcionesAbierto.set(false);
  }

  abrirModalDenuncia() {
    this.mostrandoModalDenuncia.set(true);
  }

  denunciarDesdeMenu() {
    this.cerrarMenuOpciones();
    this.abrirModalDenuncia();
  }

  cerrarModalDenuncia() {
    this.mostrandoModalDenuncia.set(false);
  }

  ngOnInit(): void {
    this.chatsService.getConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(contacts => {
        this.contacts = contacts;
        const conversationId = this.route.snapshot.queryParamMap.get('conversation');
        if (conversationId) this.abrirConversacion(conversationId);
      });

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

  abrirConversacion(conversationId: string): void {
    const contacto = this.contacts.find((c) => c.publicId === conversationId);
    if (contacto) {
      this.selectContact(contacto);
      return;
    }

    this.conversationId = conversationId;
    this.messages = [];
    this.chatsService.getMessagesForConversation(conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(conv => {
        this.conversationOutput.set(conv);
        this.selectedContact.set({
          publicId: conv.publicId,
          otherUser: {
            publicId: conv.otherUser.publicId,
            username: conv.otherUser.username,
            photoUrl: conv.otherUser.photoUrl ?? null,
          },
          lastMessage: null,
          createdAt: conv.createdAt,
        });
        if (this.messagesNotRead()) {
          this.chatsService.readMessage(conversationId);
        }
        setTimeout(() => this.scrollToBottom(), 100);
      });
  }

  sendMessage(): void {
    const text = this.newMessage().trim();
    const imageFile = this.selectedImageFile();
    const imagePreview = this.selectedImagePreview();

    if ((!text && !imageFile) || !this.conversationId) return;

    if (imageFile && imagePreview) {

      const tempPublicId = crypto.randomUUID();
      const localMessage: MessagePayload = {
        publicId: tempPublicId,
        text,
        senderId: this.currentUserId(),
        receiverId: this.selectedContact()!.otherUser.publicId,
        isRead: false,
        createdAt: new Date(),
        imageUrl: imagePreview
      };

      this.messages = [...this.messages, localMessage];

      this.newMessage.set('');
      this.clearSelectedImage();
      setTimeout(() => this.scrollToBottom(), 100);

      this.chatsService.sendImage(this.conversationId, imageFile, text).subscribe({
        next: (response) => {
          this.messages = this.messages.map(msg => {
            if (msg.publicId === tempPublicId) {
              return {
                ...msg,
                publicId: response.publicId || msg.publicId,
                text: response.text || msg.text,
                imageUrl: response.imageUrl || (response.images?.[0]?.url) || msg.imageUrl,
                images: response.images || msg.images
              };
            }
            return msg;
          });
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (err) => {
          console.error('Error al enviar la imagen:', err);
          this.messages = this.messages.filter(msg => msg.publicId !== tempPublicId);
        }
      });
    } else {
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
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedImageFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    input.value = '';
  }

  clearSelectedImage(): void {
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);
  }

  openImage(url?: string): void {
    if (url) {
      this.activePreviewImageUrl.set(url);
    }
  }

  closeImage(): void {
    this.activePreviewImageUrl.set(null);
  }

  getMessageImageUrl(message: { images?: { url: string }[] }): string {
    return message.images?.[0]?.url || '';
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