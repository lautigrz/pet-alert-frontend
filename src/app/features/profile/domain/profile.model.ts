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
