import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { TokenStorage } from '../../../../auth/infrastructure/token.storage';

@Component({
  selector: 'app-report-type-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-type-page.html',
  styleUrl: './report-type-page.css',
})
export class ReportTypePage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);
  private tokenStorage = inject(TokenStorage);

  selectLost() {
    this.wizardService.setType('lost');
    const tokens = this.tokenStorage.read();
    if (!tokens?.accessToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/report/lost-data']);
  }

  selectFound() {
    this.router.navigate(['/report/found-type']);
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
