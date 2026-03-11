export function formatPHPhoneForUI(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+63")) {
    return "0" + cleaned.slice(3);
  }

  if (cleaned.startsWith("63")) {
    return "0" + cleaned.slice(2);
  }

  return cleaned;
}