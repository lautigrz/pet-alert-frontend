import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WizardStepperComponent } from '../../../../../shared/component/wizard-stepper/wizard-stepper.component';
import { ReportWizardService } from '../../../application/report-wizard.service';

type FoundChoice = 'sighting' | 'transit';

@Component({
  selector: 'app-report-found-type-page',
  standalone: true,
  imports: [RouterLink, WizardStepperComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-found-type-page.html',
})
export class ReportFoundTypePage {
  private readonly router = inject(Router);
  private readonly wizard = inject(ReportWizardService);

  readonly selectedType = signal<FoundChoice | null>(null);

  select(type: FoundChoice): void {
    this.selectedType.set(type);
  }

  next(): void {
    const choice = this.selectedType();
    if (!choice) {
      return;
    }
    this.wizard.setType('sighting');
    this.wizard.setInTransit(choice === 'transit');
    this.router.navigate(['/report/data']);
  }

  back(): void {
    this.router.navigate(['/report/type']);
  }
}
