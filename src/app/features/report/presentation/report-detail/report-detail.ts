import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportService } from '../../application/report.service';
import { ReportListService } from '../../application/report-list.service';
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
  private readonly toastService = inject(ToastService);
  private readonly profileService = inject(ProfileService);
  private readonly USUARIO_BAJA_VALORACION_PUBLIC_ID = '70867c26-8c5c-40d2-b3df-08036823ff16';


  report = signal<ReportDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actualizando = signal(false);
  confirmandoResolucion = signal(false);
  usuarioId = signal<string | null>(null);
  mostrandoModalDenuncia = signal(false);
  siguiendoHistoria = signal(false);
  cargandoSeguimiento = signal(false);
  actualizandoSeguimiento = signal(false);

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
      this.report.set(await this.reportService.getReportByPublicId(publicId));
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
}
