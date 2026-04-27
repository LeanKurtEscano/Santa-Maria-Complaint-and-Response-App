import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { ShieldX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function SuspendedScreen() {
  const router = useRouter();
  const { logout } = useCurrentUser();
  const { t } = useTranslation();

  const handleGoBack = async () => {
    await logout();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center justify-center px-8 py-12">
          <ShieldX size={64} color="#EF4444" />
          <Text className="text-2xl font-bold text-neutral-900 mt-6 mb-3 text-center">
            {t('suspended.title')}
          </Text>
          <Text className="text-sm text-neutral-500 text-center leading-6 mb-10">
            {t('suspended.description')}
          </Text>
          {/*
          
             <TouchableOpacity
            onPress={() => 
            className="bg-red-500 rounded-xl py-4 px-8 items-center w-full mb-3"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-bold">
              {t('suspended.contactSupport')}
            </Text>
          </TouchableOpacity>
          
          */}
       
          <TouchableOpacity
            onPress={handleGoBack}
            className="rounded-xl py-4 px-8 items-center w-full border border-neutral-200"
            activeOpacity={0.85}
          >
            <Text className="text-neutral-600 text-base font-semibold">
              {t('suspended.goBackButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}