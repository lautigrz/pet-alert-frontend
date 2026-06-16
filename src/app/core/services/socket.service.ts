import { inject, Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from '../../features/auth/application/auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket: Socket | null = null;
  private string = 'http://localhost:3000';
  private authService = inject(AuthService);
  connect(token: string): void {
    if (this.socket?.connected) return; 
    console.log('Conectando socket con token:', token);
    console.log('URL del socket:', this.string);
    this.socket = io(this.string, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    this.socket.on('connect', () => console.log('Socket conectado'));
    this.socket.on('connect_error', async (err) => {
      console.error('Error de conexión:', err.message);

      if (err.message.includes('Authentication error')) {
        await this.authService.refreshSession();
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
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
    return new Observable(observer => {
      this.socket?.on(event, (data: T) => observer.next(data));

      return () => this.socket?.off(event);
    });
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}