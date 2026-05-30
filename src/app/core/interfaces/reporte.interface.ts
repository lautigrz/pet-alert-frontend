export interface Reporte {

  id: number;

  nombre: string;

  descripcion: string;

  tipo: string;

  raza: string;

  fecha: string;

  ubicacion: string;

  imagenes: string[];

  usuario: {
    nombre: string;
    foto: string;
  };

}