export interface User {
  id: number;
  email: string;
  role: string;
  is_administrator: boolean;

  profile_image?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at?: string | null;

  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  gender?: string | null;
  barangay?: string | null;
  full_address?: string | null;
  zip_code?: string | null;

  latitude?: string | null;
  longitude?: string | null;

  id_type?: string | null;
  id_number?: string | null;
  front_id?: string | null;
  back_id?: string | null;
  selfie_with_id?: string | null;
}
