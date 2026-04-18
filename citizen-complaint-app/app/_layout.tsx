import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useCurrentUser } from "@/store/useCurrentUserStore";
import { QueryClientProvider } from '@tanstack/react-query';
import "../lib/localization/i18n";
import queryClient from "@/lib/api/queryClient";
import ErrorScreen from "@/screen/general/ErrorScreen";
import { handleApiError } from "@/utils/general/errorHandler";
import * as Notifications from "expo-notifications"; // 👈 add import
import AsyncStorage from "@react-native-async-storage/async-storage";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,  // 👈 add
    shouldShowList: true,    // 👈 add
  }),
});

function RootLayoutNav() {
  const { userData, loading, checkAuthStatus } = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();
  const [initError, setInitError] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);
  
  useEffect(() => {
    initializeApp();
    
    {/*   async function clearOnboarding() {
      await AsyncStorage.removeItem('hasSeenOnboarding');
    }
    clearOnboarding(); */}
  
  }, []);

  const initializeApp = async () => {
    try {
      setInitError(null);
      setRetrying(false);
      await checkAuthStatus();
    } catch (error) {
    
      setInitError(error);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await initializeApp();
    setRetrying(false);
  };

  useEffect(() => {
  if (loading || retrying) return;

  const inAuthGroup = segments[0] === "(auth)";

  console.log("🔍 Auth Check:", {
    isAuthenticated: !!userData,
    isVerified: userData?.is_verified,
    currentSegment: segments[0],
    inAuthGroup,
  });

  // ❌ Not authenticated
  if (!userData && !inAuthGroup) {
    router.replace("/(auth)/Login");
    return;
  }

  // ✅ Authenticated but NOT verified
  if (userData && !userData.is_verified) {
    if (segments[1] !== "NotVerified") {
      router.replace("/(auth)/NotVerified");
    }
    return;
  }

  // ✅ Authenticated and verified
  if (userData && userData.is_verified && inAuthGroup) {
    router.replace("/(tabs)");
    return;
  }

}, [userData, loading, segments, retrying]);
   
  if (initError && !loading) {
    const appError = handleApiError(initError);

    return (
      <ErrorScreen
        type={appError.type}
        title="Connection Error"
        message={appError.message}
        onRetry={handleRetry}
        retryLoading={retrying}
        retryLabel="Retry Connection"
      />
    );
  }

  if (loading || retrying) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}