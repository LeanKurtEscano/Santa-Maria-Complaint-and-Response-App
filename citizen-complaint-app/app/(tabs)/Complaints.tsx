import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { barangayApiClient } from '@/lib/client/barangay';
import { handleApiError } from '@/utils/general/errorHandler';
import { ErrorScreen } from '@/screen/general/ErrorScreen';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ChevronRight, FileText, Search, X } from 'lucide-react-native';
import { useState, useMemo, useCallback, useRef } from 'react';
import { Barangay } from '@/types/general/barangay';
import { getBarangayCoords, DEFAULT_COORDS } from '@/constants/general/barangay';

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

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
    return [...filtered].sort((a, b) =>
      a.barangay_name.localeCompare(b.barangay_name)
    );
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

  const handleViewMyComplaints = () => {
    router.push('/complaints/UserComplaints');
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
      className="bg-white mx-4 mb-3 p-4 rounded-xl border border-gray-300 shadow-sm active:scale-[0.98]"
      style={{
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {item.barangay_name}
          </Text>
          <Text className="text-sm text-gray-500 mb-1">
            {item.barangay_address}
          </Text>
          <Text className="text-xs text-blue-600">
            {item.barangay_contact_number}
          </Text>
        </View>
        <View className="bg-blue-50 p-2 rounded-full">
          <ChevronRight size={24} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const isSearchActive = searchQuery.trim().length > 0;
  const resultCount = filteredData.length;
  const totalCount = data?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {t('complaintsScreen.header.title')}
        </Text>
        <Text className="text-sm text-gray-600">
          {t('complaintsScreen.header.subtitle')}
        </Text>
      </View>

      {/* View My Complaints Button */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={handleViewMyComplaints}
          className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center active:bg-blue-700"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <FileText size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-semibold text-base">
            {t('complaintsScreen.buttons.viewMyComplaints')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 pt-3 pb-2">
        <View
          className="flex-row items-center bg-white rounded-2xl border px-4"
          style={{
            borderColor: isSearchFocused ? '#3B82F6' : '#D1D5DB',
            borderWidth: isSearchFocused ? 2 : 1.5,
            shadowColor: isSearchFocused ? '#3B82F6' : '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isSearchFocused ? 0.18 : 0.07,
            shadowRadius: isSearchFocused ? 10 : 6,
            elevation: isSearchFocused ? 5 : 2,
          }}
        >
          <Search
            size={22}
            color={isSearchFocused ? '#3B82F6' : '#6B7280'}
            style={{ marginRight: 10 }}
          />
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

      {/* Barangay List */}
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">
            {t('complaintsScreen.list.loading')}
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Section Label + Result Count */}
          <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('complaintsScreen.list.sectionLabel')}
            </Text>
            {isSearchActive ? (
              <Text className="text-xs text-blue-600 font-medium">
                {resultCount} of {totalCount} results
              </Text>
            ) : (
              <Text className="text-xs text-gray-400 font-medium">
                {totalCount} barangays
              </Text>
            )}
          </View>

          <FlatList
            data={filteredData}
            renderItem={renderBarangayItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
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
                      className="mt-4 border border-blue-500 rounded-lg px-5 py-2"
                    >
                      <Text className="text-blue-600 text-sm font-medium">Clear search</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text className="text-gray-500 text-center">
                    {t('complaintsScreen.list.empty')}
                  </Text>
                )}
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}