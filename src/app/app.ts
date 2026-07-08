import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/presentation/toast/toast-container';
import { IosInstallBannerComponent } from './shared/component/ios-install-banner/ios-install-banner.component';
import { SocketService } from './core/services/socket.service';
import { TokenStorage } from './features/auth/infrastructure/token.storage';
import { AuthService } from './features/auth/application/auth.service';
import { ChatsService } from './features/chats/application/chats.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, IosInstallBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('pet-alert-frontend');
  private socketService = inject(SocketService);
  private tokenStorage = inject(TokenStorage);
  private authService = inject(AuthService);
  private chatsService = inject(ChatsService);

 ngOnInit(): void {
  const tokens = this.tokenStorage.read();

  if (tokens?.accessToken) {

    this.socketService.connect(
      tokens.accessToken,
      () => this.authService.refreshSession()
    );
  }
}


}
