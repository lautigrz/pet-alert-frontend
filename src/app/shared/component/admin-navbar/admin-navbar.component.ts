import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/application/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './admin-navbar.component.html',
})
export class AdminNavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
