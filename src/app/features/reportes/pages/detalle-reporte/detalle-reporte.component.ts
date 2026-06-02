import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class DetalleReporteComponent {

}