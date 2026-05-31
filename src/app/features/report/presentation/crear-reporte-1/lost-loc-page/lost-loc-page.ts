import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { Location } from '../../../domain/report.model';

@Component({
  selector: 'app-lost-loc-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lost-loc-page.html',
  styleUrl: './lost-loc-page.css',
})
export class LostLocationPage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  address = signal('');
  city = signal('');
  date = signal('');
  time = signal('');
  latitude = signal(0);
  longitude = signal(0);
  locating = signal(false);
  readonly today = new Date().toISOString().split('T')[0];

  useCurrentLocation() {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.latitude.set(pos.coords.latitude);
        this.longitude.set(pos.coords.longitude);
        this.locating.set(false);
      },
      () => { this.locating.set(false); }
    );
  }

  nextStep() {
    const location: Location = {
      address: this.address(),
      city: this.city(),
      latitude: this.latitude(),
      longitude: this.longitude(),
      lastSeen: new Date(`${this.date()}T${this.time()}`),
    };
    this.wizardService.setLocation(location);
    this.router.navigate(['/report/lost-review']);
  }

  previousStep() {
    this.router.navigate(['/report/lost-data']);
  }
}
