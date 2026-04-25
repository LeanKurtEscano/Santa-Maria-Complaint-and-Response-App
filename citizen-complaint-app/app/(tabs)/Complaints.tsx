import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput, Keyboard, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { barangayApiClient } from '@/lib/client/barangay';
import { handleApiError } from '@/utils/general/errorHandler';
import { ErrorScreen } from '@/screen/general/ErrorScreen';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ChevronRight, FileText, Search, X } from 'lucide-react-native';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Barangay } from '@/types/general/barangay';
import { getBarangayCoords, DEFAULT_COORDS } from '@/constants/general/barangay';
import { THEME } from '@/constants/theme';
import GeneralToast from '@/components/Toast/GeneralToast';
import useToastStore from '@/store/useGlobalModal';

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const { setToastVisible, toastVisible, toastMessage, toastType, showToast } = useToastStore();

  // Bouncing arrow animation — loops while button is visible
  useEffect(() => {
    if (!showScrollTop) {
      bounceAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showScrollTop]);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['barangays'],
    queryFn: async () => {
      const response = await barangayApiClient.get('/all');
      return response.data as Barangay[];
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? data.filter(
          (barangay) =>
            barangay.barangay_name.toLowerCase().includes(query) ||
            barangay.barangay_address?.toLowerCase().includes(query) ||
            barangay.barangay_contact_number?.toLowerCase().includes(query)
        )
      : data;
    return [...filtered].sort((a, b) => a.barangay_name.localeCompare(b.barangay_name));
  }, [data, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleBarangayPress = (barangay: Barangay) => {
    const fallback = getBarangayCoords(barangay.barangay_name) ?? DEFAULT_COORDS;
    const lat = barangay.latitude ?? fallback.lat;
    const lng = barangay.longitude ?? fallback.lng;
    router.push({
      pathname: '/barangay/[id]',
      params: {
        id: barangay.id.toString(),
        barangayName: barangay.barangay_name,
        barangayAccountId: barangay.barangay_account.id.toString(),
        barangayLat: lat.toString(),
        barangayLng: lng.toString(),
      },
    });
  };

  if (error) {
    const appError = handleApiError(new Error(t('complaintsScreen.errors.loadFailed')));
    return (
      <ErrorScreen
        type={appError.type}
        title={t('complaintsScreen.errors.screenTitle')}
        onRetry={refetch}
      />
    );
  }

  const renderBarangayItem = ({ item }: { item: Barangay }) => (
    <TouchableOpacity
      onPress={() => handleBarangayPress(item)}
      className="bg-white mx-4 mb-3 p-4 rounded-xl border border-gray-300 active:scale-[0.98]"
      style={{
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">{item.barangay_name}</Text>
          <Text className="text-sm text-gray-500 mb-1">{item.barangay_address}</Text>
          <Text style={{ fontSize: 12, color: THEME.primary }}>{item.barangay_contact_number}</Text>
        </View>
        <View style={{ backgroundColor: THEME.primaryMuted, padding: 8, borderRadius: 99 }}>
          <ChevronRight size={24} color={THEME.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const isSearchActive = searchQuery.trim().length > 0;
  const resultCount = filteredData.length;
  const totalCount = data?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-2">{t('complaintsScreen.header.title')}</Text>
        <Text className="text-sm text-gray-600">{t('complaintsScreen.header.subtitle')}</Text>
      </View>

      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.push('/complaints/UserComplaints')}
          className="py-4 rounded-xl flex-row items-center justify-center"
          style={{
            backgroundColor: THEME.primary,
            shadowColor: THEME.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <FileText size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-semibold text-base">{t('complaintsScreen.buttons.viewMyComplaints')}</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-3 pb-2">
        <View
          className="flex-row items-center bg-white rounded-2xl px-4"
          style={{
            borderColor: isSearchFocused ? THEME.primary : '#D1D5DB',
            borderWidth: isSearchFocused ? 2 : 1.5,
            shadowColor: isSearchFocused ? THEME.primary : '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isSearchFocused ? 0.18 : 0.07,
            shadowRadius: isSearchFocused ? 10 : 6,
            elevation: isSearchFocused ? 5 : 2,
          }}
        >
          <Search size={22} color={isSearchFocused ? THEME.primary : '#6B7280'} style={{ marginRight: 10 }} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t('complaintsScreen.search.placeholder', { defaultValue: 'Search barangays…' })}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="words"
            style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' }}
          />
          {isSearchFocused && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="ml-2 bg-gray-200 rounded-full p-1.5"
            >
              <X size={14} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text className="text-gray-500 mt-4">{t('complaintsScreen.list.loading')}</Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('complaintsScreen.list.sectionLabel')}
            </Text>
            {isSearchActive ? (
              <Text style={{ fontSize: 12, color: THEME.primary, fontWeight: '500' }}>
                {resultCount} of {totalCount} results
              </Text>
            ) : (
              <Text className="text-xs text-gray-400 font-medium">{totalCount} barangays</Text>
            )}
          </View>

          <FlatList
            ref={flatListRef}
            data={filteredData}
            renderItem={renderBarangayItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[THEME.primary]}
                tintColor={THEME.primary}
                title={t('complaintsScreen.list.pullToRefresh')}
                titleColor="#6B7280"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12 px-8">
                {isSearchActive ? (
                  <>
                    <View className="bg-gray-100 rounded-full p-4 mb-3">
                      <Search size={28} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-700 font-semibold text-base text-center mb-1">
                      No barangays found
                    </Text>
                    <Text className="text-gray-400 text-sm text-center">
                      No results for "{searchQuery}". Try a different name or address.
                    </Text>
                    <TouchableOpacity
                      onPress={handleClearSearch}
                      style={{
                        marginTop: 16,
                        borderWidth: 1,
                        borderColor: THEME.primary,
                        borderRadius: 8,
                        paddingHorizontal: 20,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: THEME.primary, fontSize: 14, fontWeight: '500' }}>
                        Clear search
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text className="text-gray-500 text-center">{t('complaintsScreen.list.empty')}</Text>
                )}
              </View>
            }
          />
        </View>
      )}

      {/* Scroll to top — perfectly centered floating pill with bouncing arrow */}
      {showScrollTop && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={scrollToTop}
            activeOpacity={0.82}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: THEME.primary,
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 99,
              shadowColor: THEME.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 14,
              elevation: 10,
            }}
          >
            {/* Bouncing arrow icon */}
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <ChevronRight
                size={18}
                color="white"
                style={{ transform: [{ rotate: '-90deg' }] }}
              />
            </Animated.View>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 }}>
              Back to top
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <GeneralToast
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        message={toastMessage}
        type={toastType}
      />
    </SafeAreaView>
  );
}