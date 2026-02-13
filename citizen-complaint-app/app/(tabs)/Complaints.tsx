import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComplaintsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Complaints
        </Text>
        <Text className="text-gray-600 text-center">
          Your complaints screen content goes here
        </Text>
      </View>
    </SafeAreaView>
  );
}