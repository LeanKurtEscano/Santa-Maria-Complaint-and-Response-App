import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next'; // or your i18n hook

export default function NotVerifiedScreen() {
  const router = useRouter();
  const { logout, fetchCurrentUser } = useCurrentUser();
  const { t } = useTranslation(); // adjust namespace if needed, e.g., useTranslation('common')
  const [refreshing, setRefreshing] = useState(false);

  const handleGoBack = async () => {
    await logout();
    router.replace('/(auth)');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentUser(); // Re-fetch user data to check if verified
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        <View className="flex-1 items-center justify-center px-8 py-12">
          <MailCheck size={64} color="#10B981" />
          <Text className="text-2xl font-bold text-neutral-900 mt-6 mb-3 text-center">
            {t('notVerified.title')}
          </Text>
          <Text className="text-sm text-neutral-500 text-center leading-6 mb-10">
            {t('notVerified.message')}
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            className="bg-primary-600 rounded-xl py-4 px-8 items-center w-full"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-bold">
              {t('notVerified.goBackButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}