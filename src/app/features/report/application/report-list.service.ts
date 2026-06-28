import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ReportListHttp } from '../infrastructure/report-list.http';
import { Reporte, ReporteFiltros, ReportesPaginados } from '../domain/report-read.model';

@Injectable({ providedIn: 'root' })
export class ReportListService {
  private readonly reportesHttp = inject(ReportListHttp);


  async getGenerales(filtros: ReporteFiltros = {}): Promise<Reporte[]> {
    try {
      console.log('Obteniendo reportes con filtros:', filtros);
      return await this.reportesHttp.getFiltered(filtros);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  
  async getMisReportes(filtros: ReporteFiltros = {}): Promise<Reporte[]> {
    try {
      const { data } = await this.reportesHttp.getMisReportesPaginado(filtros);
      return data;
    } catch (error) {
      throw this.mapError(error);
    }
  }


  async getMisReportesPaginado(filtros: ReporteFiltros = {}, page = 1, limit = 10): Promise<ReportesPaginados> {
    try {
      return await this.reportesHttp.getMisReportesPaginado(filtros, page, limit);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  
  async updateToResolved(publicId: string): Promise<void> {
    try {
      await this.reportesHttp.updateStatus(publicId, 'RESOLVED');
    } catch (error) {
      throw this.mapError(error);
    }
  }

  
  private mapError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new Error('Ocurrió un error inesperado');
    }
    if (error.status === 0) {
      return new Error('No se pudo conectar con el servidor');
    }
    if (error.status === 400) {
      return new Error(error.error?.error ?? 'Filtros inválidos');
    }
    return new Error('No se pudieron cargar los reportes');
  }
}
