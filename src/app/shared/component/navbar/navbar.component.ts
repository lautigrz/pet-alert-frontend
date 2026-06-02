import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importamos el módulo de rutas
import { ProfileService } from '../../../features/profile/application/profile.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule], // Agregamos RouterModule acá
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private readonly profileService = inject(ProfileService);

  // Ruta hacia el perfil del usuario logueado
  rutaMiPerfil = '/profile/edit';
  // Ruta del logo (home). Todavia no existe la pantalla, pero queda preparada.
  rutaHome = '/inicio';

  // Datos del usuario autenticado (no hardcodeados)
  readonly nombreUsuario = signal('');
  readonly fotoUsuario = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const perfil = await this.profileService.getProfile();
      this.nombreUsuario.set(perfil.name?.trim() || perfil.username);
      this.fotoUsuario.set(perfil.photoUrl ?? null);
    } catch {
      // Si falla (sin sesion, etc.) el navbar igual se muestra sin datos de usuario
    }
  }
}