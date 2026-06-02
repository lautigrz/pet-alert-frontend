import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProfileService } from '../../../features/profile/application/profile.service';
import { AuthService } from '../../../features/auth/application/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  rutaHome = '/home';
  rutaMiPerfil = '/profile/edit';
  defaultAvatar = 'https://ui-avatars.com/api/?name=PetFinder&background=e2e8f0&color=12355B&size=128';

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

  nuevoReporte(): void {
    this.router.navigate(['/report/type']);
  }

  toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  async cerrarSesion(): Promise<void> {
    this.menuAbierto.set(false);
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
