import { NotificationType } from "@/types/general/notification";
import { Ionicons } from "@expo/vector-icons";

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

export const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    badgeClass: string;
    badgeTextClass: string;
    iconBgClass: string;
    dotClass: string;
    labelKey: string;
    titleKey: string;
    messageKey: string;
  }
> = {
  info: {
    icon: "information-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.info",
    titleKey: "notifications.title.info",
    messageKey: "notifications.message.info",
  },
  update: {
    icon: "refresh-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.update",
    titleKey: "notifications.title.update",
    messageKey: "notifications.message.update",
  },
  success: {
    icon: "checkmark-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.success",
    titleKey: "notifications.title.success",
    messageKey: "notifications.message.success",
  },
  complaint_resolved: {
    icon: "checkmark-done-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.complaint_resolved",
    titleKey: "notifications.title.complaint_resolved",
    messageKey: "notifications.message.complaint_resolved",
  },
  complaint_under_review: {
    icon: "eye-outline",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.complaint_under_review",
    titleKey: "notifications.title.complaint_under_review",
    messageKey: "notifications.message.complaint_under_review",
  },
  complaint_update: {
    icon: "arrow-forward-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.complaint_update",
    titleKey: "notifications.title.complaint_update",
    messageKey: "notifications.message.complaint_update",
  },
  existing_incident: {
    icon: "git-merge-outline",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.existing_incident",
    titleKey: "notifications.title.existing_incident",
    messageKey: "notifications.message.existing_incident",
  },
  announcement: {
    icon: "notifications",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.type.announcement",
    titleKey: "notifications.title.announcement",
    messageKey: "notifications.message.announcement",
  },
  rejected: {
    icon: "close-circle",
    iconColor: "#EF4444",
    badgeClass: "bg-red-50 border border-red-100",
    badgeTextClass: "text-red-500",
    iconBgClass: "bg-red-50",
    dotClass: "bg-red-500",
    labelKey: "notifications.type.rejected",
    titleKey: "notifications.title.rejected",
    messageKey: "notifications.message.rejected",
  },
};