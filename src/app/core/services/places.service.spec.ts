import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlacesService } from './places.service';

describe('PlacesService', () => {
  let service: PlacesService;

  beforeEach(() => {
    service = new PlacesService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('geocode', () => {
    it('returns an empty array without calling fetch when the query is blank', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.geocode('   ');

      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('maps the Nominatim response to location suggestions', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve([
            { display_name: 'Palermo, CABA', lat: '-34.57', lon: '-58.42' },
          ]),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.geocode('Palermo');

      expect(result).toEqual([
        { displayName: 'Palermo, CABA', lat: -34.57, lng: -58.42 },
      ]);
    });

    it('returns an empty array when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

      const result = await service.geocode('Palermo');

      expect(result).toEqual([]);
    });
  });

  describe('searchPlaces', () => {
    it('maps, sorts by distance and caps the Overpass results', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            elements: [
              { type: 'node', id: 2, lat: -34.62, lon: -58.44, tags: { name: 'Lejos' } },
              { type: 'node', id: 1, lat: -34.6, lon: -58.4, tags: { name: 'Cerca' } },
            ],
          }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.searchPlaces('veterinary', -34.6, -58.4, 5000);

      expect(result.map((l) => l.name)).toEqual(['Cerca', 'Lejos']);
      expect(result[0].distance).toBe(0);
      expect(result[1].distance).toBeGreaterThan(0);
    });

    it('builds the address with number from the element addr tags', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              elements: [
                {
                  type: 'node',
                  id: 1,
                  lat: -34.6,
                  lon: -58.4,
                  tags: {
                    name: 'Vet Central',
                    'addr:street': 'Av. Santa Fe',
                    'addr:housenumber': '1234',
                    'addr:city': 'Buenos Aires',
                  },
                },
              ],
            }),
        }),
      );

      const result = await service.searchPlaces('veterinary', -34.6, -58.4, 5000);

      expect(result[0].address).toBe('Av. Santa Fe 1234, Buenos Aires');
    });

    it('falls back to a default name per type when the element has no name', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({ elements: [{ type: 'node', id: 1, lat: -34.6, lon: -58.4 }] }),
        }),
      );

      const result = await service.searchPlaces('police', -34.6, -58.4, 5000);

      expect(result[0].name).toBe('Dependencia policial');
    });

    it('throws when the Overpass response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

      await expect(service.searchPlaces('veterinary', -34.6, -58.4, 5000)).rejects.toThrow();
    });
  });

  describe('reverseGeocode', () => {
    it('builds a concise address from the structured fields', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          json: () =>
            Promise.resolve({
              display_name: 'algo muy largo con todo',
              address: {
                road: 'Av. Santa Fe',
                house_number: '1234',
                suburb: 'Palermo',
                city: 'Buenos Aires',
                state: 'CABA',
              },
            }),
        }),
      );

      const result = await service.reverseGeocode(-34.6, -58.4);

      expect(result).toBe('Av. Santa Fe 1234, Palermo, Buenos Aires, CABA');
    });

    it('returns an empty string when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

      const result = await service.reverseGeocode(-34.6, -58.4);

      expect(result).toBe('');
    });
  });
});
