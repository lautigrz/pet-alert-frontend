import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MissionListPage } from './mission-list';
import { MissionService } from '../../application/mission.service';
import { MissionCardOutput } from '../../infrastructure/models/mission.model';
import { AuthService } from '../../../auth/application/auth.service';
import { ReportListService } from '../../../report/application/report-list.service';

function makeMission(overrides: Partial<MissionCardOutput> = {}): MissionCardOutput {
  return {
    publicId: 'mission-1',
    status: 'OPEN',
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    searchArea: { latitude: -34.6, longitude: -58.38, radius: 5000 },
    report: {
      publicId: 'report-1',
      location: { address: 'Caballito, Buenos Aires', latitude: -34.6, longitude: -58.38 },
      photoUrl: null,
      title: 'Rocky',
      status: 'ACTIVE',
      petDetails: { name: 'Rocky', photoUrl: null, gender: 'MALE', size: 'MEDIUM' },
    },
    ...overrides,
  };
}

describe('MissionListPage', () => {
  let missionService: {
    getMissions: ReturnType<typeof vi.fn>;
    getJoinedMissionsByUser: ReturnType<typeof vi.fn>;
  };
  let reportListService: { getUserReports: ReturnType<typeof vi.fn> };
  let authService: { getCurrentUserId: ReturnType<typeof vi.fn> };

  let fixture: ComponentFixture<MissionListPage>;
  let component: MissionListPage;

  const activeMission = makeMission({ publicId: 'm-active', createdAt: new Date('2026-07-01T10:00:00.000Z'), report: { ...makeMission().report, publicId: 'report-1' } });
  const recentMission = makeMission({ publicId: 'm-recent', createdAt: new Date('2026-07-05T10:00:00.000Z'), report: { ...makeMission().report, publicId: 'report-2' } });
  const closedMission = makeMission({ publicId: 'm-closed', status: 'CLOSED', report: { ...makeMission().report, publicId: 'report-3' } });

  beforeEach(() => {
    missionService = {
      getMissions: vi.fn().mockReturnValue(of([activeMission, recentMission, closedMission])),
      getJoinedMissionsByUser: vi.fn().mockReturnValue(of([])),
    };
    reportListService = { getUserReports: vi.fn().mockResolvedValue([]) };
    authService = { getCurrentUserId: vi.fn().mockReturnValue('user-1') };

    TestBed.configureTestingModule({
      imports: [MissionListPage],
      providers: [
        { provide: MissionService, useValue: missionService },
        { provide: ReportListService, useValue: reportListService },
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });

    fixture = TestBed.createComponent(MissionListPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads only active missions on init', async () => {
    await component.ngOnInit();

    expect(component.missions()).toEqual([activeMission, recentMission]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('shows an error when missions cannot be loaded', async () => {
    missionService.getMissions.mockReturnValue(throwError(() => new Error('No se pudieron cargar las misiones')));

    await component.ngOnInit();

    expect(component.error()).toBe('No se pudieron cargar las misiones');
    expect(component.missions()).toEqual([]);
  });

  it('sorts by newest first in the recent tab', async () => {
    await component.ngOnInit();
    await component.selectTab('recent');

    expect(component.missions().map((m) => m.publicId)).toEqual(['m-recent', 'm-active']);
    expect(missionService.getMissions).toHaveBeenCalledTimes(1);
  });

  it('splits my missions into created and joined', async () => {
    reportListService.getUserReports.mockResolvedValue([{ publicId: 'report-1' }]);
    const joined = makeMission({ publicId: 'm-joined', report: { ...makeMission().report, publicId: 'report-9' } });
    missionService.getJoinedMissionsByUser.mockReturnValue(of([joined]));

    await component.ngOnInit();
    await component.selectTab('mine');

    expect(component.createdMissions().map((m) => m.publicId)).toEqual(['m-active']);
    expect(component.joinedMissions().map((m) => m.publicId)).toEqual(['m-joined']);
    expect(reportListService.getUserReports).toHaveBeenCalledWith('user-1');
  });

  it('paginates the public missions 10 per page', async () => {
    const many = Array.from({ length: 25 }, (_, index) =>
      makeMission({ publicId: `m-${index}`, report: { ...makeMission().report, publicId: `report-${index}` } }),
    );
    missionService.getMissions.mockReturnValue(of(many));

    await component.ngOnInit();

    expect(component.totalPages()).toBe(3);
    expect(component.missions().length).toBe(10);
    expect(component.missions()[0].publicId).toBe('m-0');

    await component.goToPage(2);
    expect(component.missions()[0].publicId).toBe('m-10');

    await component.goToPage(3);
    expect(component.missions().length).toBe(5);
    expect(missionService.getMissions).toHaveBeenCalledTimes(1);
  });

  it('applies the nearness filter to my missions', async () => {
    const near = makeMission({
      publicId: 'm-near',
      searchArea: { latitude: -34.6, longitude: -58.38, radius: 3000 },
      report: { ...makeMission().report, publicId: 'report-1' },
    });
    const far = makeMission({
      publicId: 'm-far',
      searchArea: { latitude: -31.42, longitude: -64.18, radius: 3000 },
      report: { ...makeMission().report, publicId: 'report-2' },
    });
    reportListService.getUserReports.mockResolvedValue([{ publicId: 'report-1' }, { publicId: 'report-2' }]);
    missionService.getMissions.mockReturnValue(of([near, far]));

    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: { latitude: -34.6, longitude: -58.38 } } as GeolocationPosition),
    );
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

    await component.ngOnInit();
    await component.selectTab('mine');
    await component.setNearness('5');

    expect(component.createdMissions().map((m) => m.publicId)).toEqual(['m-near']);
  });

  it('filters missions by search term', async () => {
    reportListService.getUserReports.mockResolvedValue([]);
    missionService.getMissions.mockReturnValue(
      of([
        activeMission,
        makeMission({ publicId: 'm-luna', report: { ...makeMission().report, publicId: 'report-8', title: 'Luna', petDetails: { name: 'Luna', photoUrl: null, gender: 'FEMALE', size: 'SMALL' } } }),
      ]),
    );

    await component.ngOnInit();
    component.search.set('luna');
    await component.clearDates();

    expect(component.missions().map((m) => m.publicId)).toEqual(['m-luna']);
  });
});
