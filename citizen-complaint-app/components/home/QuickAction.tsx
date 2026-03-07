// components/home/QuickAction.tsx
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';

type Props = { Icon: any; label: string; onPress?: () => void; delay?: number; badge?: string };

export function QuickAction({ Icon, label, onPress, delay = 0, badge }: Props) {
  const scalePress   = useRef(new Animated.Value(1)).current;
  const mountScale   = useRef(new Animated.Value(0)).current;
  const mountOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mountScale,   { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 120, delay: 500 + delay }),
      Animated.timing(mountOpacity, { toValue: 1, duration: 300, delay: 500 + delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: mountOpacity, transform: [{ scale: Animated.multiply(mountScale, scalePress) }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(scalePress, { toValue: 0.88, useNativeDriver: true, damping: 15, stiffness: 300 }).start()}
        onPressOut={() => Animated.spring(scalePress, { toValue: 1,    useNativeDriver: true, damping: 8,  stiffness: 200 }).start()}
        activeOpacity={1}
        className="items-center"
      >
        <View className="w-[54px] h-[54px] rounded-2xl mb-2 bg-blue-50 border border-blue-100 items-center justify-center">
          <Icon size={22} color="#2563EB" />
          {badge && (
            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
              <Text className="text-white text-[8px] font-black">{badge}</Text>
            </View>
          )}
        </View>
        <Text className="text-slate-700 text-[11px] font-bold text-center leading-[15px]">{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}