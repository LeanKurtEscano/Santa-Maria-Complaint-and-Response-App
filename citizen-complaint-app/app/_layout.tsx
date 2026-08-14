import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { useCurrentUser } from "@/store/useCurrentUserStore";
import { useSSEStore } from "@/store/useSSEStore";
import { QueryClientProvider } from '@tanstack/react-query';
import "../lib/localization/i18n";
import queryClient from "@/lib/api/queryClient";
import ErrorScreen from "@/screen/general/ErrorScreen";
import { handleApiError } from "@/utils/general/errorHandler";
import * as Notifications from "expo-notifications"; // 👈 add import
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClerkProvider } from "@clerk/expo";
import * as SecureStore from 'expo-secure-store';

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
  const { userData, loading, checkAuthStatus, isAuthenticated } = useCurrentUser();
  const connectSSE = useSSEStore((s) => s.connect);
  const disconnectSSE = useSSEStore((s) => s.disconnect);
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
    {/*   async function clearTokens() {
      await SecureStore.deleteItemAsync('complaint_token');
      await SecureStore.deleteItemAsync('complaint_refresh_token');
    }
    clearTokens(); */}
  }, []);

  // ✅ 🔥 FIX 1: LISTEN FOR NOTIFICATIONS
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
      console.log("📩 Notification received:", notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👉 Notification clicked:", response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const { userData, isAuthenticated } = useCurrentUser.getState();
        if (!isAuthenticated || !userData) return; // 👈 guard
        console.log("🔄 App active → syncing push token");
        useCurrentUser.getState().syncPushToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ✅ 🔥 FIX 2: GLOBAL SSE CONNECTION — connect once auth is known, for the
  // whole app lifetime, instead of only while the Notifications screen is
  // mounted. Disconnects cleanly on logout so we don't leak a stream tied
  // to a stale token/user.
  useEffect(() => {
    if (isAuthenticated && userData) {
      console.log("🔌 Auth ready → connecting SSE");
      connectSSE();
    } else {
      disconnectSSE();
    }
  }, [isAuthenticated, userData?.id]);

  // Reconnect SSE whenever the app returns to foreground — mobile OSes
  // suspend the underlying socket while backgrounded, so onerror alone
  // won't fire to trigger a reconnect on its own.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const { userData, isAuthenticated } = useCurrentUser.getState();
        if (!isAuthenticated || !userData) return;

        const status = useSSEStore.getState().status;
        if (status !== "connected") {
          console.log(`🔄 App active → reconnecting SSE (status was ${status})`);
          connectSSE();
        }
      }
    });

    return () => {
      subscription.remove();
    };
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
      userData: userData,
    });

    if (userData && userData.is_suspended) {
      if (segments[1] !== "AccountSuspended") {
        router.replace("/(auth)/AccountSuspended");
      }
      return;
    }

    // ✅ Authenticated but NOT verified
    if (userData && !userData.is_verified) {
      // Any account with a linked clerk_user_id (i.e. has used Google login,
      // whether that was their original signup method or linked later) is
      // allowed inside the app while unverified. Verification-gated actions
      // like filing complaints are enforced separately inside the app
      // (VerifyGuard / pending-review banners), so this redirect only needs
      // to handle users who have never touched Google login at all.
      const isGoogleLinked = !!userData.clerk_user_id;

      if (!isGoogleLinked) {
        if (segments[1] !== "NotVerified") {
          router.replace("/(auth)/NotVerified");
        }
        return;
      }
      // else: Google-linked account, unverified — let them into the app
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
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </ClerkProvider>
  );
}