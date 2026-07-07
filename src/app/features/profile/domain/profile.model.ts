export interface ProfileStats{
  reportsCreated: number;
  successfulReturns: number;
  activeDays:number;
  petsHelped:number;
}
export interface UpdatedProfile{
  id: string;
  email: string;
  username: string;
  name: string | null;
  lastname: string | null;
  photoUrl: string | null;
  role: string | null;
  stats: ProfileStats | null;
}

export interface UserExperienceAchievement {
  code: string;
  name: string;
  description: string;
  requiredXp: number;
  icon?: string;
  unlocked?: boolean;
}

export interface UserExperienceEvent {
  action: string;
  amount: number;
  occurredAt: string;
}

export interface UserExperienceSummary {
  xp: number;
  totalXp?: number;
  level: number;
  achievements?: UserExperienceAchievement[];
  unlockedAchievements: UserExperienceAchievement[];
  recentEvents?: UserExperienceEvent[];
}
