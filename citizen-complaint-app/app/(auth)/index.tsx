import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
         router.replace('/(tabs)');
          //router.replace('/(auth)/Login');
        } else {
          router.replace('/(auth)/OnBoarding');
        }
      } catch (_) {
        router.replace('/(tabs)');
        //  router.replace('/(auth)/Login');
      }
    };
    redirect();
  }, []);

  return null;
}