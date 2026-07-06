import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PaymentHttp } from '../infrastructure/payment.http';
import { NetworkError, PaymentError } from '../domain/report.errors';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly paymentHttp = inject(PaymentHttp);

  async iniciarDestacado(publicId: string): Promise<string> {
    try {
      const { initPoint } = await this.paymentHttp.crearPreferenciaDestacado(publicId);
      return initPoint;
    } catch (error) {
      throw this.mapPaymentError(error);
    }
  }

  private mapPaymentError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new PaymentError('Error inesperado al iniciar el pago');
    }
    if (error.status === 0) return new NetworkError();
    if (error.status === 403) {
      return new PaymentError('No tenés permiso para destacar este reporte');
    }
    if (error.status === 409) {
      return new PaymentError('Este reporte ya está destacado');
    }
    return new PaymentError(error.error?.error ?? 'No se pudo iniciar el pago');
  }
}
