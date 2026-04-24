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

  const serverPush = userData?.push_notifications_enabled ?? false;
  // Optimistic state: starts in sync with server, diverges during pending ops
  const [optimisticPush, setOptimisticPush] = useState<boolean>(serverPush);

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('userLanguage', language);
      setCurrentLanguage(language);
    } catch (error) {}
  };

  const togglePushNotifications = useCallback(async () => {
    const next = !optimisticPush;

    if (!next) {
      // Currently ON → confirm before turning off
      Alert.alert(
        'Turn Off Notifications',
        'You will no longer receive updates about your complaints.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Turn Off',
            style: 'destructive',
            onPress: async () => {
              // Optimistically toggle OFF immediately
              setOptimisticPush(false);
              try {
                await userApiClient.post('/enable-push-notifications', { enabled: false });
                setPushNotificationsEnabled?.(false);
              } catch {
                // Revert on failure
                setOptimisticPush(true);
                Alert.alert('Error', 'Failed to disable notifications. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      // Currently OFF → confirm before turning on
      Alert.alert(
        'Enable Notifications',
        'Would you like to receive updates about the status of your complaints?',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              // Optimistically toggle ON immediately
              setOptimisticPush(true);
              try {
                if (!Device.isDevice) {
                  setOptimisticPush(false);
                  return;
                }

                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                  const { status } = await Notifications.requestPermissionsAsync();
                  finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                  // Revert — permission denied
                  setOptimisticPush(false);
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
                // Revert on any API/permission failure
                setOptimisticPush(false);
                Alert.alert('Error', 'Failed to enable notifications. Please try again.');
              }
            },
          },
        ]
      );
    }
  }, [optimisticPush, setPushNotificationsEnabled]);

  return {
    currentLanguage,
    changeLanguage,
    pushNotifications: optimisticPush, // screen consumes optimistic value
    togglePushNotifications,
  };
};