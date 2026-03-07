// components/home/ui.tsx
// Shared primitives: Tag, Avatar, DateChip, SectionHeader
import { View, Text, TouchableOpacity } from 'react-native';
import { CalendarDays, ChevronRight } from 'lucide-react-native';

export function Tag({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-blue-50 border border-blue-100 px-3 py-1">
      <Text className="text-blue-600 text-[10px] font-bold tracking-wider uppercase">{label}</Text>
    </View>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <View className="w-7 h-7 rounded-full bg-blue-100 items-center justify-center">
      <Text className="text-blue-600 text-[11px] font-bold">{name[0]?.toUpperCase() ?? 'L'}</Text>
    </View>
  );
}

export function DateChip({ date }: { date: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
      <CalendarDays size={10} color="#94A3B8" />
      <Text className="text-slate-400 text-[11px] font-semibold">{date}</Text>
    </View>
  );
}

export function SectionHeader({ Icon, title, actionLabel, onAction }: {
  Icon: any; title: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-2.5">
        <View className="rounded-xl p-2 bg-blue-50 border border-blue-100">
          <Icon size={16} color="#2563EB" />
        </View>
        <Text className="text-slate-900 text-base font-extrabold">{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} className="flex-row items-center gap-0.5">
          <Text className="text-[13px] font-bold text-blue-600">{actionLabel}</Text>
          <ChevronRight size={13} color="#2563EB" />
        </TouchableOpacity>
      )}
    </View>
  );
}