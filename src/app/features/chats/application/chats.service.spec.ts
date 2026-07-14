import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatsService, MessagePayload } from './chats.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';
import { of } from 'rxjs';
import { ConversationOutput, ConversationSummaryOutput } from '../domain/chat.models';

describe('ChatsService', () => {
  let service: ChatsService;
  let httpMock: HttpTestingController;
  let socketServiceMock: {
    emit: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    socketServiceMock = {
      emit: vi.fn(),
      on: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SocketService, useValue: socketServiceMock },
      ],
    });

    service = TestBed.inject(ChatsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendMessage', () => {
    it('should emit message:send event via SocketService', () => {
      service.sendMessage('conv-123', 'Hello world');
      expect(socketServiceMock.emit).toHaveBeenCalledWith('message:send', {
        conversationId: 'conv-123',
        text: 'Hello world',
      });
    });
  });

  describe('sendImage', () => {
    it('should send an image message using FormData via HTTP POST', () => {
      const mockFile = new File(['image-content'], 'test.png', { type: 'image/png' });
      const mockResponse: MessagePayload = {
        publicId: 'm-img',
        text: 'Hello with image',
        senderId: 'u-current',
        receiverId: 'u-other',
        isRead: false,
        createdAt: new Date(),
        imageUrl: 'http://cloudinary/test.png',
        conversationId: 'conv-123',
        images: [{ publicId: 'img-1', url: 'http://cloudinary/test.png' }],
      };

      service.sendImage('conv-123', mockFile, 'Hello with image').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/messages`);
      expect(req.request.method).toBe('POST');

      const body = req.request.body;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('photos')).toBe(mockFile);

      const dataStr = body.get('data') as string;
      expect(JSON.parse(dataStr)).toEqual({
        conversationId: 'conv-123',
        content: 'Hello with image',
      });

      req.flush(mockResponse);
    });

    it('should use empty string as default content if text is not provided', () => {
      const mockFile = new File(['image-content'], 'test.png', { type: 'image/png' });

      service.sendImage('conv-123', mockFile).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/messages`);
      const body = req.request.body;
      const dataStr = body.get('data') as string;
      expect(JSON.parse(dataStr)).toEqual({
        conversationId: 'conv-123',
        content: '',
      });
      req.flush({});
    });
  });

  describe('onMessageSent', () => {
    it('should return socketService.on for message:sent', () => {
      const mockObservable = of({});
      socketServiceMock.on.mockReturnValue(mockObservable);

      const result = service.onMessageSent();

      expect(socketServiceMock.on).toHaveBeenCalledWith('message:sent');
      expect(result).toBe(mockObservable);
    });
  });

  describe('onMessageReceived', () => {
    it('should return socketService.on for message:received', () => {
      const mockObservable = of({});
      socketServiceMock.on.mockReturnValue(mockObservable);

      const result = service.onMessageReceived();

      expect(socketServiceMock.on).toHaveBeenCalledWith('message:received');
      expect(result).toBe(mockObservable);
    });
  });

  describe('readMessage', () => {
    it('should emit message:read event via SocketService', () => {
      service.readMessage('conv-123');
      expect(socketServiceMock.emit).toHaveBeenCalledWith('message:read', {
        conversationId: 'conv-123',
      });
    });
  });

  describe('onMessageRead', () => {
    it('should return socketService.on for message:read', () => {
      const mockObservable = of({});
      socketServiceMock.on.mockReturnValue(mockObservable);

      const result = service.onMessageRead();

      expect(socketServiceMock.on).toHaveBeenCalledWith('message:read');
      expect(result).toBe(mockObservable);
    });
  });

  describe('onError', () => {
    it('should return socketService.on for message:error', () => {
      const mockObservable = of({});
      socketServiceMock.on.mockReturnValue(mockObservable);

      const result = service.onError();

      expect(socketServiceMock.on).toHaveBeenCalledWith('message:error');
      expect(result).toBe(mockObservable);
    });
  });

  describe('getConversations', () => {
    it('should fetch conversations via HTTP GET', () => {
      const mockConversations: ConversationSummaryOutput[] = [
        {
          publicId: 'c1',
          unreadCount: 0,
          otherUser: { publicId: 'u2', username: 'john_doe', photoUrl: null },
          lastMessage: { text: 'hey', isRead: true, createdAt: new Date() },
          createdAt: new Date(),
        },
      ];

      service.getConversations().subscribe((res) => {
        expect(res).toEqual(mockConversations);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/conversations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConversations);
    });

    it('returns the created conversation id when creation succeeds', async () => {
      const response = {
        publicId: 'conv-1',
        createdAt: '',
      };

      const spy = vi.spyOn(service, 'createConversation').mockReturnValue(of(response));

      const result = await service.getOrCreateConversation('user-1');

      expect(spy).toHaveBeenCalledWith('user-1');
      expect(result).toBe('conv-1');
    });

    it('returns an existing conversation when creation fails', async () => {
      vi.spyOn(service, 'createConversation').mockImplementation(() => {
        throw new Error();
      });

      vi.spyOn(service, 'getConversations').mockReturnValue(
        of([
          {
            publicId: 'existing',
            unreadCount: 0,
            otherUser: {
              publicId: 'user-1',
              username: 'juan',
              photoUrl: null,
            },
            lastMessage: {
              text: '',
              isRead: true,
              createdAt: new Date(),
            },
            createdAt: new Date(),
          },
        ]),
      );

      const result = await service.getOrCreateConversation('user-1');

      expect(result).toBe('existing');
    });

    it('throws an error when the conversation cannot be opened', async () => {
      vi.spyOn(service, 'createConversation').mockImplementation(() => {
        throw new Error();
      });

      vi.spyOn(service, 'getConversations').mockReturnValue(of([]));

      await expect(service.getOrCreateConversation('user-1')).rejects.toThrow(
        'No se pudo abrir el chat',
      );
    });
  });

  describe('getMessagesForConversation', () => {
    it('should fetch conversation messages via HTTP GET', () => {
      const mockConversation: ConversationOutput = {
        publicId: 'c1',
        otherUser: { publicId: 'u2', username: 'john_doe', photoUrl: '' },
        messages: [
          {
            publicId: 'm1',
            text: 'hey',
            senderId: 'u2',
            isRead: true,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        isSuspended: false,
      };

      service.getMessagesForConversation('c1').subscribe((res) => {
        expect(res).toEqual(mockConversation);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/conversations/c1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConversation);
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation via HTTP POST', () => {
      const response = {
        publicId: 'conv-123',
        createdAt: '2026-07-14T10:00:00Z',
      };

      service.createConversation('user-999').subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/conversations`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        publicTargetId: 'user-999',
      });

      req.flush(response);
    });
  });
  describe('setUnreadChats', () => {
    it('updates the unread chats counter', () => {
      service.setUnreadChats(7);

      expect(service.getUnreadChats()).toBe(7);
    });

    it('counts conversations with unread messages', () => {
      vi.spyOn(service, 'getConversations').mockReturnValue(
        of([
          {
            unreadCount: 2,
          },
          {
            unreadCount: 0,
          },
          {
            unreadCount: 5,
          },
        ] as ConversationSummaryOutput[]),
      );

      service.refreshUnreadChats();

      expect(service.getUnreadChats()).toBe(2);
    });
  });
});
