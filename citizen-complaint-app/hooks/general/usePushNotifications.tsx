import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const askForNotificationPermission = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;

  // ✅ Updated check (no deprecation)
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient';

  if (Platform.OS === 'android' && isExpoGo) {
    console.log('Push notifications skipped on Android in Expo Go');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Complaint Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return token;
};