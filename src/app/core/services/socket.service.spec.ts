import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SocketService } from './socket.service';
import { io } from 'socket.io-client';

let mockSocketEvents: Record<string, ((...args: unknown[]) => void)[]> = {};

const mockSocket = {
  connected: false,
  on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
    if (!mockSocketEvents[event]) {
      mockSocketEvents[event] = [];
    }
    mockSocketEvents[event].push(callback);
  }),
  off: vi.fn((event: string) => {
    delete mockSocketEvents[event];
  }),
  emit: vi.fn(),
  once: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
    if (!mockSocketEvents[event]) {
      mockSocketEvents[event] = [];
    }
    const wrapper = (...args: unknown[]) => {
      callback(...args);
      mockSocketEvents[event] = mockSocketEvents[event].filter(cb => cb !== wrapper);
    };
    mockSocketEvents[event].push(wrapper);
  }),
  disconnect: vi.fn(function (this: { connected: boolean }) {
    this.connected = false;
  }),
};

vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => mockSocket),
  };
});

function triggerSocketEvent(event: string, ...args: unknown[]) {
  if (mockSocketEvents[event]) {
    // Clone to avoid concurrent modification issues during execution
    const callbacks = [...mockSocketEvents[event]];
    callbacks.forEach(cb => cb(...args));
  }
}

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(() => {
    mockSocketEvents = {};
    mockSocket.connected = false;
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [SocketService],
    });
    service = TestBed.inject(SocketService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connect', () => {
    it('should call io with correct url and token', () => {
      service.connect('test-token');

      expect(io).toHaveBeenCalledWith('http://localhost:3000', {
        extraHeaders: {
          Authorization: 'Bearer test-token',
        },
      });
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should not reconnect if already connected', () => {
      // First call connects since socket is null/disconnected
      service.connect('test-token');
      expect(io).toHaveBeenCalledTimes(1);

      mockSocket.connected = true;

      // Second call should return early because socket is connected
      service.connect('another-token');
      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should handle connect_error with Authentication error and call refresh token callback successfully', async () => {
      const onAuthenticationErrorSpy = vi.fn().mockResolvedValue('new-token');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { /* noop */ });

      service.connect('old-token', onAuthenticationErrorSpy);

      // Trigger the connect_error event
      triggerSocketEvent('connect_error', new Error('Authentication error occurred'));

      // Allow microtasks to complete (since onAuthenticationError is async)
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onAuthenticationErrorSpy).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      // Should have re-called connect (which calls io again)
      expect(io).toHaveBeenLastCalledWith('http://localhost:3000', {
        extraHeaders: {
          Authorization: 'Bearer new-token',
        },
      });

      consoleLogSpy.mockRestore();
    });

    it('should handle connect_error with Authentication error but log error if callback fails', async () => {
      const onAuthenticationErrorSpy = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ });

      service.connect('old-token', onAuthenticationErrorSpy);

      triggerSocketEvent('connect_error', new Error('Authentication error occurred'));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onAuthenticationErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('No se pudo refrescar la sesión', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should ignore connect_error if it is not an authentication error', async () => {
      const onAuthenticationErrorSpy = vi.fn();
      service.connect('token', onAuthenticationErrorSpy);

      triggerSocketEvent('connect_error', new Error('Connection timed out'));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onAuthenticationErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should call socket.disconnect and clear socket reference', () => {
      service.connect('token');
      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isConnected).toBe(false);
    });
  });

  describe('emit', () => {
    it('should throw an error if socket is not initialized', () => {
      expect(() => service.emit('event', {})).toThrow('Socket no inicializado');
    });

    it('should emit immediately if connected', () => {
      service.connect('token');
      mockSocket.connected = true;

      service.emit('test-event', { data: 'test' });

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should queue emit until connect if not connected yet', () => {
      service.connect('token');
      mockSocket.connected = false;

      service.emit('test-event', { data: 'test' });

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(mockSocket.once).toHaveBeenCalledWith('connect', expect.any(Function));

      // Trigger the once wrapper callback
      mockSocket.connected = true;
      triggerSocketEvent('connect');

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });
  });

  describe('on', () => {
    it('should return an observable that emits socket events', () => {
      service.connect('token');

      let receivedData: unknown = null;
      const sub = service.on('message').subscribe(data => {
        receivedData = data;
      });

      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));

      triggerSocketEvent('message', { hello: 'world' });

      expect(receivedData).toEqual({ hello: 'world' });

      sub.unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('message');
    });
  });

  describe('isConnected', () => {
    it('should return connected status of the socket', () => {
      expect(service.isConnected).toBe(false);

      service.connect('token');
      expect(service.isConnected).toBe(false);

      mockSocket.connected = true;
      expect(service.isConnected).toBe(true);
    });
  });
});
