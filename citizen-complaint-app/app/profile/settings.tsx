import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSettingsLogic } from '@/hooks/general/useSetting';
import {
  ChevronLeft,
  Globe,
  Bell,
  Check,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    currentLanguage,
    changeLanguage,
    pushNotifications,
    emailNotifications,
    complaintUpdates,
    newsAlerts,
    togglePushNotifications,
    toggleEmailNotifications,
    toggleComplaintUpdates,
    toggleNewsAlerts,
  } = useSettingsLogic();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="bg-primary-600 px-4 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">{t('settings.title')}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section Header */}
        <View className="px-6 mt-6 mb-3">
          <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
            {t('settings.preferences')}
          </Text>
        </View>

        {/* Localization Section */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            {/* Section Header */}
            <View className="px-5 py-4 border-b border-neutral-100">
              <View className="flex-row items-center">
                <View className="bg-primary-100 rounded-full p-2 mr-3">
                  <Globe size={20} color="#2563EB" />
                </View>
                <Text className="text-base font-semibold text-neutral-900">
                  {t('settings.localization.title')}
                </Text>
              </View>
            </View>

            {/* Language Options */}
            <View className="px-5 py-2">
              <Text className="text-xs font-medium text-neutral-500 mb-3 mt-2">
                {t('settings.localization.language')}
              </Text>

              {/* English Option */}
              <TouchableOpacity
                onPress={() => changeLanguage('en')}
                className="flex-row items-center justify-between py-3 border-b border-neutral-100"
                activeOpacity={0.7}
              >
                <Text className="text-base text-neutral-900">
                  {t('settings.localization.english')}
                </Text>
                {currentLanguage === 'en' && (
                  <View className="bg-primary-100 rounded-full p-1">
                    <Check size={16} color="#2563EB" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Tagalog Option */}
              <TouchableOpacity
                onPress={() => changeLanguage('tl')}
                className="flex-row items-center justify-between py-3 mb-2"
                activeOpacity={0.7}
              >
                <Text className="text-base text-neutral-900">
                  {t('settings.localization.tagalog')}
                </Text>
                {currentLanguage === 'tl' && (
                  <View className="bg-primary-100 rounded-full p-1">
                    <Check size={16} color="#2563EB" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-6">
          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            {/* Section Header */}
            <View className="px-5 py-4 border-b border-neutral-100">
              <View className="flex-row items-center">
                <View className="bg-amber-100 rounded-full p-2 mr-3">
                  <Bell size={20} color="#F59E0B" />
                </View>
                <Text className="text-base font-semibold text-neutral-900">
                  {t('settings.notifications.title')}
                </Text>
              </View>
            </View>

            {/* Notification Options */}
            <View className="px-5 py-2">
              {/* Push Notifications */}
              <View className="flex-row items-center justify-between py-4 border-b border-neutral-100">
                <View className="flex-1 mr-4">
                  <Text className="text-base text-neutral-900 font-medium">
                    {t('settings.notifications.pushNotifications')}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">
                    Receive notifications on your device
                  </Text>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={togglePushNotifications}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={pushNotifications ? '#2563EB' : '#F3F4F6'}
                />
              </View>

              {/* Email Notifications */}
              <View className="flex-row items-center justify-between py-4 border-b border-neutral-100">
                <View className="flex-1 mr-4">
                  <Text className="text-base text-neutral-900 font-medium">
                    {t('settings.notifications.emailNotifications')}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">
                    Get updates via email
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={toggleEmailNotifications}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={emailNotifications ? '#2563EB' : '#F3F4F6'}
                />
              </View>

              {/* Complaint Updates */}
              <View className="flex-row items-center justify-between py-4 border-b border-neutral-100">
                <View className="flex-1 mr-4">
                  <Text className="text-base text-neutral-900 font-medium">
                    {t('settings.notifications.complaintUpdates')}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">
                    Status changes on your complaints
                  </Text>
                </View>
                <Switch
                  value={complaintUpdates}
                  onValueChange={toggleComplaintUpdates}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={complaintUpdates ? '#2563EB' : '#F3F4F6'}
                />
              </View>

              {/* News & Alerts */}
              <View className="flex-row items-center justify-between py-4 mb-2">
                <View className="flex-1 mr-4">
                  <Text className="text-base text-neutral-900 font-medium">
                    {t('settings.notifications.newsAlerts')}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">
                    Community news and announcements
                  </Text>
                </View>
                <Switch
                  value={newsAlerts}
                  onValueChange={toggleNewsAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={newsAlerts ? '#2563EB' : '#F3F4F6'}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Info Text */}
        <View className="px-6 mt-6">
          <Text className="text-xs text-neutral-500 text-center">
            More settings options coming soon
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}