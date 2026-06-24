export type ReportType = 'LOST' | 'SIGHTING';
export type AnimalType = 'DOG' | 'CAT';
export type ReportStatus = 'ACTIVE' | 'RESOLVED' | 'CLOSED';

export interface ReporteImagen {
  url: string;
}

export interface ReporteUbicacion {
  address: string;
  latitude: number;
  longitude: number;
}

export interface SightingDetails {
  petName: string;
  animalType: string;
  hasIdCollar: boolean;
  isInTransit: boolean;
  color: string;
  images: ReporteImagen[];
}

export interface LostDetails {
  publicId: string;
  name: string;
  animalType: string;
  genderType: string;
  sizeType: string;
  color: string;
  hasIdCollar: boolean;
  breed: string;
  images: ReporteImagen[];
}

export interface Reporte {
  publicId: string;
  user: { publicId: string };
  type: string;
  status: string;
  description: string;
  location: ReporteUbicacion;
  details: SightingDetails | LostDetails;
  occurredAt: string;
  createdAt: string;
}

export interface ReporteFiltros {
  reportType?: ReportType;
  animalType?: AnimalType;
  status?: ReportStatus;
  createdFrom?: string;
  createdTo?: string;
  userPublicId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: 'recent';
  q?:string,
}

export interface Paginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReportesPaginados {
  data: Reporte[];
  pagination: Paginacion;
}
