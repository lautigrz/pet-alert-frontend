import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importamos el módulo de rutas

@Component({
  selector: 'app-contacto-reporte',
  standalone: true,
  imports: [CommonModule, RouterModule], // Agregamos RouterModule acá
  templateUrl: './contacto-reporte.component.html',
  styleUrls: ['./contacto-reporte.component.css']
})
export class ContactoReporteComponent {
  // Ruta hardcodeada por ahora, después podés concatenar el ID del usuario
  rutaPerfil: string = '/perfil'; 
}