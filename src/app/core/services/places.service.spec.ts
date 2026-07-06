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

  describe('searchCentros', () => {
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

      const result = await service.searchCentros('veterinary', -34.6, -58.4, 5000);

      expect(result.map((l) => l.nombre)).toEqual(['Cerca', 'Lejos']);
      expect(result[0].distancia).toBe(0);
      expect(result[1].distancia).toBeGreaterThan(0);
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

      const result = await service.searchCentros('police', -34.6, -58.4, 5000);

      expect(result[0].nombre).toBe('Dependencia policial');
    });

    it('throws when the Overpass response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

      await expect(service.searchCentros('veterinary', -34.6, -58.4, 5000)).rejects.toThrow();
    });
  });
});
