import { Component, AfterViewInit, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { ReportService } from '../../../report/application/report.service';
import { ReportDetail } from '../../../report/infrastructure/report.http';
import { Router } from '@angular/router';
import { MissionService } from '../../application/mission.service';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../shared/application/toast.service';

@Component({
  selector: 'app-create-mission',
  standalone: true,
  imports: [CommonModule,
  FormsModule],
  templateUrl: './create-mission.html',
  styleUrl: './create-mission.css'
})


export class CreateMissionPage implements OnInit, AfterViewInit {

  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  private readonly missionService = inject(MissionService);
  private readonly toastService = inject(ToastService);
  private missionCircle?: L.Circle;
  private missionMarker?: L.Marker;

  reportId = '';
  report?: ReportDetail;
  radio = 1000;
  step = 1;

  titulo = '';

  descripcion = '';

  
  private map!: L.Map;
  @ViewChild('missionMap')missionMap!: ElementRef<HTMLDivElement>;

 async ngOnInit(): Promise<void> {

  this.reportId =
    this.route.snapshot.paramMap.get('publicId') ?? '';

  console.log('Reporte:', this.reportId);

  this.report =
    await this.reportService.getReportByPublicId(
      this.reportId
    );

  console.log(this.report);

}

volver(): void {

  this.router.navigate(['/reports', this.reportId]);

}

ngAfterViewInit(): void {

  setTimeout(() => {
    if (!this.missionMap) return;

    const lat = this.report?.location.latitude ?? -34.6037;
    const lng = this.report?.location.longitude ?? -58.3816;

    this.map = L.map(this.missionMap.nativeElement).setView(
      [lat, lng],
      16
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap'
      }
    ).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const posicion = event.latlng;
      if (this.missionMarker) {
        this.missionMarker.setLatLng(posicion);
      }
      if (this.missionCircle) {
        this.missionCircle.setLatLng(posicion);
      }
    });

    this.mostrarMision();

    this.map.invalidateSize();

  }, 100);

}

private inicializarMapa(): void {

  if (this.map) {
    this.map.invalidateSize();
    return;
  }

  if (!this.missionMap) return;

  const lat = this.report?.location.latitude ?? -34.6037;
  const lng = this.report?.location.longitude ?? -58.3816;

  this.map = L.map(this.missionMap.nativeElement).setView(
    [lat, lng],
    16
  );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap'
    }
  ).addTo(this.map);

  this.map.on('click', (event: L.LeafletMouseEvent) => {
    const posicion = event.latlng;
    if (this.missionMarker) {
      this.missionMarker.setLatLng(posicion);
    }
    if (this.missionCircle) {
      this.missionCircle.setLatLng(posicion);
    }
  });

  this.mostrarMision();

  this.map.invalidateSize();

}

private centrarEnReporte(): void {

  if (!this.report) return;

  this.map.setView(
    [
      this.report.location.latitude,
      this.report.location.longitude
    ],
    16
  );

  L.circle(
    [
      this.report.location.latitude,
      this.report.location.longitude
    ],
    {
      radius: 1000,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.20,
      weight: 3
    }
  ).addTo(this.map);

}

private mostrarMision(): void {

  if (!this.report) return;

  const lat = this.report.location.latitude;
  const lng = this.report.location.longitude;

  this.map.setView([lat, lng], 16);

  if (this.missionCircle) {
    this.map.removeLayer(this.missionCircle);
  }

  if (this.missionMarker) {
    this.map.removeLayer(this.missionMarker);
  }

  this.missionCircle = L.circle([lat, lng], {
    radius: this.radio,
    color: '#2563eb',
    fillColor: '#3b82f6',
    fillOpacity: 0.25,
    weight: 3
  }).addTo(this.map);

  const missionIcon = L.divIcon({

    html: `
      <div
        style="
          width:24px;
          height:24px;
          border-radius:50%;
          background:#2563eb;
          border:4px solid white;
          box-shadow:0 0 12px rgba(37,99,235,.5);
        ">
      </div>
    `,

    className: '',

    iconSize: [24, 24],

    iconAnchor: [12, 12]

  });

  this.missionMarker = L.marker(
    [lat, lng],
    {
      icon: missionIcon,
      draggable: true
    }
  ).addTo(this.map);

  this.missionMarker.on('drag', () => {

    const posicion = this.missionMarker!.getLatLng();

    this.missionCircle!.setLatLng(posicion);

  });

}

cambiarRadio(event: Event): void {

  this.radio = Number(
    (event.target as HTMLInputElement).value
  );

  this.missionCircle?.setRadius(this.radio);

}


async guardarMision(): Promise<void> {

  if (!this.missionMarker) return;

  const posicion = this.missionMarker.getLatLng();

  try {

    console.log("TITLE:", this.titulo);
    console.log("DESCRIPTION:", this.descripcion);

    console.log({
      reportPublicId: this.reportId,
      latitude: posicion.lat,
      longitude: posicion.lng,
      radius: this.radio,
      title: this.titulo,
      description: this.descripcion
    });

    await firstValueFrom(
      this.missionService.createMission({

        reportPublicId: this.reportId,

        latitude: posicion.lat,

        longitude: posicion.lng,

        radius: this.radio,

        title: this.titulo,

        description: this.descripcion

      })
    );

    await this.router.navigate(['/home'], {
      state: {
        missionCreated: true
      }
    });

  } catch (error) {

    console.error(error);

    this.toastService.error("No se pudo crear la misión");

  }

}

continuar(): void {

  if (!this.titulo.trim()) {

    this.toastService.error('Ingresá un título para la misión');

    return;

  }

  if (!this.descripcion.trim()) {

    this.toastService.error('Ingresá una descripción');

    return;

  }

  this.step = 2;

 setTimeout(() => {

  this.inicializarMapa();

}, 100);

}

}