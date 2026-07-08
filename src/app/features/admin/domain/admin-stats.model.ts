export interface MonthlyReports {
  month: string; // 'YYYY-MM'
  lost: number;
  sighting: number;
}

export interface ReunionRate {
  total: number;
  reunited: number;
  rate: number; // porcentaje 0-100
}

export interface AdminStats {
  reportsByMonth: MonthlyReports[];
  reunionRate: ReunionRate;
  avgResolutionDays: number | null;
}
