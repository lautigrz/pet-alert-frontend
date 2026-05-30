import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-home-map',
  standalone: true,
  templateUrl: './home-map.html',
  styleUrls: ['./home-map.css'],
})
export class HomeMapComponent implements AfterViewInit {
  private map!: L.Map;

  private readonly DEFAULT_LOCATION = {
    lat: -34.603734,
    lng: -58.38157,
  };

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    this.map = L.map('map').setView(
      [
        this.DEFAULT_LOCATION.lat,
        this.DEFAULT_LOCATION.lng,
      ],
      13
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
      }
    ).addTo(this.map);

    this.getUserLocation();

    // Fuerza a Leaflet a recalcular el tamaño del mapa
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  private getUserLocation(): void {
    console.log('Intentando obtener ubicación');

    if (!navigator.geolocation) {
      console.log('Geolocation no soportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Ubicación obtenida');

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.map.setView([lat, lng], 15);

        L.marker([lat, lng]).addTo(this.map);

        // Recalcular tamaño nuevamente después de mover el mapa
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);

        this.map.setView(
          [
            this.DEFAULT_LOCATION.lat,
            this.DEFAULT_LOCATION.lng,
          ],
          13
        );

        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }
    );
  }
}