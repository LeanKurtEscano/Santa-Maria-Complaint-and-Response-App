import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { useCurrentUser } from '@/store/useCurrentUserStore';

export default function TabsLayout() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { fetchCurrentUser, isAuthenticated, userData } = useCurrentUser();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isConnected;
      const isNowOnline = state.isConnected;
      setIsConnected(state.isConnected);
      if (wasOffline && isNowOnline) {
        queryClient.refetchQueries();
      }
    });
    return () => unsubscribe();
  }, [isConnected, queryClient]);

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 58 + bottomInset;

  // Shared label renderer — shrinks to fit instead of wrapping or clipping
  const renderLabel = (label: string, focused: boolean, activeColor?: string) => (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.85}
      maxFontSizeMultiplier={1.2}
      style={{
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: focused ? (activeColor ?? THEME.primary) : '#9CA3AF',
        marginBottom: Platform.OS === 'android' ? 4 : 0,
        textAlign: 'center',
        includeFontPadding: false,
      }}
    >
      {label}
    </Text>
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenListeners={{
          tabPress: async () => {
            if (!isAuthenticated || !userData) return;
            await fetchCurrentUser(true);
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: THEME.primary,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarItemStyle: {
            paddingHorizontal: 2,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: isConnected === false ? 0 : 1,
            borderTopColor: '#E5E7EB',
            height: tabBarHeight,
            paddingBottom: bottomInset,
            paddingTop: isConnected === false ? 36 : 8,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: Platform.OS === 'android' ? 4 : 0,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === 'android' ? 4 : 0,
          },
          tabBarBackground: () =>
            isConnected === false ? (
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: '#EF4444',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.3}
                    style={{
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: '600',
                      letterSpacing: 0.2,
                    }}
                  >
                    ⚠️ Please fix your internet connection
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
              </View>
            ) : (
              <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarLabel: ({ focused }) => renderLabel("Home", focused),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Complaints"
          options={{
            title: "Complaints",
            tabBarLabel: ({ focused }) => renderLabel("Complaints", focused),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "document-text" : "document-text-outline"} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Notifications"
          options={{
            title: "Notif",
            tabBarLabel: ({ focused }) => renderLabel("Notif", focused),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Emergency"
          options={{
            title: "Emergency",
            tabBarActiveTintColor: '#EF4444',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "warning" : "warning-outline"}
                size={24}
                color={focused ? '#EF4444' : color}
              />
            ),
            tabBarLabel: ({ focused }) => renderLabel("Emergency", focused, '#EF4444'),
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarLabel: ({ focused }) => renderLabel("Profile", focused),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}