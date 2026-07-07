import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReportService } from '../../application/report.service';
import { ReportListService } from '../../application/report-list.service';
import { PaymentService } from '../../application/payment.service';
import { ReportDetail } from '../../infrastructure/report.http';
import { ReportGalleryComponent } from '../components/report-gallery/report-gallery';
import { ReportInfoComponent } from '../components/report-info/report-info';
import { ReportLocationComponent } from '../components/report-location/report-location';
import { ReportContactComponent } from '../components/report-contact/report-contact';
import { ToastService } from '../../../../shared/application/toast.service';
import { ProfileService } from '../../../profile/application/profile.service';
import { ReportTimelineComponent } from '../components/report-timeline/report-timeline';
import { ReportModalComponent } from '../../../../shared/component/report-modal/report-modal';
import { CloseReportModalComponent } from '../components/close-report-modal/close-report-modal';
import { MissionService } from '../../../missions/application/mission.service';
import { ChatsService } from '../../../chats/application/chats.service';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReportGalleryComponent,
    ReportInfoComponent,
    ReportLocationComponent,
    ReportContactComponent,
    ReportTimelineComponent,
    ReportModalComponent,
    CloseReportModalComponent
  ],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-detail.html',
})

export class ReportDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly reportesService = inject(ReportListService);
  private readonly paymentService = inject(PaymentService);
  private readonly toastService = inject(ToastService);
  private readonly profileService = inject(ProfileService);
  private readonly missionService = inject(MissionService);
  private readonly chatsService = inject(ChatsService);
  private readonly USUARIO_BAJA_VALORACION_PUBLIC_ID = '70867c26-8c5c-40d2-b3df-08036823ff16';


  report = signal<ReportDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actualizando = signal(false);
  destacando = signal(false);
  confirmandoResolucion = signal(false);
  usuarioId = signal<string | null>(null);
  mostrandoModalDenuncia = signal(false);
  siguiendoHistoria = signal(false);
  cargandoSeguimiento = signal(false);
  actualizandoSeguimiento = signal(false);

  misionAsociada = signal<any | null>(null);
  duenoMision = signal<any | null>(null);

  esPropio = computed(() => {
    const r = this.report();
    const id = this.usuarioId();
    return !!r && !!id && r.user.publicId === id;
  });

  puedeSeguirHistoria = computed(() => {
    const r = this.report();
    return !!r && !this.esPropio() && r.status === 'ACTIVE';
  });

  async ngOnInit() {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;

    try {
      const r = await this.reportService.getReportByPublicId(publicId);
      this.report.set(r);

      if (r.type === 'SIGHTING') {
        const missions = await firstValueFrom(this.missionService.getMissions());
        const sightingLat = r.location.latitude;
        const sightingLng = r.location.longitude;

        const matchingMission = missions.find(m => {
          const distance = this.calcularDistancia(
            sightingLat,
            sightingLng,
            m.searchArea.latitude,
            m.searchArea.longitude
          );
          return distance <= m.searchArea.radius;
        });

        if (matchingMission) {
          try {
            const lostReport = await this.reportService.getReportByPublicId(matchingMission.report.publicId);
            this.duenoMision.set(lostReport.user);
            this.misionAsociada.set(matchingMission);
          } catch (e) {
            console.error('Error loading mission owner:', e);
          }
        }
      }
    } catch {
      this.error.set('No se pudo cargar el reporte');
    }

    try {
      const perfil = await this.profileService.getProfile();
      this.usuarioId.set(perfil.id);
    } catch {
      this.usuarioId.set(null);
    }

    try {
      await this.cargarEstadoSeguimiento();
    } finally {
      this.loading.set(false);
    }
  }

  abrirConfirmacion(): void {
    this.confirmandoResolucion.set(true);
  }

  cancelarConfirmacion(): void {
    this.confirmandoResolucion.set(false);
  }

  abrirModalDenuncia() {
    this.mostrandoModalDenuncia.set(true);
  }

  cerrarModalDenuncia() {
    this.mostrandoModalDenuncia.set(false);
  }

  async resolverReporte(resolved: boolean): Promise<void> {
    const r = this.report();
    if (!r || !this.esPropio()) return;

    this.actualizando.set(true);
    try {
      await this.reportesService.updateToResolved(r.publicId, resolved);

      this.report.update((current) =>
        current ? { ...current, status: 'RESOLVED' } : null,
      );
      this.toastService.success('Reporte cerrado');
      this.confirmandoResolucion.set(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      this.toastService.error(msg);
    } finally {
      this.actualizando.set(false);
    }
  }

  async destacarReporte(): Promise<void> {
    const r = this.report();
    if (!r || !this.esPropio() || r.featured) return;

    this.destacando.set(true);
    try {
      const initPoint = await this.paymentService.iniciarDestacado(r.publicId);
      window.location.href = initPoint;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar el pago';
      this.toastService.error(msg);
      this.destacando.set(false);
    }
  }

  esUsuarioBajaValoracion(report: ReportDetail): boolean {
    return report.user.publicId === this.USUARIO_BAJA_VALORACION_PUBLIC_ID;
    //ACA IRIA LA LOGICA REAL
  }

  valoracionUsuario(report: ReportDetail): string {
    return this.esUsuarioBajaValoracion(report) ? '2.0' : '5.0';
    //ACA IRIA LA LOGICA REAL
  }

  private readonly router = inject(Router);
  irAEditarDatos(): void {
    const r = this.report();
    if (r) this.router.navigate(['/reports', r.publicId, 'edit', 'datos']);
  }

  irAEditarUbicacion(): void {
    const r = this.report();
    if (r) this.router.navigate(['/reports', r.publicId, 'edit', 'ubicacion']);
  }

  crearMision(): void {

    const r = this.report();

    if (!r) return;

    this.router.navigate([
      '/missions/create',
      r.publicId
    ]);

  }

  private async cargarEstadoSeguimiento(): Promise<void> {
    const r = this.report();

    if (!r || this.esPropio() || r.status !== 'ACTIVE') {
      this.siguiendoHistoria.set(false);
      return;
    }

    this.cargandoSeguimiento.set(true);

    try {
      const result = await this.reportService.isFollowingReport(r.publicId);
      this.siguiendoHistoria.set(result.isFollowing);
    } catch {
      this.siguiendoHistoria.set(false);
    } finally {
      this.cargandoSeguimiento.set(false);
    }
  }

  async toggleSeguirHistoria(): Promise<void> {
    const r = this.report();

    if (!r || this.esPropio() || r.status !== 'ACTIVE') {
      return;
    }

    this.actualizandoSeguimiento.set(true);

    try {
      if (this.siguiendoHistoria()) {
        await this.reportService.unfollowReport(r.publicId);
        this.siguiendoHistoria.set(false);
        this.toastService.success('Dejaste de seguir esta historia');
      } else {
        await this.reportService.followReport(r.publicId);
        this.siguiendoHistoria.set(true);
        this.toastService.success('Ahora seguís esta historia');
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el seguimiento';

      this.toastService.error(msg);
    } finally {
      this.actualizandoSeguimiento.set(false);
    }
  }

  verPerfilDueno(publicId: string): void {
    this.router.navigate(['/users', publicId]);
  }

  async enviarMensajeDueno(publicId: string): Promise<void> {
    try {
      const conversationId = await this.chatsService.getOrCreateConversation(publicId);
      this.router.navigate(['/chats'], { queryParams: { conversation: conversationId } });
    } catch {
      this.toastService.error('No se pudo abrir el chat');
    }
  }

  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
