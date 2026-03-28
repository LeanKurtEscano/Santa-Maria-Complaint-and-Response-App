import { View, Text, TouchableOpacity } from 'react-native';
import { CalendarDays, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

export function Tag({ label }: { label: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 99, backgroundColor: THEME.primaryMuted, borderWidth: 1, borderColor: THEME.primary + '33', paddingHorizontal: 12, paddingVertical: 4 }}>
      <Text style={{ color: THEME.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: THEME.primary, fontSize: 11, fontWeight: '700' }}>{name[0]?.toUpperCase() ?? 'L'}</Text>
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
        <View style={{ borderRadius: 12, padding: 8, backgroundColor: THEME.primaryMuted, borderWidth: 1, borderColor: THEME.primary + '33' }}>
          <Icon size={16} color={THEME.primary} />
        </View>
        <Text className="text-slate-900 text-base font-extrabold">{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} className="flex-row items-center gap-0.5">
          <Text style={{ color: THEME.primary, fontSize: 13, fontWeight: '700' }}>{actionLabel}</Text>
          <ChevronRight size={13} color={THEME.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}