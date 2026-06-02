import { Component, computed, input } from '@angular/core';
import { ReportDetail } from '../../../report/infrastructure/report.http';

@Component({
  selector: 'app-contacto-reporte',
  standalone: true,
  templateUrl: './contacto-reporte.component.html',
  styleUrls: ['./contacto-reporte.component.css'],
})
export class ContactoReporteComponent {
  report = input.required<ReportDetail>();

  userPublicId = computed(() => this.report().user);
  //imagenUsuario = computed(() => this.report().user.pictureProfile);
}
