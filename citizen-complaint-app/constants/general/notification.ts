// types/general/notification.ts  — add this

export interface SSENotificationData {
  complaint_id?: number;
  title?: string;
  message?: string;
  description?: string;
  location_details?: string;
  barangay_id?: number;
  category_id?: number;
  status?: string;
  created_at?: string;
  resolved_at?: string | null;
  notification_type?: 
    | 'complaint_update'
    | 'incident_update'
    | 'new_complaint'
    | 'complaint_under_review'
    | 'complaint_resolved'
    | 'new_incident_forwarded_to_lgu'
    | 'new_incident_forwarded_to_department'
    | 'info'
    | 'announcement';
  [key: string]: any;
}