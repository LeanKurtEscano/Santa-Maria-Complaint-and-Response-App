import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isConnected;
      const isNowOnline = state.isConnected;
      
      setIsConnected(state.isConnected);
      
      // Auto-refetch when reconnected
      if (wasOffline && isNowOnline) {
        queryClient.refetchQueries();
      }
    });

    return () => unsubscribe();
  }, [isConnected, queryClient]);

  return (
    <View className="flex-1">
      {isConnected === false && (
        <View className="bg-amber-500 py-3 px-4">
          <Text className="text-white text-center font-semibold">
            ⚠️ Please check your internet connection
          </Text>
        </View>
      )}
      
      <Tabs 
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#3B82F6', // Blue color for active tab
          tabBarInactiveTintColor: '#9CA3AF', // Gray color for inactive tabs
          tabBarStyle: {
            backgroundColor: '#FFFFFF', // White background
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: Platform.OS === 'ios' ? 88 : 65, // Adjust for iOS safe area
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            paddingTop: 8,
            elevation: 8, // Shadow for Android
            shadowColor: '#000', // Shadow for iOS
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
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={24} 
                color={color} 
              />
            )
          }}
        />
        
        <Tabs.Screen 
          name="Complaints"
          options={{
            title: "Complaints",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "document-text" : "document-text-outline"} 
                size={24} 
                color={color} 
              />
            )
          }}
        />
        
        <Tabs.Screen 
          name="Notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "notifications" : "notifications-outline"} 
                size={24} 
                color={color} 
              />
            )
          }}
        />
        
        <Tabs.Screen 
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={24} 
                color={color} 
              />
            )
          }}
        />
      </Tabs>
    </View>
  );
}