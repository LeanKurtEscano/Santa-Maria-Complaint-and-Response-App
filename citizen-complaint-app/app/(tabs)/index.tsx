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

// ─── Types ────────────────────────────────────────────────────────────────────

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
  { label: 'Isinumite', value: 24, icon: ClipboardList },
  { label: 'Sa Proseso', value: 11, icon: Circle },
  { label: 'Nalutas',   value: 13, icon: CheckCircle },
];

// ─── Colors ───────────────────────────────────────────────────────────────────

const BLUE        = '#2563EB'; // blue-600 — primary
const BLUE_DARK   = '#1d4ed8'; // blue-700
const BLUE_DEEPER = '#1e3a8a'; // blue-900
const BLUE_LIGHT  = '#eff6ff'; // blue-50

// ─── Emergency Type Config ────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  EmergencyType,
  { Icon: any; label: string; iconBg: string; iconColor: string; accentColor: string }
> = {
  flood:   { Icon: Droplets,    label: 'Baha',      iconBg: '#dbeafe', iconColor: '#1d4ed8', accentColor: '#1d4ed8' },
  fire:    { Icon: Flame,       label: 'Sunog',     iconBg: '#ffedd5', iconColor: '#ea580c', accentColor: '#ea580c' },
  power:   { Icon: Zap,         label: 'Kuryente',  iconBg: '#fef9c3', iconColor: '#ca8a04', accentColor: '#ca8a04' },
  health:  { Icon: Thermometer, label: 'Kalusugan', iconBg: '#ffe4e6', iconColor: '#e11d48', accentColor: '#e11d48' },
  typhoon: { Icon: LifeBuoy,    label: 'Bagyo',     iconBg: '#ede9fe', iconColor: '#7c3aed', accentColor: '#7c3aed' },
  crime:   { Icon: ShieldAlert, label: 'Seguridad', iconBg: '#fee2e2', iconColor: '#dc2626', accentColor: '#dc2626' },
};

