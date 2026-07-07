import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment.service';
import { PaymentHttp } from '../infrastructure/payment.http';

describe('PaymentService', () => {
  let paymentHttp: {
    crearPreferenciaDestacado: ReturnType<typeof vi.fn>;
  };
  let service: PaymentService;

  beforeEach(() => {
    paymentHttp = {
      crearPreferenciaDestacado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentHttp, useValue: paymentHttp },
      ],
    });

    service = TestBed.inject(PaymentService);
  });

  describe('iniciarDestacado', () => {
    it('retorna el initPoint cuando el http responde ok', async () => {
      paymentHttp.crearPreferenciaDestacado.mockResolvedValue({
        initPoint: 'https://mercadopago.com/init/pref-123',
      });

      const result = await service.iniciarDestacado('report-uuid-1');

      expect(paymentHttp.crearPreferenciaDestacado).toHaveBeenCalledWith('report-uuid-1');
      expect(result).toBe('https://mercadopago.com/init/pref-123');
    });

    it('mapea el error 403 a mensaje de permiso', async () => {
      paymentHttp.crearPreferenciaDestacado.mockRejectedValue(
        new HttpErrorResponse({ status: 403, error: { error: 'Forbidden' } }),
      );

      await expect(service.iniciarDestacado('report-uuid-1'))
        .rejects.toThrow('No tenés permiso para destacar este reporte');
    });

    it('mapea el error 409 a reporte ya destacado', async () => {
      paymentHttp.crearPreferenciaDestacado.mockRejectedValue(
        new HttpErrorResponse({ status: 409, error: { error: 'Already featured' } }),
      );

      await expect(service.iniciarDestacado('report-uuid-1'))
        .rejects.toThrow('Este reporte ya está destacado');
    });

    it('mapea el error de red (status 0)', async () => {
      paymentHttp.crearPreferenciaDestacado.mockRejectedValue(
        new HttpErrorResponse({ status: 0 }),
      );

      await expect(service.iniciarDestacado('report-uuid-1'))
        .rejects.toThrow('Error de conexión');
    });

    it('usa el mensaje del backend cuando viene en el error', async () => {
      paymentHttp.crearPreferenciaDestacado.mockRejectedValue(
        new HttpErrorResponse({ status: 500, error: { error: 'Algo salió mal' } }),
      );

      await expect(service.iniciarDestacado('report-uuid-1'))
        .rejects.toThrow('Algo salió mal');
    });
  });
});
