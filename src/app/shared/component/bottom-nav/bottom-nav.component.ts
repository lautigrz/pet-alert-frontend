import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './bottom-nav.component.html',
})
export class BottomNavComponent {
  private readonly router = inject(Router);

  rutaHome = '/home';
  rutaMiPerfil = '/profile';

  nuevoReporte(): void {
    this.router.navigate(['/report/type']);
  }
}
