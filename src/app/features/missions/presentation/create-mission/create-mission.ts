import { Component, AfterViewInit, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { ReportService } from '../../../report/application/report.service';
import { ReportDetail } from '../../../report/infrastructure/report.http';
import { MissionService } from '../../application/mission.service';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../shared/application/toast.service';
import { NavbarComponent } from '../../../../shared/component/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/component/footer/footer.component';
import { BottomNavComponent } from '../../../../shared/component/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-create-mission',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, BottomNavComponent],
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

  isEditMode = false;
  missionId = '';
  reportId = '';
  report?: ReportDetail;
  radius = 1000;

  title = '';
  description = '';
  showInstructions = true;

  private map!: L.Map;
  @ViewChild('missionMap') missionMap!: ElementRef<HTMLDivElement>;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.isEditMode = this.router.url.includes('/edit/');

    if (this.isEditMode) {
      this.missionId = id;
      try {
        const m = await firstValueFrom(this.missionService.getMissionDetail(this.missionId));
        this.reportId = m.report.publicId;
        this.title = m.title;
        this.description = m.description;
        this.radius = m.searchArea.radius;

        this.report = await this.reportService.getReportByPublicId(this.reportId);

        setTimeout(() => {
          this.initializeMap(m.searchArea.latitude, m.searchArea.longitude);
        }, 100);
      } catch (error) {
        console.error(error);
        this.toastService.error('Error al cargar la misión');
        this.router.navigate(['/home']);
      }
    } else {
      this.reportId = id;
      try {
        this.report = await this.reportService.getReportByPublicId(this.reportId);

        setTimeout(() => {
          this.initializeMap(this.report!.location.latitude, this.report!.location.longitude);
        }, 100);
      } catch (error) {
        console.error(error);
        this.toastService.error('Error al cargar el reporte');
        this.router.navigate(['/home']);
      }
    }
  }

  goBack(): void {
    if (this.isEditMode) {
      this.router.navigate(['/missions', this.missionId]);
    } else {
      this.router.navigate(['/reports', this.reportId]);
    }
  }

  ngAfterViewInit(): void {
    if (this.report || this.isEditMode) {
      setTimeout(() => {
        if (this.report) {
          const lat = this.isEditMode && this.mission ? this.mission.searchArea.latitude : this.report.location.latitude;
          const lng = this.isEditMode && this.mission ? this.mission.searchArea.longitude : this.report.location.longitude;
          this.initializeMap(lat, lng);
        }
      }, 100);
    }
  }

  private initializeMap(initialLat?: number, initialLng?: number): void {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    if (!this.missionMap) return;
    if (!this.report) return;

    const lat = initialLat ?? this.report.location.latitude;
    const lng = initialLng ?? this.report.location.longitude;

    this.map = L.map(this.missionMap.nativeElement).setView(
      [lat, lng],
      14
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap'
      }
    ).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const position = event.latlng;
      if (this.missionMarker) {
        this.missionMarker.setLatLng(position);
      }
      if (this.missionCircle) {
        this.missionCircle.setLatLng(position);
      }
    });

    this.centerOnCoordinates(lat, lng);
    this.map.invalidateSize();
  }

  private centerOnCoordinates(lat: number, lng: number): void {
    this.missionCircle = L.circle(
      [lat, lng],
      {
        radius: this.radius,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.20,
        weight: 3
      }
    ).addTo(this.map);

    const missionIcon = L.divIcon({
      html: `
        <div style="width:24px; height:24px; border-radius:50%; background:#2563eb; border:4px solid white; box-shadow:0 0 12px rgba(37,99,235,.5);"></div>
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
      if (this.missionMarker && this.missionCircle) {
        const pos = this.missionMarker.getLatLng();
        this.missionCircle.setLatLng(pos);
      }
    });
  }

  changeRadius(event: Event): void {
    this.radius = Number((event.target as HTMLInputElement).value);
    if (this.missionCircle) {
      this.missionCircle.setRadius(this.radius);
      this.map.fitBounds(this.missionCircle.getBounds());
    }
  }

  private get mission(): any {
    return (this as any)._mission;
  }

  async saveMission(): Promise<void> {
    if (!this.title || !this.title.trim()) {
      this.toastService.error('Ingresá un título para la misión');
      return;
    }

    if (!this.description || !this.description.trim()) {
      this.toastService.error('Ingresá una descripción');
      return;
    }

    if (!this.missionMarker) return;

    const position = this.missionMarker.getLatLng();

    try {
      if (this.isEditMode) {
        await firstValueFrom(
          this.missionService.updateMission(this.missionId, {
            title: this.title,
            description: this.description,
            latitude: position.lat,
            longitude: position.lng,
            radius: this.radius
          })
        );
        this.toastService.success('Misión actualizada con éxito');
        this.router.navigate(['/missions', this.missionId]);
      } else {
        await firstValueFrom(
          this.missionService.createMission({
            reportPublicId: this.reportId,
            latitude: position.lat,
            longitude: position.lng,
            radius: this.radius,
            title: this.title,
            description: this.description
          })
        );
        this.toastService.success('Misión iniciada con éxito');
        await this.router.navigate(['/home'], {
          state: {
            missionCreated: true
          }
        });
      }
    } catch (error) {
      console.error(error);
      this.toastService.error(this.isEditMode ? 'No se pudo actualizar la misión' : 'No se pudo crear la misión');
    }
  }
}