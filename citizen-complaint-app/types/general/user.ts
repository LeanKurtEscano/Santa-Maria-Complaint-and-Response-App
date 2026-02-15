export interface User {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;
  age: number | null;
  birthdate: string | null;
  phone_number: string | null;
  gender: string | null;
  barangay: string | null;
  full_address: string | null;
  zip_code: string | null;
  id_type: string | null;
  id_number: string | null;
  latitude: number | null;
  longitude: number | null;
  id: number;
  email: string;
  role: string;
  is_administrator: boolean;
  profile_image: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string | null;
  front_id: string | null;
  back_id: string | null;
  selfie_with_id: string | null;
}
