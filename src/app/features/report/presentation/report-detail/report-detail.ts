import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { UserExperienceAchievement, UserExperienceSummary } from '../../../profile/domain/profile.model';

import { InfoTooltipComponent } from "../../../../shared/component/info-tooltip/info-tooltip.component";


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
    CloseReportModalComponent,
    InfoTooltipComponent
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
  userRatingAverage = signal(0);
  userRatingCount = signal(0);
  fromMissionId = signal<string | null>(null);
  userExperience = signal<UserExperienceSummary | null>(null);
  userExperienceLoading = signal(false);
  userExperienceError = signal<string | null>(null);

  userLevel = computed(() => this.userExperience()?.level ?? null);

  associatedMission = signal<unknown | null>(null);
  missionOwner = signal<unknown | null>(null);
  hasActiveMission = signal<boolean>(false);

  esPropio = computed(() => {
    const r = this.report();
    const id = this.usuarioId();
    return !!r && !!id && r.user.publicId === id;
  });

  puedeSeguirHistoria = computed(() => {
    const r = this.report();
    return !!r && !this.esPropio() && r.status === 'ACTIVE';
  });


  topAchievement = computed(() => {
    const experience = this.userExperience();

    if (!experience) return null;

    const achievements = this.userAchievements(experience);

    const unlockedAchievements = achievements.filter(
      (achievement) => achievement.unlocked ?? true,
    );

    if (unlockedAchievements.length === 0) return null;

    return unlockedAchievements.reduce((highest, current) =>
      (current.requiredXp ?? 0) > (highest.requiredXp ?? 0)
        ? current
        : highest,
    );
  });
  async ngOnInit() {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;

    const fromMission = history.state?.fromMission;
    if (fromMission) {
      this.fromMissionId.set(fromMission);
    }

    try {
      const report = await this.reportService.getReportByPublicId(publicId);
      this.report.set(report);

      await Promise.all([
        this.cargarRatingUsuario(report.user.publicId),
        this.chargeUserExperience(report.user.publicId),
      ]);
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

  async resolverReporte(payload: { resolved: boolean; resolvedAt?: string }): Promise<void> {
    const r = this.report();
    if (!r || !this.esPropio()) return;

    this.actualizando.set(true);
    try {
      await this.reportesService.updateToResolved(r.publicId, payload.resolved, payload.resolvedAt);

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


  private async cargarRatingUsuario(userPublicId: string): Promise<void> {
    try {
      const rating = await this.profileService.getUserRating(userPublicId);
      this.userRatingAverage.set(rating.average);
      this.userRatingCount.set(rating.count);
    } catch {
      this.userRatingAverage.set(0);
      this.userRatingCount.set(0);
    }
  }
  sinValoraciones(): boolean {
    return this.userRatingCount() === 0;
  }

  esUsuarioBajaValoracion(): boolean {
    return !this.sinValoraciones() && this.userRatingAverage() < 3;
  }

  valoracionUsuario(): string {
    if (this.sinValoraciones()) {
      return 'Sin calificar';
    }

    return this.userRatingAverage().toFixed(1);
  }

  ratingStars(): string[] {
    const average = Math.round(this.userRatingAverage());
    return [1, 2, 3, 4, 5].map((star) => (star <= average ? '★' : '☆'));
  }
  private readonly router = inject(Router);

  goBackToMission(): void {
    const missionId = this.fromMissionId();
    if (missionId) this.router.navigate(['/missions', missionId]);
  }

  irAEditarDatos(): void {
    const r = this.report();
    if (r) this.router.navigate(['/reports', r.publicId, 'edit', 'datos']);
  }

  irAEditarUbicacion(): void {
    const r = this.report();
    if (r) this.router.navigate(['/reports', r.publicId, 'edit', 'ubicacion']);
  }

  createMission(): void {

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

  private async chargeUserExperience(userPublicId: string): Promise<void> {
    this.userExperienceLoading.set(true);
    this.userExperienceError.set(null);

    try {
      const experience = await this.profileService.getPublicUserExperience(userPublicId);
      this.userExperience.set(experience);
    } catch (error) {
      this.userExperience.set(null);
      this.userExperienceError.set(error instanceof Error ? error.message : 'No se pudo cargar la experiencia del usuario');
    } finally {
      this.userExperienceLoading.set(false);
    }
  }

  private userAchievements(experience: UserExperienceSummary): UserExperienceAchievement[] {
    if (Array.isArray(experience.achievements) && experience.achievements.length > 0) {
      return experience.achievements;
    }

    return Array.isArray(experience.unlockedAchievements)
      ? experience.unlockedAchievements
      : [];
  }

  topAchievementTooltip(): string {
    const achievement = this.topAchievement();
    if (!achievement) {
      return 'Este usuario todavía no desbloqueó logros.';
    }
    return `${achievement.name}: ${achievement.description} · Se desbloquea al alcanzar ${achievement.requiredXp} XP`;
  }
}
