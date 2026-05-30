import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { Location } from '../../../domain/report.model';

@Component({
  selector: 'app-report-loc-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-loc-page.html',
  styleUrl: './report-loc-page.css',
})
export class ReportLocationPage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  // signals para los campos
  address = signal('');
  city = signal('');
  date = signal('');
  time = signal('');
  latitude = signal(0);  
  longitude = signal(0);

  nextStep() {
    const location: Location = {
      address: this.address(),
      city: this.city(),
      latitude: this.latitude(),   
      longitude: this.longitude(), 
      lastSeen: new Date(`${this.date()}T${this.time()}`),
    };

    this.wizardService.setLocation(location);
    this.router.navigate(['/report/review']);
  }

  previousStep() {
    this.router.navigate(['/report/data']);
  }
}
