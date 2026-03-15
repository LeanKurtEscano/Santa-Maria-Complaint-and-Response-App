


export type NotificationType =
  | "info"
  | "update"
  | "success"
  | "complaint_update"
  | "complaint_resolved"
  | "complaint_under_review"
  | "existing_incident";

export interface Notification {
  id: number;
  user_id: number;
  complaint_id?: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  channel: string;
  is_read: boolean;
  sent_at: string;
}

export type SSEStatus = "connecting" | "connected" | "disconnected";

// ─── Event → NotificationType mapping ────────────────────────────────────────

const EVENT_TO_TYPE: Record<string, NotificationType> = {
  info: "info",
  update: "complaint_update",
  success: "complaint_resolved",
  complaint_resolved: "complaint_resolved",
  complaint_under_review: "complaint_under_review",
  complaint_update: "complaint_update",
  existing_incident: "existing_incident",
  message: "info",
};

// ─── Type config ──────────────────────────────────────────────────────────────
