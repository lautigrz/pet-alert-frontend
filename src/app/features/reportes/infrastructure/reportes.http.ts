import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Reporte, ReporteFiltros, ReportesPaginados } from '../domain/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReportesHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getFiltered(filtros: ReporteFiltros = {}): Promise<Reporte[]> {
    let params = new HttpParams();

    if (filtros.reportType) params = params.set('reportType', filtros.reportType);
    if (filtros.animalType) params = params.set('animalType', filtros.animalType);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.createdFrom) params = params.set('createdFrom', filtros.createdFrom);
    if (filtros.createdTo) params = params.set('createdTo', filtros.createdTo);
    if (filtros.userPublicId) params = params.set('userPublicId', filtros.userPublicId);

    return firstValueFrom(
      this.http.get<Reporte[]>(`${this.baseUrl}/reports/filter`, { params }),
    );
  }

  /** Reportes del usuario autenticado, paginados (GET /api/reports). */
  getMisReportesPaginado(page = 1, limit = 50): Promise<ReportesPaginados> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return firstValueFrom(
      this.http.get<ReportesPaginados>(`${this.baseUrl}/reports`, { params }),
    );
  }

  /** Actualizar estado del reporte a RESOLVED (PATCH /api/reports/status/:publicId). */
  updateStatus(publicId: string, status: 'RESOLVED'): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(
        `${this.baseUrl}/reports/status/${publicId}`,
        { status }
      ),
    );
  }
}
