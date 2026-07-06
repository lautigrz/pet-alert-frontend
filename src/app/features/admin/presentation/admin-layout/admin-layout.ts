import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminNavbarComponent } from '../../../../shared/component/admin-navbar/admin-navbar.component';
import { FooterComponent } from '../../../../shared/component/footer/footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminNavbarComponent, FooterComponent],
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent {}
