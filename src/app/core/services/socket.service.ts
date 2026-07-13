import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket: Socket | null = null;
  private readonly socket$ = new BehaviorSubject<Socket | null>(null);
  private string = environment.apiUrl.replace(/\/api\/?$/, '');

  connect(token: string, onAuthenticationError?: () => Promise<string>): void {
    if (this.socket?.connected) return;
    this.socket = io(this.string, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    this.socket$.next(this.socket);

    this.socket.on('connect', () => console.log('Socket conectado'));
    this.socket.on('connect_error', async (err) => {
      if (
        err.message.includes('Authentication error') &&
        onAuthenticationError
      ) {
        try {
          const newToken = await onAuthenticationError();

          this.disconnect();
          this.connect(newToken, onAuthenticationError);
        } catch (error) {
          console.error('No se pudo refrescar la sesión', error);
        }
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.socket$.next(null);
  }


  emit(event: string, data: unknown): void {
    if (!this.socket) throw new Error('Socket no inicializado');

    if (this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      this.socket.once('connect', () => this.socket?.emit(event, data));
    }
  }

  on<T>(event: string): Observable<T> {
    return this.socket$.pipe(
      switchMap((socket) => {
        if (!socket) {
          return EMPTY;
        }
        return new Observable<T>((observer) => {
          const listener = (data: T) => observer.next(data);
          socket.on(event, listener);
          return () => {
            socket.off(event, listener);
          };
        });
      })
    );
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}