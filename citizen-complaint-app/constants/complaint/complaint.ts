// ─── Complaint Shared Constants ───────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  badge: string;
  text: string;
  dot: string;
  border: string;
}


export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ── Generic (keep for backwards compat) ──────────────────────────────────
  submitted: { label: "Submitted",  badge: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   border: "border-blue-200"  },
  forwarded: { label: "Forwarded",  badge: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  border: "border-amber-200" },
  resolved:  { label: "Resolved",   badge: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  border: "border-green-200" },
  rejected:  { label: "Rejected",   badge: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    border: "border-red-200"   },
  pending:   { label: "Pending",    badge: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200"},

  // ── Barangay (sky — not green, avoids "done" confusion) ──────────────────
  reviewed_by_barangay: { label: "Reviewed by Barangay", badge: "bg-sky-50",  text: "text-sky-700",  dot: "bg-sky-500",  border: "border-sky-200"  },
  resolved_by_barangay: { label: "Resolved by Barangay", badge: "bg-sky-100", text: "text-sky-800",  dot: "bg-sky-600",  border: "border-sky-300"  },

  // ── LGU (violet) ─────────────────────────────────────────────────────────
  forwarded_to_lgu:     { label: "Forwarded to LGU",     badge: "bg-violet-50",  text: "text-violet-700", dot: "bg-violet-500", border: "border-violet-200" },
  reviewed_by_lgu:      { label: "Reviewed by LGU",      badge: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-600", border: "border-violet-300" },

  // ── Department (amber) ───────────────────────────────────────────────────
  forwarded_to_department:  { label: "Forwarded to Dept.",      badge: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500",  border: "border-amber-200"  },
  reviewed_by_department:   { label: "Under Dept. Review",      badge: "bg-amber-100", text: "text-amber-800",  dot: "bg-amber-600",  border: "border-amber-300"  },
  resolved_by_department:   { label: "Resolved by Dept.",       badge: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  border: "border-green-200"  },
};

export const ALL_STATUSES = [
  "submitted",
  "reviewed_by_barangay",
  "resolved_by_barangay",
  "forwarded_to_lgu",
  "reviewed_by_lgu",
  "forwarded_to_department",
  "reviewed_by_department",
  "resolved_by_department",
  "rejected",
  "pending",
] as const;



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

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const withTz = normalized.includes("+") || normalized.includes("Z")
    ? normalized
    : normalized + "+08:00";          // treat as Manila time if no tz info

  return new Date(withTz).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatTime(raw: string) {
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const withTz = normalized.includes("+") || normalized.includes("Z")
    ? normalized
    : normalized + "+08:00";          // ← this was the bug, date was parsed as UTC

  const date = new Date(withTz);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}