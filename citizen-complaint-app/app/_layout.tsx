import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useCurrentUser } from "@/store/useCurrentUserStore";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "../lib/localization/i18n";
import queryClient from "@/lib/api/queryClient";
import ErrorScreen from "@/screen/general/ErrorScreen";
import { handleApiError } from "@/utils/general/errorHandler";

function RootLayoutNav() {
  const { userData, loading, fetchCurrentUser, isAuthenticated } = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();
  const [initError, setInitError] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setInitError(null);
      setRetrying(false);
      await fetchCurrentUser();
    } catch (error) {
      console.error("Failed to initialize app:", error);
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
      isAuthenticated: isAuthenticated,
      currentSegment: segments[0],
      inAuthGroup 
    });
    
    if (!userData && !inAuthGroup) {
      console.log("➡️ Not authenticated, redirecting to auth");
      router.replace("/(auth)");
    } else if (userData && inAuthGroup) {
      console.log("➡️ Authenticated, redirecting to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("✅ Already in correct location");
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
        <ActivityIndicator size="large" color="#3B82F6" />
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