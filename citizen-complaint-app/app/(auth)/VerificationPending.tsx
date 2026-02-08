import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  Clock,
  Mail,
  Shield,
  FileCheck,
  ArrowRight,
} from 'lucide-react-native';

interface VerificationPendingScreenProps {
  navigation?: any;
  route?: {
    params?: {
      email?: string;
    };
  };
}

export default function VerificationPendingScreen({
  navigation,
  route,
}: VerificationPendingScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const email = route?.params?.email || '';

  const handleGoToLogin = () => {
      router.push('/(auth)');
    
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 px-6 py-8">
          {/* Success Icon */}
          <View className="items-center mb-8 mt-12">
            <View className="relative">
              {/* Outer Circle */}
              <View className="bg-success-100 rounded-full p-6 mb-4">
                <View className="bg-success-500 rounded-full p-6">
                  <CheckCircle size={64} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
              {/* Small Clock Badge */}
              <View className="absolute -bottom-2 -right-2 bg-warning-500 rounded-full p-2 border-4 border-neutral-50">
                <Clock size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Main Message */}
          <View className="mb-8">
            <Text className="text-neutral-900 text-3xl font-bold text-center mb-3">
              {t('registrationSubmitted')}
            </Text>
            <Text className="text-neutral-600 text-base text-center leading-6 mb-2">
              {t('accountUnderReview')}
            </Text>
            <Text className="text-neutral-600 text-base text-center leading-6">
              {t('verificationEmailNotice')}
            </Text>
          </View>

          {/* Official Government Notice Box */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border-2 border-primary-200 mb-8">
            <View className="flex-row items-center mb-4 pb-4 border-b border-neutral-200">
              <View className="bg-primary-600 rounded-full p-2 mr-3">
                <Shield size={20} color="#FFFFFF" />
              </View>
              <Text className="text-neutral-900 text-lg font-bold flex-1">
                {t('officialNotice')}
              </Text>
            </View>

            {/* Status Items */}
            <View className="space-y-4">
              {/* Application Received */}
              <View className="flex-row items-start mb-4">
                <View className="bg-success-100 rounded-full p-2 mr-3">
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-900 text-sm font-semibold mb-1">
                    {t('applicationReceived')}
                  </Text>
                  <Text className="text-neutral-600 text-sm leading-5">
                    {t('applicationReceivedDesc')}
                  </Text>
                </View>
              </View>

              {/* Under Review */}
              <View className="flex-row items-start mb-4">
                <View className="bg-warning-100 rounded-full p-2 mr-3">
                  <Clock size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-900 text-sm font-semibold mb-1">
                    {t('documentVerification')}
                  </Text>
                  <Text className="text-neutral-600 text-sm leading-5">
                    {t('documentVerificationDesc')}
                  </Text>
                </View>
              </View>

              {/* Email Notification */}
              <View className="flex-row items-start">
                <View className="bg-primary-100 rounded-full p-2 mr-3">
                  <Mail size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-900 text-sm font-semibold mb-1">
                    {t('emailNotification')}
                  </Text>
                  <Text className="text-neutral-600 text-sm leading-5">
                    {t('emailNotificationDesc')}
                  </Text>
                  {email && (
                    <Text className="text-primary-600 text-sm font-medium mt-1">
                      {email}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Timeline Information */}
          <View className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
            <View className="flex-row items-start">
              <FileCheck size={20} color="#2563EB" className="mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-primary-900 text-sm font-semibold mb-1">
                  {t('verificationTimeline')}
                </Text>
                <Text className="text-primary-800 text-sm leading-5">
                  {t('verificationTimelineDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* What's Next Section */}
          <View className="bg-neutral-100 rounded-xl p-5 mb-8">
            <Text className="text-neutral-900 text-base font-bold mb-3">
              {t('whatsNext')}
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-start mb-2">
                <View className="bg-primary-600 rounded-full w-1.5 h-1.5 mr-3 mt-2" />
                <Text className="text-neutral-700 text-sm leading-5 flex-1">
                  {t('whatsNext1')}
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <View className="bg-primary-600 rounded-full w-1.5 h-1.5 mr-3 mt-2" />
                <Text className="text-neutral-700 text-sm leading-5 flex-1">
                  {t('whatsNext2')}
                </Text>
              </View>
              <View className="flex-row items-start">
                <View className="bg-primary-600 rounded-full w-1.5 h-1.5 mr-3 mt-2" />
                <Text className="text-neutral-700 text-sm leading-5 flex-1">
                  {t('whatsNext3')}
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer to push button to bottom */}
          <View className="flex-1" />

          {/* Back to Login Button */}
          <TouchableOpacity
            onPress={handleGoToLogin}
            className="bg-primary-600 rounded-xl py-4 items-center shadow-sm flex-row justify-center"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold mr-2">
              {t('backToLogin')}
            </Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Help Text */}
          <Text className="text-neutral-500 text-sm text-center mt-6 leading-5">
            {t('verificationHelpText')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}