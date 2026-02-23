// ─── Complaint Shared Constants ───────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  badge: string;
  text: string;
  dot: string;
  border: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  submitted: { label: "Submitted", badge: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200"    },
  forwarded: { label: "Forwarded", badge: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200"   },
  resolved:  { label: "Resolved",  badge: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  rejected:  { label: "Rejected",  badge: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     border: "border-red-200"     },
  pending:   { label: "Pending",   badge: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",  border: "border-purple-200"  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  noise_disturbance:    "Noise Disturbance",
  illegal_dumping:      "Illegal Dumping",
  road_damage:          "Road Damage",
  street_light_outage:  "Street Light Outage",
  flooding:             "Flooding",
  illegal_construction: "Illegal Construction",
  stray_animals:        "Stray Animals",
  public_intoxication:  "Public Intoxication",
  illegal_vending:      "Illegal Vending",
  water_supply_issue:   "Water Supply Issue",
  garbage_collection:   "Garbage Collection",
  vandalism:            "Vandalism",
  other:                "Other",
};

export const ALL_STATUSES = ["submitted", "forwarded", "resolved", "rejected", "pending"] as const;

export function getStatusConfig(status: string | null): StatusConfig {
  return (
    STATUS_CONFIG[status?.toLowerCase() ?? ""] ?? {
      label: status ?? "Unknown",
      badge: "bg-gray-50",
      text: "text-gray-700",
      dot: "bg-gray-400",
      border: "border-gray-200",
    }
  );
}

export function getCategoryLabel(categoryKey: string, fallback?: string): string {
  return CATEGORY_LABELS[categoryKey] ?? fallback ?? categoryKey;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}