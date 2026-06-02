import { Component,  OnInit, signal, inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../../../report/application/report.service';
import { ReportDetail } from '../../../../features/report/infrastructure/report.http';
import { GaleriaReporteComponent } from '../../components/galeria-reporte/galeria-reporte.component';
import { InfoReporteComponent } from '../../components/info-reporte/info-reporte.component';
import { UbicacionReporteComponent } from '../../components/ubicacion-reporte/ubicacion-reporte.component';
import { ContactoReporteComponent } from '../../components/contacto-reporte/contacto-reporte.component';

@Component({
  selector: 'app-detalle-reporte',
  standalone: true,
  imports: [
    CommonModule,
    GaleriaReporteComponent,
    InfoReporteComponent,
    UbicacionReporteComponent,
    ContactoReporteComponent,
  ],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './detalle-reporte.component.html',
  styleUrls: ['./detalle-reporte.component.css']
})

export class DetalleReporteComponent implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);

  report = signal<ReportDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;
    try {
      this.report.set(await this.reportService.getReportByPublicId(publicId));
    } catch {
      this.error.set('No se pudo cargar el reporte');
    } finally {
      this.loading.set(false);
    }
  }
}