// ─── Quick Action ─────────────────────────────────────────────────────────────

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
        className="rounded-2xl mb-2 w-14 h-14 items-center justify-center"
        style={{ backgroundColor: BLUE_LIGHT, borderWidth: 1, borderColor: '#bfdbfe' }}
      >
        <Icon size={22} color={BLUE} />
      </View>
      <Text className="text-gray-600 text-xs font-semibold text-center leading-3">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon }: typeof COMPLAINT_STATS[0]) {
  return (
    <View
      className="flex-1 rounded-2xl p-3.5 items-center"
      style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
      }}
    >
      <Icon size={17} color="rgba(255,255,255,0.8)" />
      <Text className="text-white text-xl font-bold mt-1">{value}</Text>
      <Text className="text-blue-100 text-xs font-medium text-center mt-0.5">{label}</Text>
    </View>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: EmergencyAnnouncement }) {
  const cfg = TYPE_CONFIG[item.type];
  const { Icon } = cfg;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="bg-white rounded-2xl overflow-hidden mb-3"
      style={{
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Urgent stripe */}
      {item.isUrgent && (
        <View className="bg-red-500 px-4 py-1.5 flex-row items-center gap-1.5">
          <AlertTriangle size={11} color="white" />
          <Text className="text-white text-xs font-bold tracking-widest uppercase">Kagyat</Text>
        </View>
      )}

      {/* Left accent bar */}
      <View className="flex-row">
        <View style={{ width: 3, backgroundColor: cfg.accentColor }} />

        <View className="flex-1 p-4">
          {/* Top row */}
          <View className="flex-row items-start gap-3 mb-3">
            <View
              className="rounded-xl p-2.5 items-center justify-center"
              style={{ backgroundColor: cfg.iconBg }}
            >
              <Icon size={20} color={cfg.iconColor} />
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-bold uppercase tracking-widest mb-0.5"
                style={{ color: cfg.accentColor }}
              >
                {cfg.label}
              </Text>
              <Text className="text-gray-900 text-sm font-bold leading-5">{item.title}</Text>
            </View>
          </View>

          <Text className="text-gray-500 text-xs leading-5 mb-3">{item.description}</Text>

          {/* Meta pills */}
          <View className="flex-row flex-wrap gap-2">
            <View className="flex-row items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: '#f8fafc' }}>
              <CalendarDays size={11} color="#94a3b8" />
              <Text className="text-slate-500 text-xs font-medium">{item.date}</Text>
            </View>
            {item.time && (
              <View className="flex-row items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: '#f8fafc' }}>
                <Clock size={11} color="#94a3b8" />
                <Text className="text-slate-500 text-xs font-medium">{item.time}</Text>
              </View>
            )}
            {item.location && (
              <View className="flex-row items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: '#f8fafc' }}>
                <MapPin size={11} color="#94a3b8" />
                <Text className="text-slate-500 text-xs font-medium">{item.location}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const urgentCount = announcements.filter((a) => a.isUrgent).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ── Blue Gradient Header ──────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: BLUE,
            // Subtle diagonal shimmer layer via border trick
          }}
          className="px-5 pt-5 pb-12"
        >
          {/* Decorative circle blobs for depth */}
          <View
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255,255,255,0.07)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 60,
              right: 40,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />

          {/* Top row */}
          <View className="flex-row items-start justify-between mb-6">
            <View>
              <View className="flex-row items-center gap-1.5 mb-1">
                <Sparkles size={11} color="#93c5fd" />
                <Text className="text-blue-200 text-xs font-semibold uppercase tracking-widest">
                  Munisipalidad ng
                </Text>
              </View>
              <Text className="text-white text-3xl font-bold leading-8">Santa Maria</Text>
              <Text className="text-blue-200 text-sm mt-0.5 font-medium">Laguna, Pilipinas</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-2xl p-2.5 relative"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <Bell size={22} color="white" />
              {urgentCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white font-bold" style={{ fontSize: 9 }}>
                    {urgentCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Portal strip */}
          <View
            className="rounded-2xl px-4 py-3.5 mb-6 flex-row items-center gap-3"
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <View
              className="rounded-xl p-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <ShieldAlert size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-bold">Opisyal na Portal ng Reklamo</Text>
              <Text className="text-blue-100 text-xs mt-0.5">
                Ang iyong boses ay mahalaga. Mag-ulat ng alalahanin.
              </Text>
            </View>
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

        {/* ── Floating Quick Access Card ────────────────────────────────── */}
        <View
          className="bg-white mx-5 rounded-3xl p-5"
          style={{
            marginTop: -22,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            shadowColor: BLUE,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center gap-2 mb-4">
            <View
              className="w-1.5 h-4 rounded-full"
              style={{ backgroundColor: BLUE }}
            />
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Mabilis na Access
            </Text>
          </View>
          <View className="flex-row justify-between">
            <QuickAction Icon={FileText}      label="Mga Serbisyo" />
            <QuickAction
              Icon={ClipboardList}
              label="Mga Reklamo"
              onPress={() => router.push('/(tabs)/Complaints')}
            />
            <QuickAction Icon={CalendarDays}  label="Mga Kaganapan" />
            <QuickAction Icon={Phone}         label="Hotlines" />
          </View>
        </View>

        {/* ── Urgent Alert Banner ───────────────────────────────────────── */}
        {urgentCount > 0 && (
          <View className="mx-5 mt-4">
            <View
              className="rounded-2xl px-4 py-3.5 flex-row items-center gap-3"
              style={{
                backgroundColor: '#fff7ed',
                borderWidth: 1,
                borderColor: '#fed7aa',
              }}
            >
              <View
                className="rounded-xl p-2"
                style={{ backgroundColor: '#ffedd5' }}
              >
                <AlertTriangle size={18} color="#ea580c" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-bold uppercase tracking-wide mb-0.5"
                  style={{ color: '#9a3412' }}
                >
                  Mga Aktibong Alerto
                </Text>
                <Text className="text-sm font-medium" style={{ color: '#c2410c' }}>
                  {urgentCount} kagyat na anunsyo ang nangangailangan ng iyong pansin
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Announcements ─────────────────────────────────────────────── */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2.5">
              <View
                className="rounded-xl p-2"
                style={{ backgroundColor: BLUE_LIGHT, borderWidth: 1, borderColor: '#bfdbfe' }}
              >
                <ShieldAlert size={16} color={BLUE} />
              </View>
              <Text className="text-gray-900 text-base font-bold">Mga Anunsyo at Alerto</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} className="flex-row items-center gap-0.5">
              <Text className="text-sm font-semibold" style={{ color: BLUE }}>Lahat</Text>
              <ChevronRight size={14} color={BLUE} />
            </TouchableOpacity>
          </View>

          {announcements.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </View>

      </ScrollView>

      {/* ── Floating Submit Button ────────────────────────────────────── */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-2">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Complaints')}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-2.5 py-4 rounded-2xl"
          style={{
            backgroundColor: BLUE,
            shadowColor: BLUE_DARK,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 20,
            elevation: 14,
          }}
        >
          <View
            className="rounded-xl p-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
          >
            <MessageSquarePlus size={18} color="white" />
          </View>
          <Text className="text-white text-base font-bold">Magsumite ng Reklamo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}