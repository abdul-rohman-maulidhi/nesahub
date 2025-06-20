export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_pict: string;
  clerk_id: string;
  bio?: string;
  gender?: "MALE" | "FEMALE" | "NOT_SET";
  created_at: string;
  _count?: UserStats;
  is_followed?: boolean;
  is_blocked?: boolean;
}

export interface UserStats {
  followers: number;
  following: number;
  posts: number;
}
