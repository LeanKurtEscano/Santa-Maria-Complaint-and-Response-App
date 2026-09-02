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
  RefreshControl,
  FlatList,
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
  ChevronDown,
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
import { EmergencyAgency, EmergencyContactAPI, PendingContact, ServiceTheme } from '@/types/general/emergency';
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { barangayApiClient } from '@/lib/client/barangay';
import { Barangay, BarangayPage } from '@/types/general/barangay';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { evacuationApiClient } from '@/lib/client/emergency';

const SERVICE_THEMES: Record<string, ServiceTheme> = {
  pnp: {
    Icon: ShieldAlert,
    iconColor: '#1D4ED8',
    iconBg: 'bg-blue-100',
    borderColor: '#1D4ED8',
    btnColor: '#1D4ED8',
    fullName: 'Philippine National Police',
  },
  bfp: {
    Icon: Flame,
    iconColor: '#DC2626',
    iconBg: 'bg-red-100',
    borderColor: '#DC2626',
    btnColor: '#DC2626',
    fullName: 'Bureau of Fire Protection',
  },
  mdrrmo: {
    Icon: Siren,
    iconColor: '#059669',
    iconBg: 'bg-emerald-100',
    borderColor: '#059669',
    btnColor: '#059669',
    fullName: 'Municipal Disaster Risk Reduction and Management Office',
  },
};
const DEFAULT_THEME = SERVICE_THEMES.pnp;
const PAGE_SIZE = 20;

/**
 * Raw shape returned by /nearby and /barangay/{id}.
 * Adjust here if your backend field names change.
 */
type EvacuationCenterAPI = {
  id: number;
  center_name: string;
  barangay_id: number;
  address: string;
  latitude: number;
  longitude: number;
  contact_number: string | null;
};

/**
 * NOTE: This is a best-guess normalizer. It assumes EvacuationCenterCard
 * expects a camelCase shape similar to the rest of this screen's types
 * (e.g. PendingContact). Once you share the real EvacuationCenterCard
 * code/prop type, only this function should need to change.
 */
