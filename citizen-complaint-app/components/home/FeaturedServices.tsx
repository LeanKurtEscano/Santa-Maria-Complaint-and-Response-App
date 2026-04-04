import { View, Text, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, BadgeCheck, Zap, ChevronRight } from 'lucide-react-native';
import { FEATURED_SERVICES } from '@/constants/home/home';
import { THEME } from '@/constants/theme';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 40 - 32 - 10) / 2;

function NavyCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: THEME.primaryDark,
        borderWidth: 1,
        borderColor: THEME.primary,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
        ...style,
      }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: THEME.primaryLight, opacity: 0.6 }} />
      {[...Array(7)].map((_, i) => (
        <View key={i} style={{ position: 'absolute', left: i * 65 - 10, top: -20, width: 1, height: '200%', backgroundColor: 'rgba(255,255,255,0.04)', transform: [{ rotate: '20deg' }] }} />
      ))}
      {children}
    </View>
  );
}

function GlassBox({ children, size = 38 }: { children: React.ReactNode; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

export function FeaturedServicesGrid() {
  const { t } = useTranslation();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 14,  stiffness: 110, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} className="mx-5 mb-5">
      <NavyCard>
        <View className="p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <GlassBox>
              <ShieldCheck size={18} color="#ffffff" />
            </GlassBox>
            <View>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>
                {t('complaintServices')}
              </Text>
              <Text style={{ color: THEME.primaryLight, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                {t('secureTransparentFast')}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="flex-row px-4 pb-4 gap-2"
          style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)', paddingTop: 12 }}
        >
          {[
            { Icon: BadgeCheck, label: t('badgeVerified'), color: '#ffffff' },
            { Icon: Zap,        label: t('badgeInstant'),  color: '#ffffff' },
          ].map((b, i) => (
            <View key={i} className="flex-row items-center gap-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
              <b.Icon size={10} color={b.color} />
              <Text style={{ color: b.color, fontSize: 10, fontWeight: '700' }}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View className="px-4 pb-4 gap-2.5">
          {[0, 2, 4].map(start => (
            <View key={start} className="flex-row gap-2.5">
              {FEATURED_SERVICES.slice(start, start + 2).map((s, i) => (
                <ServiceCard key={i} service={s} />
              ))}
            </View>
          ))}
        </View>
      </NavyCard>
    </Animated.View>
  );
}

function ServiceCard({ service }: { service: typeof FEATURED_SERVICES[number] }) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_W, flex: 1 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, damping: 15, stiffness: 300 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 8,  stiffness: 200 }).start()}
        style={{
          backgroundColor: 'rgba(255,255,255,0.07)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: 14,
          overflow: 'hidden',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ position: 'absolute', top: -12, left: -12, width: 64, height: 64, borderRadius: 32, backgroundColor: service.glow }} />

        {service.badge && (
          <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: service.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: '#0F172A', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }}>{service.badge}</Text>
          </View>
        )}

        <View>
          <GlassBox size={40}>
            <service.Icon size={19} color="#ffffff" />
          </GlassBox>

          <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', lineHeight: 17, letterSpacing: -0.2, marginTop: 10, marginBottom: 3 }}>
            {t(service.labelKey)}
          </Text>
          <Text style={{ color: THEME.primaryLight, fontSize: 10, fontWeight: '600' }} numberOfLines={2}>
            {t(service.descKey)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <ChevronRight size={11} color="#ffffff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}