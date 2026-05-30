import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GaleriaReporteComponent } from '../../components/galeria-reporte/galeria-reporte.component';
import { InfoReporteComponent } from '../../components/info-reporte/info-reporte.component';
import { UbicacionReporteComponent } from '../../components/ubicacion-reporte/ubicacion-reporte.component';
import { ContactoReporteComponent } from '../../components/contacto-reporte/contacto-reporte.component';
import { NavbarComponent } from '../../../../shared/component/navbar/navbar.component';
import { Reporte } from '../../../../core/interfaces/reporte.interface';

@Component({
  selector: 'app-detalle-reporte',
  standalone: true,
  imports: [
    CommonModule,
    GaleriaReporteComponent,
    InfoReporteComponent,
    UbicacionReporteComponent,
    ContactoReporteComponent, NavbarComponent,
  ],
  templateUrl: './detalle-reporte.component.html',
  styleUrls: ['./detalle-reporte.component.css']
})
export class DetalleReporteComponent {

}