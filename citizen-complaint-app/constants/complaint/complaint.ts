// ─── Complaint Shared Constants ───────────────────────────────────────────────

import { Complaint } from "@/types/complaints/complaint";

export interface StatusConfig {
  label: string;
  badge: string;
  text: string;
  dot: string;
  border: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ── Generic ─────────────────────────────────────────────
  submitted: {
    label: "Submitted",
    badge: "#EFF6FF",
    text: "#1D4ED8",
    dot: "#3B82F6",
    border: "#BFDBFE",
  },
  forwarded: {
    label: "Forwarded",
    badge: "#FFFBEB",
    text: "#B45309",
    dot: "#F59E0B",
    border: "#FDE68A",
  },
  resolved: {
    label: "Resolved",
    badge: "#ECFDF5",
    text: "#047857",
    dot: "#10B981",
    border: "#A7F3D0",
  },
  rejected: {
    label: "Rejected",
    badge: "#FEF2F2",
    text: "#B91C1C",
    dot: "#EF4444",
    border: "#FECACA",
  },
  pending: {
    label: "Pending",
    badge: "#F5F3FF",
    text: "#6D28D9",
    dot: "#8B5CF6",
    border: "#DDD6FE",
  },

  // ── Barangay ────────────────────────────────────────────
  reviewed_by_barangay: {
    label: "Reviewed by Barangay",
    badge: "#EFF6FF",   // BLUE
    text: "#1D4ED8",
    dot: "#3B82F6",
    border: "#BFDBFE",
  },
  resolved_by_barangay: {
    label: "Resolved by Barangay",
    badge: "#ECFDF5",   // GREEN
    text: "#047857",
    dot: "#10B981",
    border: "#A7F3D0",
  },

  // ── LGU ─────────────────────────────────────────────────
  forwarded_to_lgu: {
    label: "Forwarded to LGU",
    badge: "#FFFBEB",
    text: "#B45309",
    dot: "#F59E0B",
    border: "#FDE68A",
  },
  reviewed_by_lgu: {
    label: "Reviewed by LGU",
    badge: "#EFF6FF",   // BLUE
    text: "#1D4ED8",
    dot: "#3B82F6",
    border: "#BFDBFE",
  },
  resolved_by_lgu: {
    label: "Resolved by LGU",
    badge: "#ECFDF5",   // GREEN
    text: "#047857",
    dot: "#10B981",
    border: "#A7F3D0",
  },
  rejected_by_lgu: {
    label: "Rejected by LGU",
    badge: "#FEF2F2",   // RED
    text: "#B91C1C",
    dot: "#EF4444",
    border: "#FECACA",
  },

  // ── Department ──────────────────────────────────────────
  forwarded_to_department: {
    label: "Forwarded to Dept.",
    badge: "#FFFBEB",
    text: "#B45309",
    dot: "#F59E0B",
    border: "#FDE68A",
  },
  reviewed_by_department: {
    label: "Under Dept. Review",
    badge: "#EFF6FF",   // BLUE
    text: "#1D4ED8",
    dot: "#3B82F6",
    border: "#BFDBFE",
  },
  resolved_by_department: {
    label: "Resolved by Dept.",
    badge: "#ECFDF5",   // GREEN
    text: "#047857",
    dot: "#10B981",
    border: "#A7F3D0",
  },
  rejected_by_department: {
    label: "Rejected by Dept.",
    badge: "#FEF2F2",   // RED
    text: "#B91C1C",
    dot: "#EF4444",
    border: "#FECACA",
  },
};
export const ALL_STATUSES = [
  "submitted",
  "reviewed_by_barangay",
  "resolved_by_barangay",
  "forwarded_to_lgu",
  "reviewed_by_lgu",
  "resolved_by_lgu",
  "rejected_by_lgu",
  "forwarded_to_department",
  "reviewed_by_department",
  "resolved_by_department",
  "rejected_by_department",
  "rejected",
  "pending",
] as const;

export type Status = typeof ALL_STATUSES[number];

/** Accepts a raw status string, returns its config with a safe fallback. */
export function getStatusConfig(status: string | null): StatusConfig {
  return STATUS_CONFIG[status ?? ""] ?? STATUS_CONFIG["pending"];
}

/** Resolves the true display status of a complaint, checking boolean flags first. */
export function resolveStatus(complaint: Complaint): string {
  if (complaint.is_rejected_by_lgu)        return "rejected_by_lgu";
  if (complaint.is_rejected_by_department) return "rejected_by_department";
  return complaint.status ?? "pending";
}


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