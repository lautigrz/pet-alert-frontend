import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { NotificationToggle } from './notification-toggle';
import { NotificationService } from '../../application/notification.service';

describe('NotificationToggle', () => {
  function createToggle(active: boolean, permission = 'granted') {
    const enable = vi.fn().mockResolvedValue(true);
    const disable = vi.fn().mockResolvedValue(undefined);
    const service = {
      isSupported: () => true,
      permission: signal(permission),
      active: signal(active),
      busy: signal(false),
      enable,
      disable,
    };
    TestBed.configureTestingModule({
      providers: [{ provide: NotificationService, useValue: service }],
    });
    const component = TestBed.runInInjectionContext(() => new NotificationToggle()) as unknown as {
      toggle(): Promise<void>;
      blocked(): boolean;
    };
    return { component, enable, disable };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('enables push when it is off and the user toggles', async () => {
    // Given: notificaciones desactivadas
    const { component, enable, disable } = createToggle(false);

    // When
    await component.toggle();

    // Then: pide activar, no desactiva
    expect(enable).toHaveBeenCalledOnce();
    expect(disable).not.toHaveBeenCalled();
  });

  it('disables push when it is on and the user toggles', async () => {
    // Given: notificaciones activadas
    const { component, enable, disable } = createToggle(true);

    // When
    await component.toggle();

    // Then
    expect(disable).toHaveBeenCalledOnce();
    expect(enable).not.toHaveBeenCalled();
  });

  it('marks notifications as blocked when permission is denied', () => {
    // Given: permiso denegado en el navegador
    const { component } = createToggle(false, 'denied');

    // Then
    expect(component.blocked()).toBe(true);
  });
});
