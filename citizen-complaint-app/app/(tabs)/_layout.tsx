import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export default function TabsLayout() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

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

  return (
    <View className="flex-1">
      {isConnected === false && (
        <View style={{ backgroundColor: THEME.primary }} className="py-3 px-4">
          <Text className="text-white text-center font-semibold">
            ⚠️ Please check your internet connection
          </Text>
        </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: THEME.primary,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 58 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 8,
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
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="Complaints"
          options={{
            title: "Complaints",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "document-text" : "document-text-outline"} size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="Notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="Emergency"
          options={{
            title: "Emergency",
            tabBarActiveTintColor: '#EF4444',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "warning" : "warning-outline"} size={24} color={focused ? '#EF4444' : color} />
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: focused ? '#EF4444' : '#9CA3AF',
                marginBottom: Platform.OS === 'android' ? 4 : 0,
              }}>
                Emergency
              </Text>
            ),
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            )
          }}
        />
      </Tabs>
    </View>
  );
}