import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useCurrentUser } from "@/store/useCurrentUserStore";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import queryClient from "@/lib/api/queryClient";

function RootLayoutNav() {
  const { userData, loading, fetchCurrentUser } = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();
 

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    
    console.log("🔍 Auth Check:", { 
      isAuthenticated: !!userData,
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
  }, [userData, loading, segments]);

  
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ec4899" />
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