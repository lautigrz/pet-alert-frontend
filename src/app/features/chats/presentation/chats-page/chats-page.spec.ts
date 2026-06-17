import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ChatsPage } from './chats-page';
import { ChatsService, MessagePayload } from '../../application/chats.service';
import { AuthService } from '../../../auth/application/auth.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { ConversationOutput, ConversationSummaryOutput } from '../../domain/chat.models';

describe('ChatsPage', () => {
  let component: ChatsPage;
  let fixture: ComponentFixture<ChatsPage>;
  let chatsServiceMock: {
    getConversations: ReturnType<typeof vi.fn>;
    onMessageReceived: ReturnType<typeof vi.fn>;
    onMessageRead: ReturnType<typeof vi.fn>;
    onError: ReturnType<typeof vi.fn>;
    getMessagesForConversation: ReturnType<typeof vi.fn>;
    readMessage: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    getCurrentUserId: ReturnType<typeof vi.fn>;
  };

  let messageReceivedSubject: Subject<MessagePayload>;
  let messageReadSubject: Subject<{ conversationId: string }>;
  let errorSubject: Subject<{ message: string }>;

  beforeEach(() => {
    messageReceivedSubject = new Subject<MessagePayload>();
    messageReadSubject = new Subject<{ conversationId: string }>();
    errorSubject = new Subject<{ message: string }>();

    chatsServiceMock = {
      getConversations: vi.fn().mockReturnValue(of([])),
      onMessageReceived: vi.fn().mockReturnValue(messageReceivedSubject.asObservable()),
      onMessageRead: vi.fn().mockReturnValue(messageReadSubject.asObservable()),
      onError: vi.fn().mockReturnValue(errorSubject.asObservable()),
      getMessagesForConversation: vi.fn().mockReturnValue(of({
        publicId: 'conv-123',
        otherUser: { publicId: 'u-other', username: 'other_user' },
        messages: [],
      })),
      readMessage: vi.fn(),
      sendMessage: vi.fn(),
    };

    authServiceMock = {
      getCurrentUserId: vi.fn().mockReturnValue('u-current'),
    };

    TestBed.configureTestingModule({
      imports: [ChatsPage],
      providers: [
        { provide: ChatsService, useValue: chatsServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    fixture = TestBed.createComponent(ChatsPage);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load contacts on initialization', () => {
      const mockContacts: ConversationSummaryOutput[] = [
        {
          publicId: 'c1',
          otherUser: { publicId: 'u2', username: 'user2', photoUrl: null },
          lastMessage: { text: 'hello', isRead: false, createdAt: new Date() },
          createdAt: new Date(),
        },
      ];
      chatsServiceMock.getConversations.mockReturnValue(of(mockContacts));

      fixture.detectChanges();

      expect(chatsServiceMock.getConversations).toHaveBeenCalled();
      expect(component.contacts).toEqual(mockContacts);
    });

    it('should subscribe to onMessageReceived and push new messages', async () => {
      fixture.detectChanges();

      const mockMsg: MessagePayload = {
        publicId: 'm-new',
        text: 'new message',
        senderId: 'u-other',
        receiverId: 'u-current',
        isRead: false,
        createdAt: new Date(),
      };

      messageReceivedSubject.next(mockMsg);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(component.messages).toContain(mockMsg);
    });

    it('should log message read when onMessageRead emits', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { /* noop */ });
      fixture.detectChanges();

      messageReadSubject.next({ conversationId: 'c1' });

      expect(consoleSpy).toHaveBeenCalledWith('Mensajes leídos en conversación:', 'c1');
      consoleSpy.mockRestore();
    });

    it('should log error when onError emits', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
      fixture.detectChanges();

      errorSubject.next({ message: 'some socket error' });

      expect(consoleSpy).toHaveBeenCalledWith('some socket error');
      consoleSpy.mockRestore();
    });
  });

  describe('selectContact', () => {
    it('should set contact, conversationId and fetch messages', async () => {
      fixture.detectChanges();
      const mockContact: ConversationSummaryOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: { text: 'hello', isRead: false, createdAt: new Date() },
        createdAt: new Date(),
      };

      const mockConversation: ConversationOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: '' },
        messages: [
          {
            publicId: 'm1',
            text: 'old message',
            senderId: 'u-other',
            isRead: false,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
      };

      chatsServiceMock.getMessagesForConversation.mockReturnValue(of(mockConversation));

      component.selectContact(mockContact);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(component.selectedContact()).toBe(mockContact);
      expect(component.conversationId).toBe('c1');
      expect(component.messages).toEqual([]);
      expect(chatsServiceMock.getMessagesForConversation).toHaveBeenCalledWith('c1');
      expect(component.conversationOutput()).toEqual(mockConversation);

      // Should call readMessage since there is an unread message from the other user
      expect(chatsServiceMock.readMessage).toHaveBeenCalledWith('c1');
    });

    it('should not call readMessage if all messages are read or sent by current user', async () => {
      fixture.detectChanges();
      const mockContact: ConversationSummaryOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: { text: 'hello', isRead: true, createdAt: new Date() },
        createdAt: new Date(),
      };

      const mockConversation: ConversationOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: '' },
        messages: [
          {
            publicId: 'm1',
            text: 'my message',
            senderId: 'u-current',
            isRead: false,
            createdAt: new Date(),
          },
          {
            publicId: 'm2',
            text: 'other message',
            senderId: 'u-other',
            isRead: true,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
      };

      chatsServiceMock.getMessagesForConversation.mockReturnValue(of(mockConversation));

      component.selectContact(mockContact);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(chatsServiceMock.readMessage).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const mockContact: ConversationSummaryOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: { text: 'hello', isRead: false, createdAt: new Date() },
        createdAt: new Date(),
      };
      component.selectedContact.set(mockContact);
      component.conversationId = 'c1';
    });

    it('should call sendMessage on service and append message locally', async () => {
      component.newMessage.set('  test message  ');

      component.sendMessage();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(chatsServiceMock.sendMessage).toHaveBeenCalledWith('c1', 'test message');
      expect(component.newMessage()).toBe('');
      expect(component.messages.length).toBe(1);
      expect(component.messages[0]).toEqual(
        expect.objectContaining({
          text: 'test message',
          senderId: 'u-current',
          receiverId: 'u-other',
          isRead: false,
        })
      );
    });

    it('should do nothing if message text is empty or blank', () => {
      component.newMessage.set('   ');

      component.sendMessage();

      expect(chatsServiceMock.sendMessage).not.toHaveBeenCalled();
    });

    it('should do nothing if conversationId is not set', () => {
      component.conversationId = '';
      component.newMessage.set('hello');

      component.sendMessage();

      expect(chatsServiceMock.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('filteredContacts', () => {
    it('should return all contacts when searchTerm is empty', () => {
      const mockContacts: ConversationSummaryOutput[] = [
        {
          publicId: 'c1',
          otherUser: { publicId: 'u2', username: 'Alice', photoUrl: null },
          lastMessage: null,
          createdAt: new Date(),
        },
        {
          publicId: 'c2',
          otherUser: { publicId: 'u3', username: 'Bob', photoUrl: null },
          lastMessage: null,
          createdAt: new Date(),
        },
      ];
      component.contacts = mockContacts;
      component.searchTerm.set('');

      expect(component.filteredContacts).toEqual(mockContacts);
    });

    it('should filter contacts by username case insensitively', () => {
      const mockContacts: ConversationSummaryOutput[] = [
        {
          publicId: 'c1',
          otherUser: { publicId: 'u2', username: 'Alice', photoUrl: null },
          lastMessage: null,
          createdAt: new Date(),
        },
        {
          publicId: 'c2',
          otherUser: { publicId: 'u3', username: 'Bob', photoUrl: null },
          lastMessage: null,
          createdAt: new Date(),
        },
      ];
      component.contacts = mockContacts;
      component.searchTerm.set('  li  '); // Alice contains 'li'

      expect(component.filteredContacts).toEqual([mockContacts[0]]);
    });
  });

  describe('openFilePicker', () => {
    it('should call click on native file input element', () => {
      fixture.detectChanges();
      const clickSpy = vi.fn();
      component.fileInput = {
        nativeElement: {
          click: clickSpy,
        } as unknown as HTMLInputElement,
      };

      component.openFilePicker();

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
