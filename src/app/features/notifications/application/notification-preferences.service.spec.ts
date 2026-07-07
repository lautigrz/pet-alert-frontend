import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  NotificationPreferencesHttp,
  NotificationPreferencesResponse,
} from '../infrastructure/notification-preferences.http';

describe('NotificationPreferencesService', () => {
  let http: {
    getPreferences: ReturnType<typeof vi.fn>;
    updatePreferences: ReturnType<typeof vi.fn>;
  };

  const preferencesMock: NotificationPreferencesResponse = {
    notificationRadius: 10,
    lostReportsEnabled: true,
    sightingReportsEnabled: true,
    matchesEnabled: true,
    mutedUntil: null,
  };

  function createService(): NotificationPreferencesService {
    http = {
      getPreferences: vi.fn().mockResolvedValue(preferencesMock),
      updatePreferences: vi.fn().mockResolvedValue(preferencesMock),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationPreferencesService,
        { provide: NotificationPreferencesHttp, useValue: http },
      ],
    });

    return TestBed.inject(NotificationPreferencesService);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  describe('load', () => {
    it('loads preferences from the backend and stores them in the signal', async () => {
      // Given
      const service = createService();

      // When
      const result = await service.load();

      // Then
      expect(http.getPreferences).toHaveBeenCalledOnce();
      expect(result).toEqual(preferencesMock);
      expect(service.preferences()).toEqual(preferencesMock);
      expect(service.loading()).toBe(false);
    });

    it('sets loading while preferences are being loaded', async () => {
      // Given
      let resolveRequest!: (value: NotificationPreferencesResponse) => void;

      http = {
        getPreferences: vi.fn().mockImplementation(
          () =>
            new Promise<NotificationPreferencesResponse>((resolve) => {
              resolveRequest = resolve;
            }),
        ),
        updatePreferences: vi.fn(),
      };

      TestBed.configureTestingModule({
        providers: [
          NotificationPreferencesService,
          { provide: NotificationPreferencesHttp, useValue: http },
        ],
      });

      const service = TestBed.inject(NotificationPreferencesService);

      // When
      const promise = service.load();

      // Then
      expect(service.loading()).toBe(true);

      resolveRequest(preferencesMock);
      await promise;

      expect(service.loading()).toBe(false);
    });

    it('resets loading when loading preferences fails', async () => {
      // Given
      const service = createService();
      http.getPreferences.mockRejectedValueOnce(new Error('backend error'));

      // When / Then
      await expect(service.load()).rejects.toThrow('backend error');
      expect(service.loading()).toBe(false);
      expect(service.preferences()).toBeNull();
    });
  });

  describe('update', () => {
    it('updates preferences in the backend and stores the response in the signal', async () => {
      // Given
      const service = createService();

      const updatedPreferences: NotificationPreferencesResponse = {
        notificationRadius: 25,
        lostReportsEnabled: true,
        sightingReportsEnabled: false,
        matchesEnabled: true,
        mutedUntil: null,
      };

      http.updatePreferences.mockResolvedValueOnce(updatedPreferences);

      // When
      const result = await service.update({
        notificationRadius: 25,
        sightingReportsEnabled: false,
      });

      // Then
      expect(http.updatePreferences).toHaveBeenCalledWith({
        notificationRadius: 25,
        sightingReportsEnabled: false,
      });
      expect(result).toEqual(updatedPreferences);
      expect(service.preferences()).toEqual(updatedPreferences);
      expect(service.saving()).toBe(false);
    });

    it('sets saving while preferences are being updated', async () => {
      // Given
      let resolveRequest!: (value: NotificationPreferencesResponse) => void;

      http = {
        getPreferences: vi.fn(),
        updatePreferences: vi.fn().mockImplementation(
          () =>
            new Promise<NotificationPreferencesResponse>((resolve) => {
              resolveRequest = resolve;
            }),
        ),
      };

      TestBed.configureTestingModule({
        providers: [
          NotificationPreferencesService,
          { provide: NotificationPreferencesHttp, useValue: http },
        ],
      });

      const service = TestBed.inject(NotificationPreferencesService);

      // When
      const promise = service.update({
        notificationRadius: 15,
      });

      // Then
      expect(service.saving()).toBe(true);

      resolveRequest({
        ...preferencesMock,
        notificationRadius: 15,
      });

      await promise;

      expect(service.saving()).toBe(false);
    });

    it('resets saving when updating preferences fails', async () => {
      // Given
      const service = createService();
      http.updatePreferences.mockRejectedValueOnce(new Error('update error'));

      // When / Then
      await expect(
        service.update({
          matchesEnabled: false,
        }),
      ).rejects.toThrow('update error');

      expect(service.saving()).toBe(false);
    });
  });
});
