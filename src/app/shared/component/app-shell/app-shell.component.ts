import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { ChatsService } from '../../../features/chats/application/chats.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    BottomNavComponent
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {

  private chatsService = inject(ChatsService);

  ngOnInit(): void {
    this.chatsService.initializeSocketListeners();
    this.chatsService.refreshUnreadChats();
  }
}