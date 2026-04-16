import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { userApiClient } from '@/lib/client/user';
import { useCurrentUser } from '@/store/useCurrentUserStore';

export const useSettingsLogic = () => {
  const { i18n } = useTranslation();
  const { userData, setPushNotificationsEnabled } = useCurrentUser();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  // Derive push state from store so it stays in sync
  const pushNotifications = userData?.push_notifications_enabled ?? false;


  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('userLanguage', language);
      setCurrentLanguage(language);
    } catch (error) {}
  };

const togglePushNotifications = useCallback(async () => {
    if (pushNotifications) {
      // Currently ON → ask before turning off
      Alert.alert(
        'Turn Off Notifications',
        'You will no longer receive updates about your complaints.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Turn Off',
            style: 'destructive',
            onPress: async () => {
              try {
                await userApiClient.post('/enable-push-notifications', { enabled: false });
                setPushNotificationsEnabled?.(false);
              } catch {
                Alert.alert('Error', 'Failed to disable notifications. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      // Currently OFF → ask before turning on
      Alert.alert(
        'Enable Notifications',
        'Would you like to receive updates about the status of your complaints?',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                if (!Device.isDevice) return;

                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                  const { status } = await Notifications.requestPermissionsAsync();
                  finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                  Alert.alert(
                    'Permission Denied',
                    'Please enable notifications in your device settings.'
                  );
                  return;
                }

                if (Platform.OS === 'android') {
                  await Notifications.setNotificationChannelAsync('default', {
                    name: 'Complaint Updates',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    sound: 'default',
                  });
                }

                const { data: token } = await Notifications.getExpoPushTokenAsync();
                await userApiClient.post('/push-token', { token });
                await userApiClient.post('/enable-push-notifications', { enabled: true });
                setPushNotificationsEnabled?.(true);
              } catch {
                Alert.alert('Error', 'Failed to enable notifications. Please try again.');
              }
            },
          },
        ]
      );
    }
  }, [pushNotifications, setPushNotificationsEnabled]);

  return {
    currentLanguage,
    changeLanguage,
    pushNotifications,
    togglePushNotifications,
  };
};