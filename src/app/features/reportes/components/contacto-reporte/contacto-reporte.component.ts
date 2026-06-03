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
  username = computed(() => this.report().user.username);
  imagenUsuario = computed(() => this.report().user.photoUrl || 'https://i.pinimg.com/474x/a8/da/22/a8da222be70a71e7858bf752065d5cc3.jpg');
}
