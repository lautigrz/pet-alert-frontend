import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { MeetingPointModalComponent } from './meeting-point-modal';
import { PlacesService } from '../../../../core/services/places.service';

vi.mock('leaflet', () => {
  const createLayerMock = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  });

  const mapMock = {
    setView: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    attributionControl: { setPrefix: vi.fn() },
  };

  return {
    map: vi.fn().mockReturnValue(mapMock),
    tileLayer: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis() }),
    layerGroup: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() }),
    marker: vi.fn().mockImplementation(createLayerMock),
    circleMarker: vi.fn().mockImplementation(createLayerMock),
    divIcon: vi.fn().mockImplementation((options) => ({ options })),
    latLng: vi.fn().mockImplementation((lat: number, lng: number) => ({ lat, lng })),
  };
});

describe('MeetingPointModalComponent', () => {
  let placesServiceMock: {
    geocode: ReturnType<typeof vi.fn>;
    searchPlaces: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    placesServiceMock = {
      geocode: vi.fn().mockResolvedValue([]),
      searchPlaces: vi.fn().mockResolvedValue([]),
    };

    TestBed.configureTestingModule({
      imports: [MeetingPointModalComponent],
      providers: [{ provide: PlacesService, useValue: placesServiceMock }],
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
  });

  function createComponent(): ComponentFixture<MeetingPointModalComponent> {
    const fixture = TestBed.createComponent(MeetingPointModalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('creates the component and searches places on init', () => {
    const fixture = createComponent();

    expect(fixture.componentInstance).toBeTruthy();
    expect(placesServiceMock.searchPlaces).toHaveBeenCalled();
  });

  it('switches the type and searches again', () => {
    const component = createComponent().componentInstance;

    component.selectType('police');

    expect(component.type()).toBe('police');
    expect(placesServiceMock.searchPlaces).toHaveBeenLastCalledWith(
      'police',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('centers on the selected suggestion and searches there', () => {
    const component = createComponent().componentInstance;

    component.selectSuggestion({ displayName: 'Palermo, CABA', lat: -34.57, lng: -58.42 });

    expect(component.searchTerm()).toBe('Palermo, CABA');
    expect(component.suggestions()).toEqual([]);
    expect(placesServiceMock.searchPlaces).toHaveBeenLastCalledWith(
      'veterinary',
      -34.57,
      -58.42,
      expect.any(Number),
    );
  });

  it('starts at the user location when geolocation is available', () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({ coords: { latitude: -31.42, longitude: -64.18 } } as GeolocationPosition),
      },
    });

    createComponent();

    expect(placesServiceMock.searchPlaces).toHaveBeenLastCalledWith(
      'veterinary',
      -31.42,
      -64.18,
      expect.any(Number),
    );
  });

  it('emits closed when close is called', () => {
    const component = createComponent().componentInstance;
    const spy = vi.fn();
    component.closed.subscribe(spy);

    component.close();

    expect(spy).toHaveBeenCalled();
  });

  it('emits the selected place', () => {
    const component = createComponent().componentInstance;
    const spy = vi.fn();
    component.placeSelected.subscribe(spy);

    component.selectPlace({ name: 'Vet Central', lat: -34.6, lng: -58.4, distance: 1.2 });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Vet Central', lat: -34.6, lng: -58.4 }),
    );
  });
});
