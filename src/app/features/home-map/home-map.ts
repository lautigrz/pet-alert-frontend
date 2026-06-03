import { Component, AfterViewInit, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportesService } from '../reportes/application/reportes.service';
import { Reporte } from '../reportes/domain/reporte.model';
import { ProfileService } from '../profile/application/profile.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  templateUrl: './home-map.html',
})
export class HomeMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportesService = inject(ReportesService);
  private readonly profileService = inject(ProfileService);
  readonly successReportId = signal<string | null>(null);

  readonly tipoFiltro = signal('todos');
  readonly cercaniaFiltro = signal('todos');
  readonly mascotaFiltro = signal('todos');
  readonly centrosFiltro = signal('todos');

  readonly misReportes = [
    {
      nombre: 'Cari',
      hace: 'Hace 2hs',
      tipo: 'Mascota perdida',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
      img: 'https://res.cloudinary.com/dbemu2gdd/image/upload/v1780504478/cats-8096304_1280_haesyr.jpg',
    },
  ];

  readonly reportesCercanos = [
    {
      nombre: 'Cari',
      hace: 'Hace 2hs',
      tipo: 'Mascota perdida',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
      img: 'https://res.cloudinary.com/dbemu2gdd/image/upload/v1780504325/OIP_kxmxxf.webp',
    },
    {
      nombre: 'Charles',
      hace: 'Hace 2hs',
      tipo: 'Mascota avistada',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
      img: 'https://res.cloudinary.com/dbemu2gdd/image/upload/v1780504325/black-bombay-cat-min-1536x1020_d6dhis.jpg',
    },
    {
      nombre: 'Mandarina',
      hace: 'Hace 2hs',
      tipo: 'Mascota perdida',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
      img: 'https://res.cloudinary.com/dbemu2gdd/image/upload/v1780504326/dog-5357794_1280_ehghha.jpg',
    },
  ];

  private readonly DEFAULT_LOCATION = {
    lat: -34.603734,
    lng: -58.38157,
  };
  private profilePhotoUrl =
    'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';


  private buildPin(color: string, imageUrl?: string): L.DivIcon {
    const imageHtml = imageUrl
      ? `
      <img
        src="${imageUrl}"
        alt=""
        style="
          width:30px;
          height:30px;
          border-radius:50%;
          object-fit:cover;
          display:block;
        "
      />
    `
      : '';

    const html = `
    <div style="position:relative;width:44px;height:44px;">
      <div style="
        width:44px;
        height:44px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>

      <div style="
        position:absolute;
        top:5px;
        left:5px;
        width:34px;
        height:34px;
        border-radius:50%;
        border:2px solid #fff;
        background:#fff;
        overflow:hidden;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${imageHtml}
      </div>
    </div>
  `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  }

  private async cargarReportes(): Promise<void> {
    try {
      const reportes: Reporte[] = await this.reportesService.getGenerales();

      console.log('REPORTES', reportes);

      reportes.forEach((reporte) => {
        const lat = reporte.location.latitude;
        const lng = reporte.location.longitude;

        const color = reporte.type === 'LOST' ? '#E8842E' : '#1D6FA3';
        const imageUrl = reporte.details?.images?.[0]?.url;

        L.marker([lat, lng], {
          icon: this.buildPin(color, imageUrl),
        })
          .addTo(this.map)
          .bindPopup(this.buildPopup(reporte), {
            maxWidth: 270,
            minWidth: 240,
          });
      });
    } catch (error) {
      console.error('Error cargando reportes', error);
    }
  }

  
  async ngOnInit(): Promise<void> {
  const reportId = this.route.snapshot.queryParamMap.get('reporte');
  if (reportId) this.successReportId.set(reportId);

  try {
    const profile = await this.profileService.getProfile();

    this.profilePhotoUrl =
      profile.photoUrl ||
      'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';
  } catch (error) {
    console.error('Error cargando perfil', error);
  }
}

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  verReporte(): void {
    const reportId = this.successReportId();
    this.successReportId.set(null);
    this.router.navigate(['/detalle-reporte', reportId]);
  }

  closeSuccess(): void {
    this.successReportId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.getUserLocation();
    this.cargarReportes();
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  private getUserLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.map.setView([lat, lng], 15);
        L.marker(
  [lat, lng],
  {
    icon: this.buildPin('#000000', this.profilePhotoUrl),
  }
).addTo(this.map);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
      () => {
        this.map.setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
    );
  }

  private buildPopup(reporte: Reporte): string {
    const details = reporte.details as {
      images?: { url: string }[];
    };

    const imageUrl = details.images?.[0]?.url;

    const tipoTexto =
      reporte.type === 'LOST' ? 'Mascota perdida' : 'Mascota encontrada';

    const tipoColor =
      reporte.type === 'LOST' ? '#E8842E' : '#1D6FA3';

    const fecha = reporte.occurredAt
      ? new Date(reporte.occurredAt).toLocaleDateString('es-AR')
      : 'No informada';

    const descripcion =
      reporte.description?.trim() || 'Sin descripción adicional';

    return `
    <div style="
      width:240px;
      font-family: Nunito, sans-serif;
      color:#12355B;
    ">
      ${imageUrl
        ? `
            <img
              src="${imageUrl}"
              alt="Foto del reporte"
              style="
                width:100%;
                height:130px;
                object-fit:contain;
                border-radius:14px;
                margin-bottom:10px;
              "
            />
          `
        : `
            <div style="
              width:100%;
              height:130px;
              border-radius:14px;
              margin-bottom:10px;
              background:#e2e8f0;
              display:flex;
              align-items:center;
              justify-content:center;
              color:#64748b;
              font-size:13px;
              font-weight:600;
            ">
              Sin foto
            </div>
          `
      }

      <div style="
        display:inline-flex;
        align-items:center;
        background:${tipoColor};
        color:white;
        font-size:12px;
        font-weight:700;
        padding:5px 9px;
        border-radius:8px;
        margin-bottom:10px;
      ">
        ${tipoTexto}
      </div>

      <div style="
        font-size:13px;
        line-height:1.5;
        color:#334155;
        margin-bottom:8px;
      ">
        ${descripcion}
      </div>

      <div style="
        font-size:13px;
        line-height:1.6;
      ">
        <div>
          <strong>Ubicación:</strong><br />
          <span style="color:#334155;">${reporte.location.address}</span>
        </div>

        <div style="margin-top:6px;">
          <strong>Fecha:</strong>
          <span style="color:#334155;">${fecha}</span>
        </div>
      </div>

      <a
  href="/detalle-reporte/${reporte.publicId}"
  style="
    display:block;
    text-align:center;
    text-decoration:none;
    width:100%;
    box-sizing:border-box;
    margin-top:12px;
    background:#12355B;
    color:white;
    border:none;
    border-radius:8px;
    padding:9px 12px;
    font-size:13px;
    font-weight:700;
    cursor:pointer;
    font-family: Nunito, sans-serif;
  "
>
  Ver detalle
</a>
    </div>
  `;
  }
}
