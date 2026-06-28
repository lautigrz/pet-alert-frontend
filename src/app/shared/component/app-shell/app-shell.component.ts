import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

import { ChatsService } from '../../../features/chats/application/chats.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    AdminNavbarComponent,
    FooterComponent,
    BottomNavComponent,
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly chatsService = inject(ChatsService);

  readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/admin'))
    ),
    {
      initialValue: this.router.url.startsWith('/admin'),
    }
  );

  ngOnInit(): void {
    this.chatsService.initializeSocketListeners();
    this.chatsService.refreshUnreadChats();
  }
}