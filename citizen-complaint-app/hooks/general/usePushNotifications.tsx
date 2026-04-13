// types/notifications.ts


import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { userApiClient } from '@/lib/client/user';

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export interface SaveTokenPayload {
  userId: string;
  token: string;
}




Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowBanner: true,   // replaces shouldShowAlert
    shouldShowList: true,     // replaces shouldShowAlert
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


export async function saveTokenToBackend(userId: Number, token: string): Promise<void> {
  const response = await userApiClient.post('/push-token', {
    userId:userId,
    token:token,
  });

  if (!response.status || response.status >= 400) {
    throw new Error(`Failed to save push token: ${response.status}`);
  }
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission not granted.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Complaint Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export function usePushNotifications(userId: string | null): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Register and save token
    registerForPushNotifications()
      .then(async (token) => {
        if (!token) return;
        setExpoPushToken(token);
        await saveTokenToBackend(userId, token);
      })
      .catch((err: Error) => {
        setError(err.message);
        
      });

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif) => {
        setNotification(notif);
      }
    );

    // Tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        console.log('Notification tapped:', data);

        // Example: navigate to complaint screen
        // navigationRef.current?.navigate('ComplaintDetails', {
        //   complaintId: data.complaintId as string,
        // });
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  return { expoPushToken, notification, error };
}