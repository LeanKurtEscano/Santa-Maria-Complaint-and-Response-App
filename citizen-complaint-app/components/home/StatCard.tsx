// components/home/StatCard.tsx
import { View, Text, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

type Props = { label: string; value: number; Icon: any; dot: string };
import { useTransition } from 'react';
import { useTranslation } from 'react-i18next';
export function StatCard({ label, value, Icon, dot }: Props) {
  const scale   = useRef(new Animated.Value(0.8)).current;
  const {t} = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 100, delay: 300 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ scale }] }}>
      <View
        className="rounded-2xl py-3.5 px-2 items-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.11)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}
      >
        <Icon size={15} color={dot} />
        <Text className="text-white text-2xl font-black mt-1.5">{value}</Text>
        <Text className="text-blue-200 text-[10px] font-semibold text-center mt-0.5 leading-[14px]"> {t(label)}</Text>
      </View>
    </Animated.View>
  );
}