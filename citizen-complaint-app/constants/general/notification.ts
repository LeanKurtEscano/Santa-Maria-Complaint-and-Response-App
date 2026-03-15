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
  // General types
  info: {
    icon: "information-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    labelKey: "notifications.typeInfo",
    titleKey: "notifications.titleInfo",
    messageKey: "notifications.messageInfo",
  },
  update: {
    icon: "refresh-circle",
    iconColor: "#0EA5E9",
    badgeClass: "bg-sky-50 border border-sky-100",
    badgeTextClass: "text-sky-500",
    iconBgClass: "bg-sky-50",
    dotClass: "bg-sky-500",
    labelKey: "notifications.typeUpdate",
    titleKey: "notifications.titleUpdate",
    messageKey: "notifications.messageUpdate",
  },
  success: {
    icon: "checkmark-circle",
    iconColor: "#10B981",
    badgeClass: "bg-emerald-50 border border-emerald-100",
    badgeTextClass: "text-emerald-500",
    iconBgClass: "bg-emerald-50",
    dotClass: "bg-emerald-500",
    labelKey: "notifications.typeSuccess",
    titleKey: "notifications.titleSuccess",
    messageKey: "notifications.messageSuccess",
  },
  // Complaint-specific types
  complaint_resolved: {
    icon: "checkmark-done-circle",
    iconColor: "#10B981",
    badgeClass: "bg-emerald-50 border border-emerald-100",
    badgeTextClass: "text-emerald-600",
    iconBgClass: "bg-emerald-50",
    dotClass: "bg-emerald-500",
    labelKey: "notifications.typeResolved",
    titleKey: "notifications.titleResolved",
    messageKey: "notifications.messageResolved",
  },
  complaint_under_review: {
    icon: "eye-outline",
    iconColor: "#F59E0B",
    badgeClass: "bg-amber-50 border border-amber-100",
    badgeTextClass: "text-amber-600",
    iconBgClass: "bg-amber-50",
    dotClass: "bg-amber-500",
    labelKey: "notifications.typeUnderReview",
    titleKey: "notifications.titleUnderReview",
    messageKey: "notifications.messageUnderReview",
  },
  complaint_update: {
    icon: "arrow-forward-circle",
    iconColor: "#8B5CF6",
    badgeClass: "bg-violet-50 border border-violet-100",
    badgeTextClass: "text-violet-600",
    iconBgClass: "bg-violet-50",
    dotClass: "bg-violet-500",
    labelKey: "notifications.typeForwarded",
    titleKey: "notifications.titleForwarded",
    messageKey: "notifications.messageForwarded",
  },
  existing_incident: {
    icon: "git-merge-outline",
    iconColor: "#64748B",
    badgeClass: "bg-slate-100 border border-slate-200",
    badgeTextClass: "text-slate-500",
    iconBgClass: "bg-slate-100",
    dotClass: "bg-slate-400",
    labelKey: "notifications.typeExistingIncident",
    titleKey: "notifications.titleExistingIncident",
    messageKey: "notifications.messageExistingIncident",
  },
};
