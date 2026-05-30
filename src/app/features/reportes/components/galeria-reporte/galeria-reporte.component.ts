import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importamos para poder usar *ngIf en el HTML

@Component({
  selector: 'app-galeria-reporte',
  standalone: true,
  imports: [CommonModule], // Agregamos CommonModule acá
  templateUrl: './galeria-reporte.component.html',
  styleUrls: ['./galeria-reporte.component.css']
})
export class GaleriaReporteComponent {
  // URL de la imagen principal para renderizarla de forma dinámica
  imagenPrincipalUrl: string = 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1200&auto=format&fit=crop';

  // Esta variable guarda la URL de la imagen que se va a mostrar en pantalla completa. 
  // Si es null, el modal se oculta automáticamente.
  imagenSeleccionada: string | null = null;

  // Función que se ejecuta al hacer clic en cualquier imagen
  abrirImagen(url: string): void {
    this.imagenSeleccionada = url;
  }

  // Función para cerrar el modal al hacer clic afuera o en la 'X'
  cerrarImagen(): void {
    this.imagenSeleccionada = null;
  }
}
