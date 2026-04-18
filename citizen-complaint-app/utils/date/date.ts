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