import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../application/profile.service';
import { UpdatedProfile, UserExperienceAchievement, UserExperienceSummary } from '../../domain/profile.model';
import { ReportListService } from '../../../report/application/report-list.service';
import { Reporte } from '../../../report/domain/report-read.model';
import { HomeReportCardComponent } from '../../../home-map/components/home-report-card/home-report-card';
import { ToastService } from '../../../../shared/application/toast.service';
import { NotificationService } from '../../../notifications/application/notification.service';
import { GivenUserReview, UserRatingSummary, UserReview } from '../../domain/user-review.model';

type ProfileTab = 'reports' | 'reviews' | 'missions' | 'achievements';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, HomeReportCardComponent],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css'],
})


export class ProfilePage implements OnInit  {
  private readonly profileService = inject(ProfileService);
  private readonly reportListService = inject(ReportListService);
  private readonly toastService = inject(ToastService);
  private readonly notificationService = inject(NotificationService);

  readonly rutaMiPerfil = '/profile/edit';
  readonly profile = signal<UpdatedProfile | null>(null);
  readonly loading = signal(true);
  readonly serverError = signal<string | null>(null);
  readonly activeTab = signal<ProfileTab>('reports');

  readonly reports = signal<Reporte[]>([]);
  readonly reportsLoading = signal(true);
  readonly reportsError = signal<string | null>(null);
  readonly ratingSummary = signal<UserRatingSummary>({
  average: 0,
  count: 0,
});

readonly receivedReviews = signal<UserReview[]>([]);
readonly givenReviews = signal<GivenUserReview[]>([]);
readonly reviewsLoading = signal(true);
readonly reviewsError = signal<string | null>(null);
  

  readonly experience = signal<UserExperienceSummary | null>(null);
  readonly experienceLoading = signal(true);
  readonly experienceError = signal<string | null>(null);
  readonly levelUpPulse = signal(false);
  readonly showLevelUpToast = signal(false);
  readonly showExperienceWidget = signal(true);

  readonly defaultPhotoUrl = 'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';

  private readonly lastSeenLevelKey = 'petfinder.profile.last-seen-level';
  private previousLevel: number | null = this.readLastSeenLevel();

  async ngOnInit(): Promise<void>{
  await Promise.all([
      this.loadProfile(),
      this.loadReports(),
      this.loadRating(),
      this.loadReviews(),
      this.loadExperience(),
    ]);
  }

  async loadProfile(): Promise<void>{
    this.loading.set(true);
    this.serverError.set(null);

    try{
      const profile = await this.profileService.getProfile();
      this.profile.set(profile);
    } catch(error){
      this.serverError.set(error instanceof Error ? error.message : 'No se pudo cargar el perfil');
    } finally {
      this.loading.set(false);
    }
  }

  async loadReports(): Promise<void>{
    this.reportsLoading.set(true);
    this.reportsError.set(null);

    try{
      const reports = await this.reportListService.getMisReportes();
      this.reports.set(reports);
    } catch(error){
      this.reportsError.set(error instanceof Error ? error.message : 'No se pudieron cargar los reportes');
    } finally {
      this.reportsLoading.set(false);
    }
  }
  async loadRating(): Promise<void> {
    try {
      const profile = await this.profileService.getProfile();
      const summary = await this.profileService.getUserRating(profile.id);
      this.ratingSummary.set(summary);
    } catch {
      this.ratingSummary.set({ average: 0, count: 0 });
    }
  }

  async loadReviews(): Promise<void> {
    this.reviewsLoading.set(true);
    this.reviewsError.set(null);

    try {
      const reviews = await this.profileService.getMyReviews();
      this.receivedReviews.set(reviews.received.items);
      this.givenReviews.set(reviews.given.items);
    } catch (error) {
      this.reviewsError.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las reseñas',
      );
    } finally {
      this.reviewsLoading.set(false);
    }
  }
  
  async loadExperience(): Promise<void>{
    this.experienceLoading.set(true);
    this.experienceError.set(null);

    try {
      const response = await this.profileService.getUserExperience();
      this.experience.set(response);

      if (this.previousLevel !== null && response.level > this.previousLevel) {
        this.handleLevelUp(response);
      }

      this.previousLevel = response.level;
      this.storeLastSeenLevel(response.level);
    } catch (error) {
      this.experienceError.set(error instanceof Error ? error.message : 'No se pudo cargar tu progreso');
      this.showExperienceWidget.set(false);
    } finally {
      this.experienceLoading.set(false);
    }
  }

  private handleLevelUp(experience: UserExperienceSummary): void {
    this.levelUpPulse.set(true);
    this.showLevelUpToast.set(true);
    this.toastService.brand(`¡Subiste al nivel ${experience.level}! Tu progreso quedó actualizado.`, 4000);
    this.notificationService.showLocal('¡Subiste de nivel!', `Ahora estás en el nivel ${experience.level}.`);

    window.setTimeout(() => this.levelUpPulse.set(false), 1200);
    window.setTimeout(() => this.showLevelUpToast.set(false), 2600);
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

  totalXp(): number {
    const experience = this.experience();
    return experience ? this.currentXp(experience) : 0;
  }

  achievements(): UserExperienceAchievement[] {
    const experience = this.experience();
    if (!experience) return [];

    if (Array.isArray(experience.achievements) && experience.achievements.length > 0) {
      return experience.achievements;
    }

    return Array.isArray(experience.unlockedAchievements) ? experience.unlockedAchievements : [];
  }

  unlockedCount(): number {
    return this.achievements().filter((achievement) => achievement.unlocked ?? true).length;
  }

  profilePhotoUrl(): string{
    return this.profile()?.photoUrl || this.defaultPhotoUrl;
  }

  displayName(): string {
    const profile = this.profile();

    if(!profile) return '';
    const fullName = `${profile.name ?? ''} ${profile.lastname ?? ''}`.trim();

    return fullName || profile.username;
  }

  setTab(tab: ProfileTab): void{
    this.activeTab.set(tab);
  }

  private currentXp(experience: UserExperienceSummary): number {
    const totalXp = experience.totalXp ?? experience.xp;
    return typeof totalXp === 'number' && Number.isFinite(totalXp) ? totalXp : 0;
  }

  private readLastSeenLevel(): number | null {
    if (typeof localStorage === 'undefined') return null;

    const value = Number(localStorage.getItem(this.lastSeenLevelKey));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private storeLastSeenLevel(level: number): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.lastSeenLevelKey, String(level));
  }

  ratingStars(): string[] {
    const average = Math.round(this.ratingSummary().average);

    return [1, 2, 3, 4, 5].map((star) =>
      star <= average ? '★' : '☆',
    );
  }

  unlockedAchievementsList(): (UserExperienceAchievement & { progressLabel: string })[] {
    return this.achievements()
      .filter((a) => a.unlocked ?? true)
      .map((a) => ({ ...a, progressLabel: '' }));
  }

  lockedAchievementsList(): (UserExperienceAchievement & { progressLabel: string })[] {
    return this.achievements()
      .filter((a) => !(a.unlocked ?? true))
      .map((a) => ({
        ...a,
        progressLabel: `${Math.min(this.totalXp(), a.requiredXp)} / ${a.requiredXp}`,
      }));
  }

  achievementIcon(achievement: UserExperienceAchievement): string {
    return achievement.icon ?? '⭐';
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
}
