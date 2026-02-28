import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Droplets,
  FileText,
  Flame,
  LifeBuoy,
  MapPin,
  MessageSquarePlus,
  Phone,
  ShieldAlert,
  Thermometer,
  Zap,
  ChevronRight,
  Clock,
  CalendarDays,
  ClipboardList,
  CheckCircle,
  Circle,
  Sparkles,
} from 'lucide-react-native';
import ChatbotFAB from '@/components/buttons/Chatbotfab';
import { useState } from 'react';
import ChatbotModal from '@/components/modals/Chatbot';

type EmergencyType = 'flood' | 'fire' | 'power' | 'health' | 'typhoon' | 'crime';

interface EmergencyAnnouncement {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  type: EmergencyType;
  isUrgent: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const announcements: EmergencyAnnouncement[] = [
  {
    id: '1',
    title: 'Babala sa Pagbaha',
    description:
      'Mataas na antas ng tubig sa Ilog Santa Maria. Inirerekumenda ang agarang paglipat ng mga residente sa mababang lugar.',
    date: 'Pebrero 20, 2026',
    time: '6:00 AM',
    location: 'Barangay Sto. Cristo, Zones 3–5',
    type: 'flood',
    isUrgent: true,
  },
  {
    id: '2',
    title: 'Abiso ng Pagkawala ng Kuryente',
    description:
      'Nakaplanong pagpapanatili ng linya ng kuryente. Maaaring makaranas ng pagkawala ng kuryente ang mga apektadong barangay.',
    date: 'Pebrero 22, 2026',
    time: '8:00 AM – 5:00 PM',
    location: 'Barangay Bagong Bayan & San Calix',
    type: 'power',
    isUrgent: false,
  },
  {
    id: '3',
    title: 'Alerto sa Dengue',
    description:
      'Tumaas ang bilang ng kaso ng dengue. Ipinapayo sa mga residente na alisin ang nakatenggang tubig at magsuot ng pangproteksyon.',
    date: 'Patuloy',
    type: 'health',
    isUrgent: true,
  },
  {
    id: '4',
    title: 'Babala sa Bagyo: Bagyong Ester',
    description:
      'Papalapit na bagyo sa lalawigan. Ihanda ang emergency kit at makinig sa opisyal na anunsyo mula sa NDRRMC.',
    date: 'Pebrero 24, 2026',
    time: '12:00 NN',
    type: 'typhoon',
    isUrgent: true,
  },
  {
    id: '5',
    title: 'Nasunog na Bahay sa Brgy. Pulong Buhangin',
    description:
      'Kasalukuyang tinutugunan ng BFP ang sunog. Iwasang pumasok sa lugar. Huwag mag-panic.',
    date: 'Pebrero 19, 2026',
    time: '10:45 PM',
    location: 'Barangay Pulong Buhangin',
    type: 'fire',
    isUrgent: false,
  },
];

const COMPLAINT_STATS = [
  { label: 'Isinumite', value: 24, icon: ClipboardList, color: '#bfdbfe' },
  { label: 'Sa Proseso', value: 11, icon: Circle,        color: '#fde68a' },
  { label: 'Nalutas',   value: 13, icon: CheckCircle,   color: '#bbf7d0' },
];

// ─── Colors ───────────────────────────────────────────────────────────────────

const BLUE      = '#2563EB';
const BLUE_DARK = '#1d4ed8';
const BLUE_LIGHT = '#eff6ff';

// ─── Emergency Type Config ────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  EmergencyType,
  { Icon: any; label: string; iconBg: string; iconColor: string; accentColor: string; accentBg: string }
> = {
  flood:   { Icon: Droplets,    label: 'Baha',      iconBg: '#dbeafe', iconColor: '#1d4ed8', accentColor: '#1d4ed8', accentBg: '#eff6ff' },
  fire:    { Icon: Flame,       label: 'Sunog',     iconBg: '#ffedd5', iconColor: '#ea580c', accentColor: '#ea580c', accentBg: '#fff7ed' },
  power:   { Icon: Zap,         label: 'Kuryente',  iconBg: '#fef9c3', iconColor: '#ca8a04', accentColor: '#ca8a04', accentBg: '#fefce8' },
  health:  { Icon: Thermometer, label: 'Kalusugan', iconBg: '#ffe4e6', iconColor: '#e11d48', accentColor: '#e11d48', accentBg: '#fff1f2' },
  typhoon: { Icon: LifeBuoy,    label: 'Bagyo',     iconBg: '#ede9fe', iconColor: '#7c3aed', accentColor: '#7c3aed', accentBg: '#f5f3ff' },
  crime:   { Icon: ShieldAlert, label: 'Seguridad', iconBg: '#fee2e2', iconColor: '#dc2626', accentColor: '#dc2626', accentBg: '#fef2f2' },
};

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
  Icon,
  label,
  onPress,
}: {
  Icon: any;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} className="items-center flex-1">
      <View
        className="rounded-2xl mb-2.5 w-14 h-14 items-center justify-center"
        style={{ backgroundColor: BLUE_LIGHT, borderWidth: 1.5, borderColor: '#bfdbfe' }}
      >
        <Icon size={22} color={BLUE} />
      </View>
      <Text className="text-gray-700 text-xs font-bold text-center leading-4">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: typeof COMPLAINT_STATS[0]) {
  return (
    <View
      className="flex-1 rounded-2xl p-3.5 items-center"
      style={{
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
      }}
    >
      <Icon size={16} color={color} />
      <Text className="text-white text-2xl font-bold mt-1.5">{value}</Text>
      <Text className="text-blue-100 text-xs font-semibold text-center mt-0.5 leading-4">{label}</Text>
    </View>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: EmergencyAnnouncement }) {
  const cfg = TYPE_CONFIG[item.type];
  const { Icon } = cfg;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Urgent top stripe */}
      {item.isUrgent && (
        <View
          className="flex-row items-center px-4 py-2 gap-2"
          style={{ backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FECACA' }}
        >
          <AlertTriangle size={12} color="#DC2626" />
          <Text className="text-red-700 text-xs font-bold tracking-widest uppercase flex-1">
            Kagyat na Anunsyo
          </Text>
          <View className="w-2 h-2 rounded-full bg-red-500" />
        </View>
      )}

      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-start gap-3 mb-3">
          {/* Type icon */}
          <View
            className="rounded-xl p-2.5 items-center justify-center shrink-0"
            style={{ backgroundColor: cfg.iconBg }}
          >
            <Icon size={20} color={cfg.iconColor} />
          </View>

          {/* Title block */}
          <View className="flex-1">
            <View
              className="self-start rounded-full px-2.5 py-0.5 mb-1.5"
              style={{ backgroundColor: cfg.accentBg }}
            >
              <Text className="text-xs font-bold" style={{ color: cfg.accentColor }}>
                {cfg.label}
              </Text>
            </View>
            <Text className="text-gray-900 text-sm font-bold leading-5">{item.title}</Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-gray-500 text-xs leading-[18px] mb-3">{item.description}</Text>

        {/* Meta row */}
        <View className="flex-row flex-wrap gap-2">
          <MetaPill icon={CalendarDays} text={item.date} />
          {item.time && <MetaPill icon={Clock} text={item.time} />}
          {item.location && <MetaPill icon={MapPin} text={item.location} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetaPill({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
    >
      <Icon size={11} color="#94A3B8" />
      <Text className="text-slate-500 text-xs font-medium">{text}</Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  Icon,
  title,
  actionLabel,
  onAction,
}: {
  Icon: any;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-2.5">
        <View
          className="rounded-xl p-2"
          style={{ backgroundColor: BLUE_LIGHT, borderWidth: 1, borderColor: '#bfdbfe' }}
        >
          <Icon size={16} color={BLUE} />
        </View>
        <Text className="text-gray-900 text-base font-bold">{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} className="flex-row items-center gap-0.5" activeOpacity={0.7}>
          <Text className="text-sm font-semibold" style={{ color: BLUE }}>{actionLabel}</Text>
          <ChevronRight size={14} color={BLUE} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const urgentCount = announcements.filter((a) => a.isUrgent).length;
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View
          className="px-5 pt-5 pb-14"
          style={{ backgroundColor: BLUE }}
        >
          {/* Decorative blobs */}
          <View style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ position: 'absolute', top: 70, right: 50, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          <View style={{ position: 'absolute', bottom: 20, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          {/* Top row: location + notification */}
          <View className="flex-row items-start justify-between mb-7">
            <View>
              <View className="flex-row items-center gap-1.5 mb-1">
                <Sparkles size={11} color="#93c5fd" />
                <Text className="text-blue-200 text-xs font-bold uppercase tracking-widest">
                  Munisipalidad ng
                </Text>
              </View>
              <Text className="text-white text-3xl font-bold leading-8">Santa Maria</Text>
              <Text className="text-blue-200 text-sm mt-1 font-medium">Laguna, Pilipinas</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-2xl p-3 mt-1 relative"
              style={{
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.22)',
              }}
            >
              <Bell size={22} color="white" />
              {urgentCount > 0 && (
                <View className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-blue-600">
                  <Text className="text-white font-bold" style={{ fontSize: 9 }}>
                    {urgentCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Complaint stats */}
          <Text className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">
            Iyong mga Reklamo
          </Text>
          <View className="flex-row gap-3">
            {COMPLAINT_STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </View>
        </View>

        {/* ── Floating Quick Access Card (overlaps header) ─────────────── */}
        <View
          className="bg-white mx-5 rounded-3xl p-5"
          style={{
            marginTop: -24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Mabilis na Access
          </Text>
          <View className="flex-row justify-between">
            <QuickAction Icon={FileText}      label={`Mga\nSerbisyo`} />
            <QuickAction
              Icon={ClipboardList}
              label={`Mga\nReklamo`}
              onPress={() => router.push('/(tabs)/Complaints')}
            />
            <QuickAction Icon={CalendarDays}  label={`Mga\nKaganapan`} />
            <QuickAction Icon={Phone}         label="Hotlines" />
          </View>
        </View>

        {/* ── Urgent Alert Banner ──────────────────────────────────────── */}
        {urgentCount > 0 && (
          <View className="mx-5 mt-5">
            <View
              className="rounded-2xl px-4 py-4 flex-row items-center gap-3"
              style={{
                backgroundColor: '#FFF7ED',
                borderWidth: 1,
                borderColor: '#FDBA74',
              }}
            >
              <View className="rounded-xl p-2.5" style={{ backgroundColor: '#FFEDD5' }}>
                <AlertTriangle size={20} color="#EA580C" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-orange-900 mb-0.5">
                  {urgentCount} Kagyat na Alerto
                </Text>
                <Text className="text-xs text-orange-700 leading-4">
                  Mangyaring basahin ang mga anunsyo sa ibaba at sundin ang mga tagubilin.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Announcements ─────────────────────────────────────────────── */}
        <View className="px-5 mt-6">
          <SectionHeader
            Icon={ShieldAlert}
            title="Mga Anunsyo at Alerto"
            actionLabel="Lahat"
            onAction={() => {}}
          />
          {announcements.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </View>

      </ScrollView>

    <ChatbotFAB onPress={() => setChatOpen(true)} />
   <ChatbotModal visible={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── Submit Complaint Button ───────────────────────────────────── */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Complaints')}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-2.5 py-4 rounded-2xl"
          style={{
            backgroundColor: BLUE,
            shadowColor: BLUE_DARK,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 10,
          }}
        >
          <MessageSquarePlus size={20} color="white" />
          <Text className="text-white text-base font-bold">Magsumite ng Reklamo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}