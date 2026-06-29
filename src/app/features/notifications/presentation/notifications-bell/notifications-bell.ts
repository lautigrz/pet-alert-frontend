import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationsService } from '../../application/notifications.service';
import { NotificacionCoincidencia } from '../../domain/match-notification';

@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notifications-bell.html',
})
export class NotificationsBell implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  @Input() variante: 'navbar' | 'bottom' = 'navbar';

  readonly notificaciones = this.notificationsService.notificaciones;
  readonly noVistas = this.notificationsService.noVistas;
  readonly abierto = signal(false);

  readonly badge = computed(() => {
    const total = this.noVistas();
    return total > 10 ? '+10' : String(total);
  });

  ngOnInit(): void {
    this.notificationsService.escuchar();
    void this.notificationsService.cargar();
  }

  alternar(): void {
    this.abierto.update((abierto) => !abierto);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  esNueva(notificacion: NotificacionCoincidencia): boolean {
    return this.notificationsService.esNueva(notificacion.matchPublicId);
  }

  goToMatches(notificacion: NotificacionCoincidencia): void {
    this.cerrar();
    const reportId =
      notificacion.rol === 'avistador'
        ? notificacion.matchedReportPublicId
        : notificacion.lostReportPublicId;
    this.router.navigate(['/reports', reportId, 'matches']);
  }

  imagenDe(notificacion: NotificacionCoincidencia): string | null {
    return notificacion.rol === 'avistador' ? notificacion.lostPetImage : notificacion.matchedImage;
  }

  tituloDe(notificacion: NotificacionCoincidencia): string {
    if (notificacion.rol === 'avistador') {
      return `Tu avistamiento coincide con ${notificacion.lostPetName ?? 'una mascota perdida'}`;
    }
    return `Coincidencia con ${notificacion.lostPetName ?? 'tu mascota'}`;
  }

  porcentaje(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  panelClase(): string {
    const base =
      'z-[1100] max-h-[420px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col';
    const posicion =
      this.variante === 'bottom'
        ? 'absolute right-0 w-80 max-w-[calc(100vw-1.5rem)] bottom-[calc(100%+14px)]'
        : 'fixed inset-x-3 top-[80px] md:absolute md:inset-x-auto md:right-0 md:top-[calc(100%+10px)] md:w-80';
    return `${base} ${posicion}`;
  }

  disparadorClase(): string {
    return this.variante === 'bottom'
      ? 'flex w-full flex-col items-center justify-center gap-1 text-slate-500 text-[11px] font-medium transition-colors hover:text-[#E8842E]'
      : 'flex items-center justify-center w-9 h-9 rounded-full text-slate-500 hover:text-[#E8842E] hover:bg-slate-100 transition-colors';
  }
}
