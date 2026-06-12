import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatsService } from '../../application/chats.service';
import { ChatContact, ChatMessage } from '../../domain/chat.models';

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chats-page.html',
  styleUrl: './chats-page.css',
})
export class ChatsPage {
  private readonly chatsService = inject(ChatsService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  searchTerm = signal('');
  newMessage = signal('');

  contacts: ChatContact[] = this.chatsService.getContacts();
  messages: ChatMessage[] = this.chatsService.getMessages();

  selectedContact = signal<ChatContact>(this.contacts[0]);

  selectContact(contact: ChatContact): void {
    this.selectedContact.set(contact);
  }

  sendMessage(): void {
    const text = this.newMessage().trim();

    if (!text) return;

    this.messages = [
      ...this.messages,
      {
        id: Date.now(),
        sender: 'me',
        text,
        time: this.getCurrentTime(),
      },
    ];

    this.newMessage.set('');
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  sendImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    this.messages = [
      ...this.messages,
      {
        id: Date.now(),
        sender: 'me',
        imageUrl,
        time: this.getCurrentTime(),
      },
    ];

    input.value = '';
  }

  sendAudio(): void {
    this.messages = [
      ...this.messages,
      {
        id: Date.now(),
        sender: 'me',
        audioUrl: 'audio-demo',
        time: this.getCurrentTime(),
      },
    ];
  }

  get filteredContacts(): ChatContact[] {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) return this.contacts;

    return this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(term)
    );
  }

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}