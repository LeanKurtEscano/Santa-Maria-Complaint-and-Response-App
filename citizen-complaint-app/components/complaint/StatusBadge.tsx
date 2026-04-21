import { getStatusConfig } from "@/constants/complaint/complaint";
import { Text, View } from "react-native";

interface StatusBadgeProps {
  status: string | null;
  is_rejected_by_lgu?: boolean;
  is_rejected_by_department?: boolean;
  withBorder?: boolean;
}

export function StatusBadge({ status, is_rejected_by_lgu, is_rejected_by_department, withBorder = false }: StatusBadgeProps) {
  const resolvedStatus = is_rejected_by_lgu
    ? "rejected_by_lgu"
    : is_rejected_by_department
    ? "rejected_by_department"
    : status;

  const cfg = getStatusConfig(resolvedStatus);

  return (
  <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: cfg.badge,
    borderWidth: withBorder ? 1 : 0,
    borderColor: cfg.border,
  }}
>
  <View
    style={{
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: cfg.dot,
    }}
  />
  <Text
    style={{
      fontSize: 12,
      fontWeight: "600",
      color: cfg.text,
    }}
  >
    {cfg.label}
  </Text>
</View>
  );
}