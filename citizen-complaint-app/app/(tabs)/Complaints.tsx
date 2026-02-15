import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { barangayApiClient } from '@/lib/client/barangay';
import { handleApiError } from '@/utils/general/errorHandler';
import { ErrorScreen } from '@/screen/general/ErrorScreen';
import { useTranslation } from 'react-i18next';

export default function ComplaintsScreen() {
  const { t } = useTranslation();
   const {
    data,
    isPending,  
   
    error,
     refetch,
  } = useQuery({
    queryKey: ['barangays'],
    queryFn: async () => {
      const response = await barangayApiClient.get('/all');
      return response.data;
    }
  });

  if (error) {
      const error = new Error('Failed to load profile');
      const appError = handleApiError(error);
  
      return (
        <ErrorScreen
          type={appError.type}
          title={"Unable to Retrieve Barangays"}
          onRetry={refetch}
        />
      );
    }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Complaints
        </Text>
        <Text className="text-gray-600 text-center">
          Your complaints screen content goes here
        </Text>
      </View>
    </SafeAreaView>
  );
}