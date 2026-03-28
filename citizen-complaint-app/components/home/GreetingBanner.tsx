import { View, Text, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Sun } from 'lucide-react-native';
import { getGreeting } from '@/utils/home/home';
import { useTranslation } from 'react-i18next';
import { THEME } from '@/constants/theme';

export function GreetingBanner() {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;
  const { t } = useTranslation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, damping: 14, stiffness: 120, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const greetingKey = getGreeting();
  const dateStr = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }} className="mx-5 mb-4">
      <View
        className="rounded-2xl p-4 overflow-hidden"
        style={{
          backgroundColor: THEME.primaryDark,
          borderWidth: 1, borderColor: THEME.primary,
          shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5,
        }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: THEME.primaryLight, opacity: 0.6 }} />

        {[...Array(5)].map((_, i) => (
          <View key={i} style={{ position: 'absolute', left: i * 70 - 10, top: -20, width: 1, height: '200%', backgroundColor: 'rgba(255,255,255,0.04)', transform: [{ rotate: '20deg' }] }} />
        ))}

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Sun size={13} color="#FCD34D" />
              <Text style={{ color: '#FCD34D', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{dateStr.toUpperCase()}</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 }}>{t(greetingKey)}, {t('home.resident')}!</Text>
            <Text style={{ color: THEME.primaryLight, fontSize: 10, fontWeight: '500', marginTop: 3 }}>{t('home.stay_updated')}</Text>
          </View>
          <View className="rounded-2xl p-3 ml-3 items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
            <Sun size={28} color="#FCD34D" />
            <Text style={{ color: '#FCD34D', fontSize: 10, fontWeight: '700', marginTop: 3 }}>Fair</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}