const normalizeEvacuationCenter = (apiCenter: EvacuationCenterAPI) => ({
  id: apiCenter.id,
  name: apiCenter.center_name,
  address: apiCenter.address,
  latitude: apiCenter.latitude,
  longitude: apiCenter.longitude,
  contactNumber: apiCenter.contact_number ?? undefined,
});

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pendingContact, setPendingContact] = useState<PendingContact | null>(null);

  const { isAuthenticated, userData: currentUser, fetchCurrentUser } = useCurrentUser();

  const { userData } = useProfileLogic();
  const userLat = userData?.latitude ? parseFloat(userData.latitude) : null;
  const userLng = userData?.longitude ? parseFloat(userData.longitude) : null;

  const isGateOpen = isAuthenticated && !!currentUser?.is_verified;

  // ── Barangay list (for the dropdown) ────────────────────────────────────────
  const {
    data,
    isPending,
    error,
    refetch: refetchBarangay,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['barangays'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await barangayApiClient.get('/all', {
        params: { page: pageParam, page_size: PAGE_SIZE },
      });
      return response.data as BarangayPage;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isGateOpen,
  });

  const barangays: Barangay[] = data?.pages.flatMap((page) => page.data) ?? [];

  // ── Evacuation centers: dropdown state + selection ──────────────────────────
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | null>(null);
  const [isBarangayPickerOpen, setIsBarangayPickerOpen] = useState(false);

  const selectedBarangay = barangays.find((b) => b.id === selectedBarangayId) ?? null;
  const isBarangayMode = selectedBarangayId !== null;

  // Default: nearby evacuation centers
  const {
    data: nearbyCenters,
    isLoading: isNearbyLoading,
    isError: isNearbyError,
    refetch: refetchNearby,
  } = useQuery<EvacuationCenterAPI[]>({
    queryKey: ['evacuation-centers', 'nearby'],
    queryFn: async () => {
      const response = await evacuationApiClient.get('/nearby');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: isGateOpen,
    staleTime: 1000 * 60 * 5,
  });

  // Selected barangay's evacuation centers (only runs once a barangay is picked)
  const {
    data: barangayCenters,
    isLoading: isBarangayCentersLoading,
    isError: isBarangayCentersError,
    refetch: refetchBarangayCenters,
  } = useQuery<EvacuationCenterAPI[]>({
    queryKey: ['evacuation-centers', 'barangay', selectedBarangayId],
    queryFn: async () => {
      const response = await evacuationApiClient.get(`/barangay/${selectedBarangayId}`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: isGateOpen && isBarangayMode,
    staleTime: 1000 * 60 * 5,
  });

  const isEvacLoading = isBarangayMode ? isBarangayCentersLoading : isNearbyLoading;
  const isEvacError = isBarangayMode ? isBarangayCentersError : isNearbyError;
  const activeApiCenters = isBarangayMode ? barangayCenters : nearbyCenters;

  // Fallback rule: whichever source is active, if it comes back empty, use the
  // static EVACUATION_CENTERS list instead.
  const evacuationCentersToRender =
    Array.isArray(activeApiCenters) && activeApiCenters.length > 0
      ? activeApiCenters.map(normalizeEvacuationCenter)
      : EVACUATION_CENTERS;

  const isUsingFallback = !(Array.isArray(activeApiCenters) && activeApiCenters.length > 0);

  const handleSelectBarangay = (barangayId: number | null) => {
    setSelectedBarangayId(barangayId);
    setIsBarangayPickerOpen(false);
  };

  const handleBarangayListEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const params = useLocalSearchParams();

  const {
    data: rawAgencies,
    isLoading,
    isError,
    refetch,
  } = useQuery<EmergencyAgency[]>({
    queryKey: ['emergency-hotlines'],
    queryFn: async () => {
      const response = await emergencyApiClient.get('/emergency-hotlines');
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
    await Promise.all([
      refetch(),
      refetchNearby(),
      isBarangayMode ? refetchBarangayCenters() : Promise.resolve(),
    ]);
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

  useEffect(() => {
    if (!params.agency || isLoading || agencies.length === 0) return;

    try {
      const incomingAgency = (params.agency as string).toLowerCase();

      const matchedAgency = agencies.find(
        (a) => a.agency_name?.toLowerCase() === incomingAgency
      );

      if (!matchedAgency) return;

      const contacts: EmergencyContactAPI[] = Array.isArray(matchedAgency.emergency_contacts)
        ? matchedAgency.emergency_contacts
        : [];

      if (!contacts.length) return;

      setPendingContact({
        name: matchedAgency.agency_name ?? '',
        phoneNumber: contacts[0].contact_number,
      });

    } catch (err) {
      console.warn('Failed to parse emergency agency from params:', err);
    }
  }, [params.agency, isLoading, agencies]);

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

          // ✅ Fixed: was `agency.contacts`, now `agency.emergency_contacts`
          const contacts: EmergencyContactAPI[] = Array.isArray(agency.emergency_contacts)
            ? agency.emergency_contacts
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
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-slate-800 uppercase">
                    {agency.agency_name ?? ''}
                  </Text>
                  <Text className="text-[11px] text-slate-500 leading-4 mt-0.5">
                    {theme.fullName}
                  </Text>
                  <Text className="text-[11px] text-slate-400 leading-4">
                    Santa Maria, Laguna
                  </Text>
                </View>
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
                    <Phone size={18} color="#fff" />
                    <Text className="text-[15px] font-bold text-white ml-2">
                      {formatPHPhoneForUI(contact.contact_number)}
                    </Text>
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

        {/* ── Barangay dropdown (before the map) ── */}

      
{/* ── Barangay dropdown (before the map) ── */}
{isGateOpen && (
  <TouchableOpacity
    className="flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-[14px] mb-2"
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    }}
    onPress={() => setIsBarangayPickerOpen(true)}
    activeOpacity={0.75}
  >
    <View className="flex-1">
      <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
        {t('emergency.evacuation.barangayLabel', { defaultValue: 'Barangay' })}
      </Text>
      <Text className="text-[15px] font-bold text-slate-800">
        {selectedBarangay?.barangay_name ??
          t('emergency.evacuation.nearbyDefault', { defaultValue: 'Nearby (Default)' })}
      </Text>
    </View>
    <ChevronDown size={20} color="#64748B" />
  </TouchableOpacity>
)}

        {isUsingFallback && (
          <Text className="text-[11px] text-slate-400 mb-3 px-1">
            {t('emergency.evacuation.fallbackNotice', {
              defaultValue: 'Showing default evacuation centers for this area.',
            })}
          </Text>
        )}

        {!isUsingFallback && <View className="mb-3" />}
{isGateOpen && isEvacLoading && (
  <View className="items-center py-6">
    <ActivityIndicator size="small" color="#059669" />
  </View>
)}

      {isGateOpen && isEvacError && (
  <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
    <Text className="text-[13px] font-medium text-red-700 text-center">
      {t('emergency.evacuation.loadError', {
        defaultValue: 'Failed to load evacuation centers. Showing defaults instead.',
      })}
    </Text>
  </View>
)}

        {/* Guard: evacuationCentersToRender must be an array */}
       {Array.isArray(evacuationCentersToRender) && evacuationCentersToRender.length > 0 && (
  <EvacuationCenterCard
    centers={evacuationCentersToRender}
    areaLabel={isUsingFallback ? undefined : selectedBarangay?.barangay_name}
    userLatitude={userLat}
    userLongitude={userLng}
  />
)}

        {/* ── Disclaimer ── */}
        <Text className="text-[11px] text-slate-400 text-center leading-4 px-4 mt-2">
          {t('emergency.disclaimer')}
        </Text>

      </ScrollView>

      {/* ── Barangay picker modal ── */}
      <Modal
        visible={isBarangayPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBarangayPickerOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsBarangayPickerOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl pt-4 pb-6 px-4"
            style={{ maxHeight: '70%' }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-[16px] font-bold text-slate-800">
                {t('emergency.evacuation.selectBarangay', { defaultValue: 'Select Barangay' })}
              </Text>
              <TouchableOpacity
                onPress={() => setIsBarangayPickerOpen(false)}
                hitSlop={12}
                className="p-1"
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={barangays}
              keyExtractor={(item) => String(item.id)}
              onEndReachedThreshold={0.4}
              onEndReached={handleBarangayListEndReached}
              ListHeaderComponent={
                <TouchableOpacity
                  className="flex-row items-center px-3 py-3 rounded-xl mb-1"
                  style={{
                    backgroundColor: selectedBarangayId === null ? '#ECFDF5' : 'transparent',
                  }}
                  onPress={() => handleSelectBarangay(null)}
                  activeOpacity={0.75}
                >
                  <Text
                    className="text-[14px] font-semibold"
                    style={{ color: selectedBarangayId === null ? '#059669' : '#1E293B' }}
                  >
                    {t('emergency.evacuation.nearbyDefault', { defaultValue: 'Nearby (Default)' })}
                  </Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center px-3 py-3 rounded-xl mb-1"
                  style={{
                    backgroundColor: selectedBarangayId === item.id ? '#ECFDF5' : 'transparent',
                  }}
                  onPress={() => handleSelectBarangay(item.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    className="text-[14px] font-semibold"
                    style={{ color: selectedBarangayId === item.id ? '#059669' : '#1E293B' }}
                  >
                    {item.barangay_name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                isPending ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="small" color="#059669" />
                  </View>
                ) : (
                  <Text className="text-[13px] text-slate-400 text-center py-8">
                    {t('emergency.evacuation.noBarangays', { defaultValue: 'No barangays found.' })}
                  </Text>
                )
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" color="#059669" />
                  </View>
                ) : null
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

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