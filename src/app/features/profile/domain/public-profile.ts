import { ProfileStats } from './profile.model';
export interface PublicProfile {
  id: string;
  username: string;
  name: string | null;
  lastname: string | null;
  photoUrl: string | null;
  stats: ProfileStats | null;
}
