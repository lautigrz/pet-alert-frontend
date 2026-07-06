import { describe, it, expect, vi } from 'vitest';
import { buildPlacePinIcon } from './place-pin';

vi.mock('leaflet', () => ({
  divIcon: vi.fn().mockImplementation((options) => ({ options })),
}));

describe('buildPlacePinIcon', () => {
  it('uses the vet icon for veterinary', () => {
    const icon = buildPlacePinIcon('veterinary') as unknown as { options: { html: string } };

    expect(icon.options.html).toContain('circle');
  });

  it('uses the police icon for police', () => {
    const icon = buildPlacePinIcon('police') as unknown as { options: { html: string } };

    expect(icon.options.html).toContain('<path');
    expect(icon.options.html).not.toContain('circle');
  });
});
