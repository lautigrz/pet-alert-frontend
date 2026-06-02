import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WizardStepperComponent } from '../../../../../shared/component/wizard-stepper/wizard-stepper.component';
import { ReportWizardService } from '../../../application/report-wizard.service';

type ReportChoice = 'lost' | 'found';

@Component({
  selector: 'app-report-type-page',
  standalone: true,
  imports: [RouterLink, WizardStepperComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-type-page.html',
})
export class ReportTypePage {
  private readonly router = inject(Router);
  private readonly wizard = inject(ReportWizardService);

  readonly selectedType = signal<ReportChoice | null>(null);

  select(type: ReportChoice): void {
    this.selectedType.set(type);
  }

  next(): void {
    const type = this.selectedType();
    if (type === 'lost') {
      this.wizard.setType('lost');
      this.router.navigate(['/report/lost-data']);
    } else if (type === 'found') {
      this.router.navigate(['/report/found-type']);
    }
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }
}
