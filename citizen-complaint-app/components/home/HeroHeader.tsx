// components/home/HeroHeader.tsx
// Contains: StickyMiniHeader, ParallaxBlob, HeroHeader, BottomCTA
import {
  View, Text, Animated, TouchableOpacity, Platform, StatusBar as RNStatusBar, ActivityIndicator,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, MapPin, Sparkles, Languages, MessageSquarePlus, RefreshCw } from 'lucide-react-native';
import { StatCard } from './StatCard';
import { STAT_ITEMS } from '@/constants/home/home';
import { useNotificationStore } from '@/store/useNotificationStore';
import { complaintApiClient } from '@/lib/client/complaint';
import { MyStats } from '@/types/general/home';
import { THEME } from '@/constants/theme';

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        borderRadius: 99,
        minWidth: 17,
        height: 17,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: THEME.primary,
        zIndex: 10,
      }}
    >
      <Text style={{ color: 'white', fontSize: 9, fontWeight: '800', lineHeight: 11 }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export function StickyMiniHeader({
  scrollY, title, currentLanguage, onChangeLanguage, onBell,
}: {
  scrollY: Animated.Value;
  title: string;
  currentLanguage: string;
  onChangeLanguage: () => void;
  onBell: () => void;
}) {
  const { unreadCount } = useNotificationStore();
  const insets = useSafeAreaInsets();

  const opacity    = scrollY.interpolate({ inputRange: [120, 180], outputRange: [0, 1], extrapolate: 'clamp' });
  const translateY = scrollY.interpolate({ inputRange: [120, 180], outputRange: [-20, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        opacity, transform: [{ translateY }],
        backgroundColor: THEME.primary,
        paddingTop: insets.top + 10,
        paddingBottom: 14, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: THEME.primaryDark, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
      }}
    >
      <Text style={{ color: 'white', fontSize: 17, fontWeight: '800' }}>{title}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={onChangeLanguage}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: 'rgba(255,255,255,0.13)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
          }}
        >
          <Languages size={13} color="white" />
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
            {currentLanguage === 'en' ? 'EN' : 'TL'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBell}
          activeOpacity={0.8}
          style={{
            position: 'relative',
            backgroundColor: 'rgba(255,255,255,0.13)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 12, padding: 7,
          }}
        >
          <Bell size={18} color="white" />
          <NotifBadge count={unreadCount} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function ParallaxBlob({ scrollY, size, top, right, left, speed = 0.3, opacity = 0.05 }: {
  scrollY: Animated.Value; size: number; top: number; right?: number; left?: number; speed?: number; opacity?: number;
}) {
  const tY = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -300 * speed], extrapolate: 'clamp' });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top, right, left,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: `rgba(255,255,255,${opacity})`,
        transform: [{ translateY: tY }],
      }}
    />
  );
}

function StatsLoading() {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', height: 56 }}>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
        Loading stats…
      </Text>
    </View>
  );
}

function StatsError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 56 }}>
      <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: '600', flex: 1 }}>
        Failed to load stats.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
        }}
      >
        <RefreshCw size={12} color="white" />
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatsContent({ data }: { data: MyStats }) {
  const statItems = [
    { ...STAT_ITEMS[0], tKey: 'Total',    value: data.total_complaints    },
 
    { ...STAT_ITEMS[1], tKey: 'Pending',  value: data.pending_complaints  },
    { ...STAT_ITEMS[2], tKey: 'Resolved', value: data.resolved_complaints },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {statItems.map(s => (
        <StatCard key={s.tKey} label={s.tKey} value={s.value} Icon={s.Icon} dot={s.dot} />
      ))}
    </View>
  );
}

