import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

import { ReportDataPage } from './report-data-page';
import { CatalogService } from '../../../application/catalog.service';
import { ReportWizardService } from '../../../application/report-wizard.service';

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('ReportDataPage', () => {
  let fixture: ComponentFixture<ReportDataPage>;
  let component: ReportDataPage;
  let getBreeds: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getBreeds = vi.fn().mockImplementation((species: string) =>
      Promise.resolve(species === 'CAT' ? ['Siamés', 'Persa'] : ['Labrador', 'Caniche']),
    );

    TestBed.configureTestingModule({
      imports: [ReportDataPage],
      providers: [
        { provide: CatalogService, useValue: { getBreeds, getColors: vi.fn().mockResolvedValue([]) } },
        { provide: ReportWizardService, useValue: { inTransit: () => false, setPetData: vi.fn(), setSightingDetails: vi.fn() } },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(ReportDataPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga razas de perro por defecto', async () => {
    await flush();

    expect(getBreeds).toHaveBeenCalledWith('DOG');
    expect(component.breedOptions()).toEqual(['Labrador', 'Caniche']);
  });

  it('carga las razas de gato al seleccionar gato', async () => {
    component.petSpecies.set('gato');
    fixture.detectChanges();
    await flush();

    expect(getBreeds).toHaveBeenCalledWith('CAT');
    expect(component.breedOptions()).toEqual(['Siamés', 'Persa']);
  });

  it('resetea la raza seleccionada al cambiar de especie', async () => {
    component.petBreed.set('Labrador');
    component.petSpecies.set('gato');
    fixture.detectChanges();
    await flush();

    expect(component.petBreed()).toBe('');
  });
});
