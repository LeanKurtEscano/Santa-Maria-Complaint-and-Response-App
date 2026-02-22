import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { barangayApiClient } from '@/lib/client/barangay';
import { handleApiError } from '@/utils/general/errorHandler';
import { ErrorScreen } from '@/screen/general/ErrorScreen';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ChevronRight, FileText } from 'lucide-react-native';
import { useState } from 'react';
import { Barangay } from '@/types/general/barangay';

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    data,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['barangays'],
    queryFn: async () => {
      const response = await barangayApiClient.get('/all');
      return response.data as Barangay[];
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBarangayPress = (barangay: Barangay) => {
    router.push({
      pathname: '/barangay/[id]',
      params: {
        id: barangay.id.toString(),
        barangayName: barangay.barangay_name,
      }
    });
  };

  const handleViewMyComplaints = () => {
    // Navigate to user's complaints list
     router.push('/complaints/UserComplaints');
   
  };

  if (error) {
    const errorObj = new Error('Failed to load barangays');
    const appError = handleApiError(errorObj);

    return (
      <ErrorScreen
        type={appError.type}
        title="Unable to Retrieve Barangays"
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          File a Complaint
        </Text>
        <Text className="text-sm text-gray-600">
          Select a barangay to submit your complaint
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
            View My Complaints
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barangay List */}
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading barangays...</Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="px-4 pt-4 pb-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Available Barangays
            </Text>
          </View>
          <FlatList
            data={data}
            renderItem={renderBarangayItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
                title="Pull to refresh"
                titleColor="#6B7280"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-center">
                  No barangays available
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}