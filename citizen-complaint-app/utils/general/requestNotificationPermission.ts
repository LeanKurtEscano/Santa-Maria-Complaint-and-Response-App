// utils/requestNotificationPermission.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

export interface NotificationPermissionResult {
  granted: boolean;
  token: string | null;
  error: string | null;
}

const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId;

/**
 * Call this after a successful complaint submission (201 response).
 * Shows a user-friendly Alert explaining WHY we need permission before
 * triggering the OS prompt. Returns the Expo push token if granted.
 *
 * @example
 * const result = await requestNotificationPermissionForComplaints();
 * if (result.granted && result.token) {
 *   await saveTokenToBackend(userId, result.token);
 * }
 */
export async function requestNotificationPermissionForComplaints(): Promise<NotificationPermissionResult> {
  // Push notifications only work on real devices
  if (!Device.isDevice) {
    return {
      granted: false,
      token: null,
      error: 'Push notifications are only supported on physical devices.',
    };
  }

  // Check current permission status first — no need to re-prompt if already granted
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID }); // ← fix 1
    return { granted: true, token: tokenData.data, error: null };
  }

  // If previously denied, the OS won't show the prompt again — direct user to Settings
  if (existingStatus === 'denied') {
    return new Promise((resolve) => {
      Alert.alert(
        'Notifications Blocked',
        'You previously denied notification access. To receive complaint status updates, please enable notifications for this app in your device Settings.',
        [
          {
            text: 'Maybe Later',
            style: 'cancel',
            onPress: () =>
              resolve({
                granted: false,
                token: null,
                error: 'Notifications are blocked. User must enable them manually in Settings.',
              }),
          },
          {
            text: 'Open Settings',
            onPress: () => {
              // Expo doesn't have a direct openSettings, use Linking if needed
              // Linking.openSettings(); // uncomment if you import Linking
              resolve({
                granted: false,
                token: null,
                error: 'Redirected user to Settings to enable notifications manually.',
              });
            },
          },
        ]
      );
    });
  }

  // Status is 'undetermined' — show our custom explanation Alert first, THEN the OS prompt
  return new Promise((resolve) => {
    Alert.alert(
      '🔔 Stay Updated on Your Complaint',
      'Your complaint was submitted successfully! Would you like to receive notifications about its status and updates?',
      [
        {
          text: 'No Thanks',
          style: 'cancel',
          onPress: () =>
            resolve({
              granted: false,
              token: null,
              error: 'User declined notification permission prompt.',
            }),
        },
        {
          text: 'Allow Notifications',
          onPress: async () => {
            try {
              const { status } = await Notifications.requestPermissionsAsync();

              if (status !== 'granted') {
                resolve({
                  granted: false,
                  token: null,
                  error: 'User dismissed or denied the OS notification permission prompt.',
                });
                return;
              }

              // Set up Android notification channel
              if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                  name: 'Complaint Updates',
                  importance: Notifications.AndroidImportance.MAX,
                  vibrationPattern: [0, 250, 250, 250],
                  lightColor: '#FF231F7C',
                  sound: 'default',
                });
              }

              const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID }); // ← fix 2
              resolve({ granted: true, token: tokenData.data, error: null });

            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : 'An unexpected error occurred while requesting notification permission.';
              resolve({ granted: false, token: null, error: message });
            }
          },
        },
      ]
    );
  });
}