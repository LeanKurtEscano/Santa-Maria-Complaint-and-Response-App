import { getStatusConfig } from "@/constants/complaint/complaint";
import { Text, View } from "react-native";


interface StatusBadgeProps {
  status: string | null;
  withBorder?: boolean;
}

export function StatusBadge({ status, withBorder = false }: StatusBadgeProps) {
  const cfg = getStatusConfig(status);
  return (
    <View
      className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.badge} ${
        withBorder ? `border ${cfg.border}` : ""
      }`}
    >
      <View className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
    </View>
  );
}