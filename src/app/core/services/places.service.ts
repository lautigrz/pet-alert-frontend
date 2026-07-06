import { Injectable } from '@angular/core';

export interface LocationSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

export interface Lugar {
  nombre: string;
  lat: number;
  lng: number;
  distancia?: number;
}

export type CentroTipo = 'veterinary' | 'police';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    amenity?: string;
    healthcare?: string;
    office?: string;
    police?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PlacesService {

  async geocode(query: string): Promise<LocationSuggestion[]> {
    const term = query.trim();
    if (!term) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(term)}`,
      );
      const data = await res.json();
      return data.map((r: { display_name: string; lat: string; lon: string }) => ({
        displayName: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }));
    } catch {
      return [];
    }
  }

  async searchCentros(
    tipo: CentroTipo,
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<Lugar[]> {
    const filtros =
      tipo === 'veterinary'
        ? `
        node["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
        way["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
        relation["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});

        node["healthcare"="veterinary"](around:${radiusMeters},${lat},${lng});
        way["healthcare"="veterinary"](around:${radiusMeters},${lat},${lng});
        relation["healthcare"="veterinary"](around:${radiusMeters},${lat},${lng});
      `
        : `
        node["amenity"="police"](around:${radiusMeters},${lat},${lng});
        way["amenity"="police"](around:${radiusMeters},${lat},${lng});
        relation["amenity"="police"](around:${radiusMeters},${lat},${lng});
      `;

    const query = `
    [out:json][timeout:20];
    (
      ${filtros}
    );
    out center tags;
  `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Error Overpass: ${response.status}`);
      }

      const data = (await response.json()) as { elements: OverpassElement[] };

      return data.elements
        .map((l): Lugar | null => {
          const lugarLat = l.lat ?? l.center?.lat;
          const lugarLng = l.lon ?? l.center?.lon;

          if (lugarLat === undefined || lugarLng === undefined) {
            return null;
          }

          const nombre =
            l.tags?.name ||
            (tipo === 'police' ? 'Dependencia policial' : 'Centro veterinario');

          return {
            nombre,
            lat: lugarLat,
            lng: lugarLng,
            distancia: this.distanceKm(lat, lng, lugarLat, lugarLng),
          };
        })
        .filter((lugar): lugar is Lugar => lugar !== null)
        .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0))
        .slice(0, 15);
    } finally {
      clearTimeout(timeout);
    }
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
