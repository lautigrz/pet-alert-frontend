import { Component, computed, input } from '@angular/core';
import { ReportDetail } from '../../../report/infrastructure/report.http';

@Component({
  selector: 'app-ubicacion-reporte',
  standalone: true,
  templateUrl: './ubicacion-reporte.component.html',
  styleUrls: ['./ubicacion-reporte.component.css'],
})
export class UbicacionReporteComponent {
  report = input.required<ReportDetail>();

  direccion = computed(() => this.report().location.address || 'Sin ubicacion');
  imagenMascota = computed(() => this.report().details.images[0]?.url ?? null);
}