export function HeroHeader({
  data, isLoading, isError, refetch,
  scrollY, cityTitle, municipality, location,
  currentLanguage, onChangeLanguage, onBell,
}: {
  data: MyStats,
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  scrollY: Animated.Value;
  cityTitle: string; municipality: string; location: string;
  currentLanguage: string;
  onChangeLanguage: () => void;
  onBell: () => void;
}) {
  const { unreadCount } = useNotificationStore();
  const insets = useSafeAreaInsets();

  const DIST = 80;
  const paddingBottom = scrollY.interpolate({ inputRange: [0, DIST], outputRange: [56, 28], extrapolate: 'clamp' });
  const titleFontSize = scrollY.interpolate({ inputRange: [0, DIST], outputRange: [30, 22], extrapolate: 'clamp' });
  const subOpacity    = scrollY.interpolate({ inputRange: [0, 60],   outputRange: [1, 0],   extrapolate: 'clamp' });
  const statsOpacity  = scrollY.interpolate({ inputRange: [40, 100], outputRange: [1, 0],   extrapolate: 'clamp' });
  const statsTY       = scrollY.interpolate({ inputRange: [0, 100],  outputRange: [0, -20], extrapolate: 'clamp' });
  const paddingTop    = scrollY.interpolate({
    inputRange: [0, DIST],
    outputRange: [20 + insets.top, 10 + insets.top],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      className="px-5  overflow-hidden"
      style={{ paddingTop, paddingBottom, backgroundColor: THEME.primary }}
    >
      <ParallaxBlob scrollY={scrollY} size={200} top={-50} right={-50} speed={0.25} opacity={0.05} />
      <ParallaxBlob scrollY={scrollY} size={160} top={60}  left={-30}  speed={0.4}  opacity={0.04} />
      <ParallaxBlob scrollY={scrollY} size={80}  top={60}  right={70}  speed={0.15} opacity={0.04} />

      <View className="flex-row items-start justify-between mb-7">
        <View className="flex-1">
          <Animated.View style={{ opacity: subOpacity }} className="flex-row items-center gap-1.5 mb-1">
            <Sparkles size={10} color={THEME.primaryLight} />
            <Text className="text-white text-[11px] font-bold tracking-widest uppercase">{municipality}</Text>
          </Animated.View>
          <Animated.Text className="text-white font-black leading-8" style={{ fontSize: titleFontSize }}>
            {cityTitle}
          </Animated.Text>
          <Animated.View style={{ opacity: subOpacity }} className="flex-row items-center gap-1 mt-1">
            <MapPin size={11} color={THEME.primaryLight} />
            <Text className="text-white text-[12px] font-medium">{location}</Text>
          </Animated.View>
        </View>

        <View className="flex-row items-center gap-2 mt-1">
          <TouchableOpacity
            onPress={onChangeLanguage}
            activeOpacity={0.8}
            className="rounded-2xl px-3 py-2.5 flex-row items-center gap-1.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Languages size={14} color="white" />
            <Text className="text-white text-[12px] font-bold">{currentLanguage === 'en' ? 'EN' : 'TL'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBell}
            activeOpacity={0.8}
            className="rounded-2xl p-3"
            style={{
              position: 'relative',
              backgroundColor: 'rgba(255,255,255,0.13)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Bell size={22} color="white" />
            <NotifBadge count={unreadCount} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={{ opacity: statsOpacity, transform: [{ translateY: statsTY }] }}>
        <Text className="text-white text-[10px] font-bold uppercase tracking-widest mb-3">My Complaint Stats</Text>
        {isLoading && <StatsLoading />}
        {isError   && <StatsError onRetry={refetch} />}
        {data      && <StatsContent data={data} />}
      </Animated.View>
    </Animated.View>
  );
}

export function BottomCTA({ onPress, label }: { onPress: () => void; label: string }) {
  const mountY     = useRef(new Animated.Value(80)).current;
  const mountOp    = useRef(new Animated.Value(0)).current;
  const scalePress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mountY,  { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 120, delay: 700 }),
      Animated.timing(mountOp, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
        backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F1F5F9',
        opacity: mountOp, transform: [{ translateY: mountY }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() =>  Animated.spring(scalePress, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 300 }).start()}
        onPressOut={() => Animated.spring(scalePress, { toValue: 1,    useNativeDriver: true, damping: 8,  stiffness: 200 }).start()}
        activeOpacity={1}
      >
        <Animated.View
          style={{
            transform: [{ scale: scalePress }],
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            paddingVertical: 16, borderRadius: 16,
            backgroundColor: THEME.primary,
            shadowColor: THEME.primaryDark, shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
          }}
        >
          <MessageSquarePlus size={20} color="white" />
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}