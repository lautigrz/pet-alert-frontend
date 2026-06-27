import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AdminNavbarComponent, FooterComponent, BottomNavComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private readonly router = inject(Router);

  readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/admin')),
    ),
    { initialValue: this.router.url.startsWith('/admin') },
  );
}
