import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  ShieldAlert,
  Flame,
  ChevronLeft,
  X,
  AlertTriangle,
  Tent,
} from 'lucide-react-native';
import {EMERGENCY_CONTACTS,  EmergencyContact} from '@/constants/emergency/phoneNumber';
import { EVACUATION_CENTERS } from '@/constants/emergency/evacuation';
import { EvacuationCenterCard } from '@/components/emergency/EvacuationCenterCard';
import { useProfileLogic } from '@/hooks/general/useProfile';

// ── Per-service visual config ─────────────────────────────────────────────────
interface ServiceTheme {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  btnColor: string;
}

const SERVICE_THEMES: Record<string, ServiceTheme> = {
  pnp: {
    Icon: ShieldAlert,
    iconColor: '#1D4ED8',
    iconBg: 'bg-blue-100',
    borderColor: '#1D4ED8',
    btnColor: '#1D4ED8',
  },
  bfp: {
    Icon: Flame,
    iconColor: '#DC2626',
    iconBg: 'bg-red-100',
    borderColor: '#DC2626',
    btnColor: '#DC2626',
  },
};

const DEFAULT_THEME = SERVICE_THEMES.pnp;

// ─────────────────────────────────────────────────────────────────────────────

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pendingContact, setPendingContact] = useState<EmergencyContact | null>(null);

  // Pull user coords for distance calculation — same hook used by ProfileScreen
  const { userData } = useProfileLogic();
  const userLat = userData?.latitude ? parseFloat(userData.latitude) : null;
  const userLng = userData?.longitude ? parseFloat(userData.longitude) : null;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCallPress = (contact: EmergencyContact) => setPendingContact(contact);

  const handleConfirmCall = async () => {
    if (!pendingContact) return;
    setPendingContact(null);
    const url = `tel:${pendingContact.phoneNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        t('emergency.dialerUnavailableTitle'),
        t('emergency.dialerUnavailableMessage'),
      );
    }
  };

  const handleCancelCall = () => setPendingContact(null);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 items-center justify-center"
          hitSlop={12}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text className="text-[17px] font-bold text-slate-800 tracking-tight">
          {t('emergency.title')}
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Warning banner ── */}
        <View className="flex-row items-start gap-x-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <AlertTriangle size={20} color="#B91C1C" />
          <Text className="flex-1 text-[13px] font-medium text-red-800 leading-5">
            {t('emergency.bannerText')}
          </Text>
        </View>

        {/* ════════════════════════════════════
            SECTION: Emergency Hotlines
        ════════════════════════════════════ */}
        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          {t('emergency.sections.hotlines')}
        </Text>

        {EMERGENCY_CONTACTS.map((contact) => {
          const theme = SERVICE_THEMES[contact.id] ?? DEFAULT_THEME;
          const serviceName = t(contact.nameKey);

          return (
            <View
              key={contact.id}
              className="bg-white rounded-2xl p-5 mb-4"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: theme.borderColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Icon + info */}
              <View className="flex-row items-center gap-x-4 mb-5">
                <View className={`w-14 h-14 rounded-full items-center justify-center ${theme.iconBg}`}>
                  <theme.Icon size={28} color={theme.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-slate-800">
                    {serviceName}
                  </Text>
                  <Text className="text-[14px] font-semibold text-slate-400 mt-0.5">
                    {contact.phoneNumber}
                  </Text>
                </View>
              </View>

              {/* Call button */}
              <TouchableOpacity
                className="flex-row items-center justify-center gap-x-2 rounded-xl py-[15px]"
                style={{ backgroundColor: theme.btnColor }}
                onPress={() => handleCallPress(contact)}
                activeOpacity={0.82}
              >
                <Phone size={18} color="#fff" />
                <Text className="text-[15px] font-bold text-white">
                  {t('emergency.callButton')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ════════════════════════════════════
            SECTION: Evacuation Centers
        ════════════════════════════════════ */}
        <View className="flex-row items-center gap-x-2 mb-3 mt-2">
          <Tent size={16} color="#059669" />
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {t('emergency.sections.evacuationCenters')}
          </Text>
        </View>

        {/* Evacuation info notice */}
        <View className="flex-row items-start gap-x-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
          <Tent size={18} color="#059669" />
          <Text className="flex-1 text-[13px] font-medium text-emerald-800 leading-5">
            {t('emergency.evacuation.notice')}
          </Text>
        </View>

        {EVACUATION_CENTERS.map((center) => (
          <EvacuationCenterCard
            key={center.id}
            center={center}
            userLatitude={userLat}
            userLongitude={userLng}
          />
        ))}

        {/* ── Disclaimer ── */}
        <Text className="text-[11px] text-slate-400 text-center leading-4 px-4 mt-2">
          {t('emergency.disclaimer')}
        </Text>

      </ScrollView>

      {/* ── Confirmation modal ── */}
      <Modal
        visible={pendingContact !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCall}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={handleCancelCall}
        >
          <Pressable
            className="w-full bg-white rounded-3xl p-6 items-center"
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              className="absolute top-4 right-4 p-1"
              onPress={handleCancelCall}
              hitSlop={12}
            >
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-3">
              <Phone size={32} color="#DC2626" />
            </View>

            <Text className="text-[17px] font-bold text-slate-800 mb-2">
              {t('emergency.modal.title')}
            </Text>

            <Text className="text-[14px] text-slate-500 text-center leading-5">
              {t('emergency.modal.body', {
                service: t(pendingContact?.nameKey ?? ''),
              })}
            </Text>

            <Text className="text-[22px] font-extrabold text-slate-800 mt-2 mb-6">
              {pendingContact?.phoneNumber}
            </Text>

            <View className="flex-row gap-x-3 w-full">
              <TouchableOpacity
                className="flex-1 bg-slate-100 rounded-xl py-4 items-center justify-center"
                onPress={handleCancelCall}
                activeOpacity={0.8}
              >
                <Text className="text-[15px] font-semibold text-slate-600">
                  {t('emergency.modal.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-xl py-4 flex-row items-center justify-center gap-x-2"
                onPress={handleConfirmCall}
                activeOpacity={0.85}
              >
                <Phone size={16} color="#fff" />
                <Text className="text-[15px] font-bold text-white">
                  {t('emergency.modal.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}