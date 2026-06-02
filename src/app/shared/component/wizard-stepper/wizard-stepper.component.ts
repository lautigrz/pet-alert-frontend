import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  templateUrl: './wizard-stepper.component.html',
})
export class WizardStepperComponent {
  @Input({ required: true }) current = 1;

  readonly steps = [
    { n: 1, label: 'Tipo' },
    { n: 2, label: 'Datos' },
    { n: 3, label: 'Ubicación' },
    { n: 4, label: 'Detalles' },
    { n: 5, label: 'Listo' },
  ];
}
