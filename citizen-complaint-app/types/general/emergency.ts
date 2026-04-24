
export interface EmergencyContactAPI {
  id: number;
  contact_number: string;
  agency_id: number; // ✅ added: present in API response
}

export interface EmergencyAgency {
  id: number;
  agency_name: string;
  created_at: string;
  updated_at: string | null;
  emergency_contacts: EmergencyContactAPI[]; // ✅ fixed: was `contacts`
}

export interface PendingContact {
  name: string;
  phoneNumber: string;
}


// ── Per-service visual config ─────────────────────────────────────────────────
export interface ServiceTheme {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  btnColor: string;
  fullName: string;
}