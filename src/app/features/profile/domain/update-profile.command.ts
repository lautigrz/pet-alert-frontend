export interface UpdateProfileCommand {
  username: string;
  name?: string;
  lastname?: string;
  photoUrl?: string | null;
}
