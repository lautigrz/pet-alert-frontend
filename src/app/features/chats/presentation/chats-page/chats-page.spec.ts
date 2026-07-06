import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
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
    sendImage: ReturnType<typeof vi.fn>;
    onPresenceStatus: ReturnType<typeof vi.fn>;
    onPresenceChanged: ReturnType<typeof vi.fn>;
    getPresence: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    getCurrentUserId: ReturnType<typeof vi.fn>;
  };

  let messageReceivedSubject: Subject<MessagePayload>;
  let messageReadSubject: Subject<{ conversationId: string }>;
  let errorSubject: Subject<{ message: string }>;
  let presenceStatusSubject: Subject<{ userPublicId: string; online: boolean }>;
  let presenceChangedSubject: Subject<{ userPublicId: string; online: boolean }>;

  let queryParam: string | null;

  beforeEach(() => {
    queryParam = null;
    messageReceivedSubject = new Subject<MessagePayload>();
    messageReadSubject = new Subject<{ conversationId: string }>();
    errorSubject = new Subject<{ message: string }>();
    presenceStatusSubject = new Subject<{ userPublicId: string; online: boolean }>();
    presenceChangedSubject = new Subject<{ userPublicId: string; online: boolean }>();

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
      sendImage: vi.fn().mockReturnValue(of({})),
      onPresenceStatus: vi.fn().mockReturnValue(presenceStatusSubject.asObservable()),
      onPresenceChanged: vi.fn().mockReturnValue(presenceChangedSubject.asObservable()),
      getPresence: vi.fn(),
    };

    authServiceMock = {
      getCurrentUserId: vi.fn().mockReturnValue('u-current'),
    };

    TestBed.configureTestingModule({
      imports: [ChatsPage],
      providers: [
        { provide: ChatsService, useValue: chatsServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => queryParam } } },
        },
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

  describe('deep link', () => {
    it('opens the conversation from the query param on init', async () => {
      queryParam = 'conv-123';

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(chatsServiceMock.getMessagesForConversation).toHaveBeenCalledWith('conv-123');
      expect(component.conversationId).toBe('conv-123');
      expect(component.selectedContact()?.publicId).toBe('conv-123');
    });

    it('does not open any conversation when there is no query param', () => {
      fixture.detectChanges();

      expect(chatsServiceMock.getMessagesForConversation).not.toHaveBeenCalled();
      expect(component.selectedContact()).toBeNull();
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

  describe('presence', () => {
    it('requests presence and resets state when selecting a contact', () => {
      fixture.detectChanges();
      const mockContact: ConversationSummaryOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: null,
        createdAt: new Date(),
      };

      component.contactOnline.set(true);
      component.selectContact(mockContact);

      expect(chatsServiceMock.getPresence).toHaveBeenCalledWith('u-other');
      expect(component.contactOnline()).toBe(false);
    });

    it('marks the contact online when presence:status matches the open contact', () => {
      fixture.detectChanges();
      component.selectedContact.set({
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: null,
        createdAt: new Date(),
      });

      presenceStatusSubject.next({ userPublicId: 'u-other', online: true });

      expect(component.contactOnline()).toBe(true);
    });

    it('ignores presence changes from a different user', () => {
      fixture.detectChanges();
      component.selectedContact.set({
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: null,
        createdAt: new Date(),
      });

      presenceChangedSubject.next({ userPublicId: 'someone-else', online: true });

      expect(component.contactOnline()).toBe(false);
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

  describe('onFileSelected', () => {
    it('should set selectedImageFile and use FileReader to read the image preview', async () => {
      fixture.detectChanges();
      const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.png'
        }
      } as unknown as Event;

      const mockFileReader = {
        result: 'data:image/png;base64,dummy',
        readAsDataURL: vi.fn(function(this: { onload?: (() => void) | null }) {
          if (this.onload) {
            this.onload();
          }
        }),
      };
      const originalFileReader = window.FileReader;
      window.FileReader = vi.fn(function(this: unknown) {
        return mockFileReader;
      }) as unknown as typeof FileReader;

      component.onFileSelected(mockEvent);

      expect(component.selectedImageFile()).toBe(mockFile);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
      expect(component.selectedImagePreview()).toBe('data:image/png;base64,dummy');
      expect((mockEvent.target as HTMLInputElement).value).toBe('');

      window.FileReader = originalFileReader;
    });

    it('should do nothing if no file is selected', () => {
      fixture.detectChanges();
      const mockEvent = {
        target: {
          files: []
        }
      } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.selectedImageFile()).toBeNull();
      expect(component.selectedImagePreview()).toBeNull();
    });
  });

  describe('clearSelectedImage', () => {
    it('should clear selectedImageFile and selectedImagePreview', () => {
      fixture.detectChanges();
      component.selectedImageFile.set(new File([], 'test.png'));
      component.selectedImagePreview.set('preview-url');

      component.clearSelectedImage();

      expect(component.selectedImageFile()).toBeNull();
      expect(component.selectedImagePreview()).toBeNull();
    });
  });

  describe('openImage and closeImage', () => {
    it('should open image and set activePreviewImageUrl', () => {
      fixture.detectChanges();
      component.openImage('http://test.com/image.png');
      expect(component.activePreviewImageUrl()).toBe('http://test.com/image.png');
    });

    it('should not set activePreviewImageUrl if no url is provided', () => {
      fixture.detectChanges();
      component.activePreviewImageUrl.set(null);
      component.openImage(undefined);
      expect(component.activePreviewImageUrl()).toBeNull();
    });

    it('should close image and clear activePreviewImageUrl', () => {
      fixture.detectChanges();
      component.activePreviewImageUrl.set('http://test.com/image.png');
      component.closeImage();
      expect(component.activePreviewImageUrl()).toBeNull();
    });
  });

  describe('getMessageImageUrl', () => {
    it('should return URL of the first image if present', () => {
      const message = {
        images: [
          { url: 'http://test.com/img1.png', publicId: '1' },
          { url: 'http://test.com/img2.png', publicId: '2' }
        ]
      };
      expect(component.getMessageImageUrl(message)).toBe('http://test.com/img1.png');
    });

    it('should return empty string if images array is empty or undefined', () => {
      expect(component.getMessageImageUrl({})).toBe('');
      expect(component.getMessageImageUrl({ images: [] })).toBe('');
    });
  });

  describe('sendMessage (with image)', () => {
    it('should send image via HTTP, do optimistic update, and update message details on success', async () => {
      fixture.detectChanges();
      const mockContact: ConversationSummaryOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: null,
        createdAt: new Date(),
      };
      component.selectedContact.set(mockContact);
      component.conversationId = 'c1';

      const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
      component.selectedImageFile.set(mockFile);
      component.selectedImagePreview.set('local-preview-url');
      component.newMessage.set('image description');

      const mockResponse: MessagePayload = {
        publicId: 'real-id-123',
        text: 'image description',
        senderId: 'u-current',
        receiverId: 'u-other',
        isRead: false,
        createdAt: new Date(),
        imageUrl: 'http://cloudinary/test.png',
        images: [{ publicId: 'img-1', url: 'http://cloudinary/test.png' }]
      };
      
      const sendImageSubject = new Subject<MessagePayload>();
      chatsServiceMock.sendImage.mockReturnValue(sendImageSubject.asObservable());

      component.sendMessage();

      expect(component.messages.length).toBe(1);
      const tempMessage = component.messages[0];
      expect(tempMessage.imageUrl).toBe('local-preview-url');
      expect(tempMessage.text).toBe('image description');
      expect(component.newMessage()).toBe('');
      expect(component.selectedImageFile()).toBeNull();
      expect(component.selectedImagePreview()).toBeNull();

      expect(chatsServiceMock.sendImage).toHaveBeenCalledWith('c1', mockFile, 'image description');

      sendImageSubject.next(mockResponse);
      sendImageSubject.complete();

      expect(component.messages.length).toBe(1);
      expect(component.messages[0].publicId).toBe('real-id-123');
      expect(component.messages[0].imageUrl).toBe('http://cloudinary/test.png');
      expect(component.messages[0].images).toEqual([{ publicId: 'img-1', url: 'http://cloudinary/test.png' }]);
    });

    it('should revert optimistic update and log error if sendImage fails', () => {
      fixture.detectChanges();
      const mockContact: ConversationSummaryOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u-other', username: 'user_other', photoUrl: null },
        lastMessage: null,
        createdAt: new Date(),
      };
      component.selectedContact.set(mockContact);
      component.conversationId = 'c1';

      const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
      component.selectedImageFile.set(mockFile);
      component.selectedImagePreview.set('local-preview-url');

      const sendImageSubject = new Subject<MessagePayload>();
      chatsServiceMock.sendImage.mockReturnValue(sendImageSubject.asObservable());
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });

      component.sendMessage();

      expect(component.messages.length).toBe(1);

      sendImageSubject.error(new Error('Upload failed'));

      expect(component.messages.length).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Error al enviar la imagen:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
