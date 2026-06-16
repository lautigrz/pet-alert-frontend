import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/presentation/toast/toast-container';
import { SocketService } from './core/services/socket.service';
import { TokenStorage } from './features/auth/infrastructure/token.storage';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('pet-alert-frontend');
  private socketService = inject(SocketService);
  private tokenStorage = inject(TokenStorage);
  
  ngOnInit(): void {
    const tokens = this.tokenStorage.read();
    if (tokens?.accessToken) {
      this.socketService.connect(tokens.accessToken);
    }
  }



}
