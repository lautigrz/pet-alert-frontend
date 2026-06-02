export type ReportType = 'lost' | 'sighting';

export interface Pet {
  species: 'perro' | 'gato';
  gender: 'macho' | 'hembra';
  size: 'pequeño' | 'mediano' | 'grande';
  name: string;
  breed: string;
  color?: string;
  description?: string;
  hasIdentification?: 'si' | 'no';
  vaccinated?: 'si' | 'no';
  imageUrl?: string;
  imageUrls?: string[];
}

export interface SightingDetails {
  animalType: 'perro' | 'gato';
  hasIdCollar: boolean;
  isInTransit: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  lastSeen?: Date;
}

export interface Contact {
  phone: string;
  email: string;
  userName: string;
}

export interface PetReport {
  type: 'lost' | 'sighting';
  pet?: Pet;
  sightingDetails?: SightingDetails;
  location: Location;
  contact: Contact;
  createdAt?: Date;
  id?: string;
}
