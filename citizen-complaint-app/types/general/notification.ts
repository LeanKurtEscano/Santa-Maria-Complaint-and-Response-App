
export interface Notification {
  id: number;
  title: string;
  message: string;
  user_id: number;
  complaint_id: number | null;
  channel: string;
  notification_type: string;
  sent_at: string;
  is_read: boolean;
}

interface SSENotificationData {
  complaint_id?: number;
  title?: string;
  message?: string;
  description?: string;
  [key: string]: any;
}