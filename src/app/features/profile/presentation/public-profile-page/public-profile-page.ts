  import { Component, computed, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { ActivatedRoute } from '@angular/router';
  import { ProfileService } from '../../application/profile.service';
  import { PublicProfile } from '../../domain/public-profile';
  import { ReportListService } from '../../../report/application/report-list.service';
  import { Reporte } from '../../../report/domain/report-read.model';
  import { HomeReportCardComponent } from '../../../home-map/components/home-report-card/home-report-card';
  import { AuthService } from '../../../auth/application/auth.service';
  import { ReportModalComponent } from '../../../../shared/component/report-modal/report-modal';
  import { UserRatingSummary, UserReview } from '../../domain/user-review.model';
  import { AchievementIconComponent } from '../achievement-icon/achievement-icon.component';
  import type { UserExperienceAchievement, UserExperienceSummary } from '../../domain/profile.model';

  type ProfileTab = | 'reports'  | 'missions'  | 'achievements'  | 'reviews';

  @Component({
    selector: 'app-public-profile-page',
    standalone: true,
    imports: [FormsModule, HomeReportCardComponent, ReportModalComponent, AchievementIconComponent],
    templateUrl: './public-profile-page.html',
    styleUrls: ['./public-profile-page.css'],
  })
  export class PublicProfilePage implements OnInit {
    private readonly profileService = inject(ProfileService);
    private readonly reportListService = inject(ReportListService);
    private readonly route = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);

    readonly profile = signal<PublicProfile | null>(null);
    readonly loading = signal(true);
    readonly serverError = signal<string | null>(null);
    readonly activeTab = signal<ProfileTab>('reports');

    readonly reports = signal<Reporte[]>([]);
    readonly reportsLoading = signal(true);
    readonly reportsError = signal<string | null>(null);

    readonly ratingSummary = signal<UserRatingSummary>({ average: 0, count: 0 });
    readonly reviews = signal<UserReview[]>([]);
    readonly reviewsLoading = signal(true);
    readonly reviewsError = signal<string | null>(null);

    readonly experience = signal<UserExperienceSummary | null>(null);
    readonly experienceLoading = signal(true);
    readonly experienceError = signal<string | null>(null);

    readonly reviewSheetOpen = signal(false);
    readonly reviewRating = signal(0);
    readonly reviewDescription = signal('');
    readonly reviewSubmitting = signal(false);
    readonly reviewSubmitError = signal<string | null>(null);

    readonly mostrandoModalDenuncia = signal(false);
    readonly menuOpcionesAbierto = signal(false);

    readonly esPropio = computed(() => {
      const p = this.profile();
      const currentUserId = this.authService.getCurrentUserId();
      return !!p && !!currentUserId && p.id === currentUserId;
    });

    readonly defaultPhotoUrl = 'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';

    async ngOnInit(): Promise<void> {
      const publicId = this.route.snapshot.paramMap.get('publicId');

      if (!publicId) {
        this.serverError.set('Usuario no encontrado');
        this.loading.set(false);
        this.reportsLoading.set(false);
        return;
      }

      await Promise.all([this.loadProfile(publicId), this.loadReports(publicId), this.loadRating(publicId), this.loadReviews(publicId), this.loadExperience(publicId)]);
    }

    async loadExperience(publicId: string): Promise<void> {
      this.experienceLoading.set(true);
      this.experienceError.set(null);

      try {
        const experience = await this.profileService.getPublicUserExperience(publicId);
        this.experience.set(experience);
      } catch (error) {
        this.experienceError.set(error instanceof Error ? error.message : 'No se pudo cargar el progreso');
      } finally {
        this.experienceLoading.set(false);
      }
    }

    achievements(): UserExperienceAchievement[] {
      const experience = this.experience();
      if (!experience) return [];

      if (Array.isArray(experience.achievements) && experience.achievements.length > 0) {
        return experience.achievements;
      }

      return Array.isArray(experience.unlockedAchievements) ? experience.unlockedAchievements : [];
    }

    unlockedAchievementsList(): (UserExperienceAchievement & { progressLabel: string })[] {
      return this.achievements()
        .filter((a) => a.unlocked ?? true)
        .map((a) => ({ ...a, progressLabel: '' }));
    }

    private currentXp(experience: UserExperienceSummary): number {
      const totalXp = experience.totalXp ?? experience.xp;
      return typeof totalXp === 'number' && Number.isFinite(totalXp) ? totalXp : 0;
    }

    totalXp(): number {
      const experience = this.experience();
      return experience ? this.currentXp(experience) : 0;
    }

    levelProgressPercent(): number {
      const experience = this.experience();
      if (!experience) return 0;

      const xpIntoCurrentLevel = this.currentXp(experience) % 100;
      const percent = (xpIntoCurrentLevel / 100) * 100;
      return Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.round(percent))) : 0;
    }

    xpToNextLevel(): number {
      const experience = this.experience();
      if (!experience) return 100;

      const remaining = 100 - (this.currentXp(experience) % 100);
      return remaining === 100 ? 100 : remaining;
    }

    async loadProfile(publicId: string): Promise<void> {
      this.loading.set(true);
      this.serverError.set(null);

      try {
        const profile = await this.profileService.getPublicProfile(publicId);
        this.profile.set(profile);
      } catch (error) {
        this.serverError.set(error instanceof Error ? error.message : 'No se pudo cargar el perfil');
      } finally {
        this.loading.set(false);
      }
    }

    async loadReports(publicId: string): Promise<void> {
      this.reportsLoading.set(true);
      this.reportsError.set(null);

      try {
        const reports = await this.reportListService.getUserReports(publicId);
        this.reports.set(reports);
      } catch (error) {
        this.reportsError.set(error instanceof Error ? error.message : 'No se pudieron cargar los reportes');
      } finally {
        this.reportsLoading.set(false);
      }
    }


    async loadRating(publicId: string): Promise<void> {
      try {
        const summary = await this.profileService.getUserRating(publicId);
        this.ratingSummary.set(summary);
      } catch {
        this.ratingSummary.set({ average: 0, count: 0 });
      }
    }

    async loadReviews(publicId: string): Promise<void> {
      this.reviewsLoading.set(true);
      this.reviewsError.set(null);

      try {
        const reviews = await this.profileService.getUserReviews(publicId);
        this.reviews.set(reviews.items);
      } catch (error) {
        this.reviewsError.set(error instanceof Error ? error.message : 'No se pudieron cargar las reseñas');
      } finally {
        this.reviewsLoading.set(false);
      }
    }

    profilePhotoUrl(): string {
      return this.profile()?.photoUrl || this.defaultPhotoUrl;
    }

    displayName(): string {
      const profile = this.profile();

      if (!profile) return '';
      const fullName = `${profile.name ?? ''} ${profile.lastname ?? ''}`.trim();

      return fullName || profile.username;
    }

    setTab(tab: ProfileTab): void {
      this.activeTab.set(tab);
    }

    @ViewChild('achievementsTrack') achievementsTrack?: ElementRef<HTMLDivElement>;

    scrollAchievements(direction: number): void {
      const track = this.achievementsTrack?.nativeElement;
      if (!track) return;

      track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
    }

    toggleMenuOpciones(event: Event): void {
      event.stopPropagation();
      this.menuOpcionesAbierto.update((abierto) => !abierto);
    }


    abrirReviewSheet(): void {
      this.reviewSubmitError.set(null);
      this.reviewSheetOpen.set(true);
    }

    cerrarReviewSheet(): void {
      if (this.reviewSubmitting()) return;
      this.reviewSheetOpen.set(false);
      this.reviewSubmitError.set(null);
    }

    setReviewRating(rating: number): void {
      this.reviewRating.set(rating);
      this.reviewSubmitError.set(null);
    }

    async enviarReview(): Promise<void> {
      const profile = this.profile();
      if (!profile || this.reviewRating() < 1) {
        this.reviewSubmitError.set('Elegí una calificación antes de enviar.');
        return;
      }

      this.reviewSubmitting.set(true);
      this.reviewSubmitError.set(null);

      try {
        await this.profileService.createUserReview({
          reviewedUserId: profile.id,
          rating: this.reviewRating(),
          description: this.reviewDescription(),
        });
        this.reviewSheetOpen.set(false);
        this.reviewRating.set(0);
        this.reviewDescription.set('');
        await Promise.all([this.loadRating(profile.id), this.loadReviews(profile.id)]);
        this.activeTab.set('reviews');
      } catch (error) {
        this.reviewSubmitError.set(error instanceof Error ? error.message : 'No se pudo enviar la reseña');
      } finally {
        this.reviewSubmitting.set(false);
      }
    }

    reviewerName(review: UserReview): string {
      const fullName = `${review.reviewer.name ?? ''} ${review.reviewer.lastname ?? ''}`.trim();
      return fullName || review.reviewer.username;
    }

    reviewerPhotoUrl(review: UserReview): string {
      return review.reviewer.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.reviewerName(review))}&background=e2e8f0&color=12355B&size=96`;
    }

    timeAgo(date: string): string {
      const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 0) return 'Hoy';
      if (days === 1) return 'Ayer';
      if (days < 7) return `Hace ${days} días`;
      if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
      if (days < 365) {
        const months = Math.floor(days / 30);
        return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
      }
      const years = Math.floor(days / 365);
      return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
    }

    @HostListener('document:click')
    cerrarMenuOpciones(): void {
      this.menuOpcionesAbierto.set(false);
    }

    denunciarDesdeMenu(): void {
      this.cerrarMenuOpciones();
      this.abrirModalDenuncia();
    }

    abrirModalDenuncia(): void {
      this.mostrandoModalDenuncia.set(true);
    }

    cerrarModalDenuncia(): void {
      this.mostrandoModalDenuncia.set(false);
    }

    ratingStars(): string[] {
    const average = Math.round(this.ratingSummary().average);

    return [1, 2, 3, 4, 5].map((star) =>
      star <= average ? '★' : '☆',
    );
  }
  }
