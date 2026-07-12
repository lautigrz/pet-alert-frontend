import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule, Router } from '@angular/router';
import { ChatsService } from '../../../features/chats/application/chats.service';


@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './bottom-nav.component.html',
})
export class BottomNavComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly chatsService = inject(ChatsService);
  readonly unreadChats = toSignal(
    this.chatsService.unreadChats$,
    { initialValue: 0 }
  );
  rutaHome = '/home';
  rutaMiPerfil = '/profile';

  nuevoReporte(): void {
    this.router.navigate(['/report/type']);
  }

  async ngOnInit(): Promise<void> {
    this.chatsService.refreshUnreadChats();

  }
}
