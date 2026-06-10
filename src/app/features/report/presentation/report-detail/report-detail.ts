import { Component,  OnInit, computed, signal, inject  } from '@angular/core';
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
  ],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-detail.html',
})

export class ReportDetailPage implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly reportesService = inject(ReportListService);
  private readonly toastService = inject(ToastService);
  private readonly profileService = inject(ProfileService);

  report = signal<ReportDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actualizando = signal(false);
  confirmandoResolucion = signal(false);
  usuarioId = signal<string | null>(null);

  esPropio = computed(() => {
    const r = this.report();
    const id = this.usuarioId();
    return !!r && !!id && r.user.publicId === id;
  });

  async ngOnInit() {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;
    try {
      this.report.set(await this.reportService.getReportByPublicId(publicId));
    } catch {
      this.error.set('No se pudo cargar el reporte');
    } finally {
      this.loading.set(false);
    }

    try {
      const perfil = await this.profileService.getProfile();
      this.usuarioId.set(perfil.id);
    } catch {
      this.usuarioId.set(null);
    }
  }

  abrirConfirmacion(): void {
    this.confirmandoResolucion.set(true);
  }

  cancelarConfirmacion(): void {
    this.confirmandoResolucion.set(false);
  }

  async resolverReporte(): Promise<void> {
    const r = this.report();
    if (!r || !this.esPropio()) return;

    this.actualizando.set(true);
    try {
      await this.reportesService.updateToResolved(r.publicId);

      this.report.update((current) =>
        current ? { ...current, status: 'RESOLVED' } : null,
      );
      this.toastService.success('✔️ Reporte marcado como Resuelto');
      this.confirmandoResolucion.set(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      this.toastService.error(msg);
    } finally {
      this.actualizando.set(false);
    }
  }

  private readonly router = inject(Router);
  irAEditar(): void {
    const r = this.report();
    if (r) this.router.navigate(['/reports', r.publicId, 'edit']);
  }
}
