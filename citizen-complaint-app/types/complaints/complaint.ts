// ─── Complaint Shared Types ───────────────────────────────────────────────────

export interface BarangayInfo {
  id?: number;
  barangay_name: string;
  barangay_address: string;
  barangay_contact_number?: string | null;
  barangay_email?: string | null;
}

export interface CategoryInfo {
  id?: number;
  category_name: string;
}

export interface DepartmentInfo {
  id: number;
  department_name: string;
  description: string | null;
}

export interface PriorityLevel {
  id: number;
  label: string;
}

export interface Sector {
  id: number;
  name: string;
}

export interface Complaint {
  id: number;
  title: string;
  description: string | null;
  location_details: string | null;
  status: string | null;
  created_at: string;
  barangay: BarangayInfo | null;
  category: CategoryInfo | null;
    is_rejected_by_lgu: boolean;
  is_rejected_by_department: boolean;
  department?: DepartmentInfo | null;
  priority_level?: PriorityLevel | null;
  sector?: Sector | null;
}