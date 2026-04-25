import { View, Text, Animated } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Eye } from 'lucide-react-native';
import { getGreeting } from '@/utils/home/home';
import { useTranslation } from 'react-i18next';
import { THEME } from '@/constants/theme'
import { useCurrentUser } from '@/store/useCurrentUserStore';

// --- WMO weather code → label + icon + color ---
type WeatherInfo = { label: string; Icon: any; color: string };

function getWeatherInfo(code: number | null): WeatherInfo {
  if (code === null) return { label: 'Fair', Icon: Sun, color: '#FCD34D' };
  if (code === 0)               return { label: 'Clear',      Icon: Sun,              color: '#FCD34D' };
  if (code <= 2)                return { label: 'Partly Cloudy', Icon: Cloud,          color: '#93C5FD' };
  if (code === 3)               return { label: 'Overcast',   Icon: Cloud,             color: '#9CA3AF' };
  if (code <= 49)               return { label: 'Foggy',      Icon: Eye,               color: '#D1D5DB' };
  if (code <= 57)               return { label: 'Drizzle',    Icon: CloudDrizzle,      color: '#60A5FA' };
  if (code <= 67)               return { label: 'Rainy',      Icon: CloudRain,         color: '#3B82F6' };
  if (code <= 77)               return { label: 'Snowy',      Icon: CloudSnow,         color: '#BAE6FD' };
  if (code <= 82)               return { label: 'Showers',    Icon: CloudRain,         color: '#60A5FA' };
  if (code <= 86)               return { label: 'Snow Shower',Icon: CloudSnow,         color: '#BAE6FD' };
  if (code <= 99)               return { label: 'Thunderstorm', Icon: CloudLightning,  color: '#A78BFA' };
  return { label: 'Fair', Icon: Sun, color: '#FCD34D' };
}

function useWeather(latitude: number | null | undefined, longitude: number | null | undefined) {
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const controller = new AbortController();
    const TIMEOUT_MS = 5000; // 5 seconds max wait

    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    (async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,weather_code` +
          `&temperature_unit=celsius`;

        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) return; // non-2xx → fall back to default silently

        const json = await res.json();

        const code = json?.current?.weather_code;
        const temp = json?.current?.temperature_2m;

        // Validate before setting — guard against malformed responses
        if (typeof code === 'number') setWeatherCode(code);
        if (typeof temp === 'number') setTemperature(temp);

      } catch (err: any) {
        // AbortError = timeout or unmount — either way, silently use default
        // NetworkError / parse error — same, silently use default
        // No state update needed since initial state is already the fallback
      }
    })();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [latitude, longitude]);

  return { weatherCode, temperature };
}
// --- Component ---
export function GreetingBanner() {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;
  const { t } = useTranslation();

  const { userData } = useCurrentUser();
  const { weatherCode, temperature } = useWeather(userData?.latitude, userData?.longitude);

  const { label, Icon, color } = getWeatherInfo(weatherCode);

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
        {/* top accent line */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: THEME.primaryLight, opacity: 0.6 }} />

        {/* decorative stripes */}
        {[...Array(5)].map((_, i) => (
          <View key={i} style={{ position: 'absolute', left: i * 70 - 10, top: -20, width: 1, height: '200%', backgroundColor: 'rgba(255,255,255,0.04)', transform: [{ rotate: '20deg' }] }} />
        ))}

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Sun size={13} color="#FCD34D" />
              <Text style={{ color: '#FCD34D', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{dateStr.toUpperCase()}</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 }}>
              {t(greetingKey)}, {t('home.resident')}!
            </Text>
            <Text style={{ color: THEME.primaryLight, fontSize: 10, fontWeight: '500', marginTop: 3 }}>
              {t('home.stay_updated')}
            </Text>
          </View>

          {/* Weather badge */}
          <View
            className="rounded-2xl p-3 ml-3 items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', minWidth: 60 }}
          >
            <Icon size={28} color={color} />
            <Text style={{ color, fontSize: 10, fontWeight: '700', marginTop: 3 }}>{label}</Text>
            {temperature !== null && (
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600', marginTop: 1 }}>
                {Math.round(temperature)}°C
              </Text>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}