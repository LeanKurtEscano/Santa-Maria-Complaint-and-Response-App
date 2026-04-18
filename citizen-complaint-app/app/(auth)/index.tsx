import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App entry point.
 * - First launch  → Onboarding
 * - Returning     → Login (handled inside Onboarding itself via AsyncStorage)
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
          router.replace('/(auth)/Login');
        } else {
          router.replace('/(auth)/OnBoarding');
        }
      } catch (_) {
        router.replace('/(auth)/Login');
      }
    };
    redirect();
  }, []);

  return null;
}