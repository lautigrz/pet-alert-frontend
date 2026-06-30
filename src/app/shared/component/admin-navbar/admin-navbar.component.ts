import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/application/auth.service';
import { ProfileService } from '../../../features/profile/application/profile.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './admin-navbar.component.html',
})
export class AdminNavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly defaultAvatar = 'https://ui-avatars.com/api/?name=PetFinder&background=e2e8f0&color=12355B&size=128';
  readonly nombreUsuario = signal('');
  readonly fotoUsuario = signal<string | null>(null);
  readonly menuAbierto = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const perfil = await this.profileService.getProfile();
      this.nombreUsuario.set(perfil.name?.trim() || perfil.username);
      this.fotoUsuario.set(perfil.photoUrl ?? null);
    } catch {
      this.nombreUsuario.set('');
    }
  }

  toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
