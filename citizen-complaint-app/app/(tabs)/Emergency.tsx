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
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Phone,
  ShieldAlert,
  Flame,
  ChevronLeft,
  X,
  AlertTriangle,
  Tent,
  Siren,
} from 'lucide-react-native';
import { EVACUATION_CENTERS } from '@/constants/emergency/evacuation';
import { EvacuationCenterCard } from '@/components/emergency/EvacuationCenterCard';
import { useProfileLogic } from '@/hooks/general/useProfile';
import { formatPHPhoneForUI } from '@/utils/general/phone';
import { emergencyApiClient } from '@/lib/client/emergency';

// ── Types ─────────────────────────────────────────────────────────────────────
interface EmergencyContactAPI {
  id: number;
  contact_number: string;
}

interface EmergencyAgency {
  id: number;
  agency_name: string;
  created_at: string;
  updated_at: string | null;
  contacts: EmergencyContactAPI[];
}

interface PendingContact {
  name: string;
  phoneNumber: string;
}

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
  mdrrmo: {
    Icon: Siren,
    iconColor: '#059669',
    iconBg: 'bg-emerald-100',
    borderColor: '#059669',
    btnColor: '#059669',
  },
};

const DEFAULT_THEME = SERVICE_THEMES.pnp;

// ─────────────────────────────────────────────────────────────────────────────

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pendingContact, setPendingContact] = useState<PendingContact | null>(null);

  const { userData } = useProfileLogic();
  const userLat = userData?.latitude ? parseFloat(userData.latitude) : null;
  const userLng = userData?.longitude ? parseFloat(userData.longitude) : null;

  // ── Fetch hotlines ───────────────────────────────────────────────────────────
  const {
    data: rawAgencies,
    isLoading,
    isError,
    refetch,
  } = useQuery<EmergencyAgency[]>({
    queryKey: ['emergency-hotlines'],
    queryFn: async () => {
      const response = await emergencyApiClient.get('/');
      const data = response.data;
      // Guard: API must return an array
      if (!Array.isArray(data)) {
        console.warn('[EmergencyScreen] Unexpected hotlines payload:', data);
        return [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Always a safe array regardless of what the query returned
  const agencies: EmergencyAgency[] = Array.isArray(rawAgencies) ? rawAgencies : [];

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCallPress = (contact: PendingContact) => setPendingContact(contact);

  const handleConfirmCall = async () => {
    if (!pendingContact) return;
    setPendingContact(null);
    try {
      await Linking.openURL(`tel:${pendingContact.phoneNumber}`);
    } catch {
      Alert.alert(
        t('emergency.dialerUnavailableTitle'),
        t('emergency.dialerUnavailableMessage'),
      );
    }
  };

  const handleCancelCall = () => setPendingContact(null);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1D4ED8']}
            tintColor="#1D4ED8"
          />
        }
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

        {isLoading && (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#1D4ED8" />
          </View>
        )}

        {isError && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <Text className="text-[13px] font-medium text-red-700 text-center">
              {t('emergency.loadError', { defaultValue: 'Failed to load hotlines. Please try again.' })}
            </Text>
          </View>
        )}

        {/* Guard: only render when we have a valid non-empty array */}
        {!isLoading && !isError && agencies.length === 0 && (
          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
            <Text className="text-[13px] font-medium text-slate-500 text-center">
              {t('emergency.noHotlines', { defaultValue: 'No hotlines available at the moment.' })}
            </Text>
          </View>
        )}

        {agencies.map((agency) => {
          // Guard: skip malformed agency entries
          if (!agency || typeof agency !== 'object') return null;

          const themeKey = agency.agency_name?.toLowerCase() ?? '';
          const theme = SERVICE_THEMES[themeKey] ?? DEFAULT_THEME;

          // Guard: contacts must be an array
          const contacts: EmergencyContactAPI[] = Array.isArray(agency.contacts)
            ? agency.contacts
            : [];

          return (
            <View
              key={agency.id}
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
              {/* Icon + agency name */}
              <View className="flex-row items-center gap-x-4 mb-4">
                <View className={`w-14 h-14 rounded-full items-center justify-center ${theme.iconBg}`}>
                  <theme.Icon size={28} color={theme.iconColor} />
                </View>
                <Text className="text-[16px] font-bold text-slate-800">
                  {agency.agency_name ?? ''}
                </Text>
              </View>

              {contacts.length === 0 && (
                <Text className="text-[13px] text-slate-400 text-center py-2">
                  {t('emergency.noContacts', { defaultValue: 'No contact numbers available.' })}
                </Text>
              )}

              {contacts.map((contact) => {
                // Guard: skip malformed contact entries
                if (!contact || !contact.contact_number) return null;

                return (
                  <TouchableOpacity
                    key={contact.id}
                    className="flex-row items-center justify-center rounded-xl py-[15px] mb-2"
                    style={{ backgroundColor: theme.btnColor }}
                    onPress={() =>
                      handleCallPress({
                        name: agency.agency_name ?? '',
                        phoneNumber: contact.contact_number,
                      })
                    }
                    activeOpacity={0.82}
                  >
                    <View className="flex-row items-center w-48">
                      <Phone size={18} color="#fff" />
                      <Text className="text-[15px] font-bold text-white ml-2">
                        {formatPHPhoneForUI(contact.contact_number)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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

        <View className="flex-row items-start gap-x-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
          <Tent size={18} color="#059669" />
          <Text className="flex-1 text-[13px] font-medium text-emerald-800 leading-5">
            {t('emergency.evacuation.notice')}
          </Text>
        </View>

        {/* Guard: EVACUATION_CENTERS must be an array */}
        {Array.isArray(EVACUATION_CENTERS) && EVACUATION_CENTERS.map((center) => (
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
              {t('emergency.modal.body', { service: pendingContact?.name ?? '' })}
            </Text>

            <Text className="text-[22px] font-extrabold text-slate-800 mt-2 mb-6">
              {pendingContact?.phoneNumber
                ? formatPHPhoneForUI(pendingContact.phoneNumber)
                : ''}
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