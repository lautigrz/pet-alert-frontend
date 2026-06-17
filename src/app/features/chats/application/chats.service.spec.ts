import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatsService } from './chats.service';
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
          otherUser: { publicId: 'u2', username: 'john_doe', photoUrl: null },
          lastMessage: { text: 'hey', isRead: true, createdAt: new Date() },
          createdAt: new Date(),
        },
      ];

      service.getConversations().subscribe(res => {
        expect(res).toEqual(mockConversations);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/conversations/my-conversations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConversations);
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
      };

      service.getMessagesForConversation('c1').subscribe(res => {
        expect(res).toEqual(mockConversation);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/conversations/c1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConversation);
    });
  });
});
