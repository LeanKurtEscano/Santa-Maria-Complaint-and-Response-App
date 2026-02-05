
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

export default function TabsLayout() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const queryClient = useQueryClient();

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
            Offline Mode - Some features unavailable
          </Text>
        </View>
      )}
      
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen 
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <HomeIcon color={color} />
          }}
        />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}