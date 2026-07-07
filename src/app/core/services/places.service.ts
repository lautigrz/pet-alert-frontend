import { Injectable } from '@angular/core';

export interface LocationSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

export interface Place {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  address?: string;
}

export type PlaceType = 'veterinary' | 'police';

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
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
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

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      const address = data.address ?? {};
      const street = [address.road, address.house_number].filter(Boolean).join(' ');
      const neighborhood = address.suburb || address.neighbourhood || address.city_district;
      const city = address.city || address.town || address.village;
      const state = address.state;
      const parts = [street, neighborhood, city, state].filter(Boolean);
      return parts.length ? parts.join(', ') : (data.display_name ?? '');
    } catch {
      return '';
    }
  }

  async searchPlaces(
    type: PlaceType,
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<Place[]> {
    const filters =
      type === 'veterinary'
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
      ${filters}
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
        .map((element): Place | null => {
          const placeLat = element.lat ?? element.center?.lat;
          const placeLng = element.lon ?? element.center?.lon;

          if (placeLat === undefined || placeLng === undefined) {
            return null;
          }

          const name =
            element.tags?.name ||
            (type === 'police' ? 'Dependencia policial' : 'Centro veterinario');

          const street = [element.tags?.['addr:street'], element.tags?.['addr:housenumber']]
            .filter(Boolean)
            .join(' ');
          const address = [street, element.tags?.['addr:city']].filter(Boolean).join(', ') || undefined;

          return {
            name,
            lat: placeLat,
            lng: placeLng,
            distance: this.distanceKm(lat, lng, placeLat, placeLng),
            address,
          };
        })
        .filter((place): place is Place => place !== null)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
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
