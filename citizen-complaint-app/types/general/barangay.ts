import { User } from "./user";

export interface BarangayAccount {
  id: number;
  user_id: number;
  barangay_id: number;
  user: User;
}

export interface Barangay {
  barangay_name: string;
  barangay_address: string;
  barangay_contact_number: string;
  barangay_email: string;
  id: number;
  barangay_account: BarangayAccount;
}