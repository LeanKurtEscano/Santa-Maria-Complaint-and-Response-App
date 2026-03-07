// components/home/FeaturedServicesGrid.tsx
// Design mirrors GreetingBanner exactly:
//   • bg #1E3A8A, border #1D4ED8, shadow #1D4ED8
//   • 3px #60A5FA top accent bar (opacity 0.6)
//   • diagonal line texture (rgba white 0.04, rotate 20deg)
//   • p-4 inner padding, rounded-2xl (16px radius)
//   • white title fontWeight 900, #93C5FD subtitle, #FCD34D accents
//   • glass icon boxes: rgba(255,255,255,0.10) bg + 0.15 border
//   • divider at rgba(255,255,255,0.10) like the greeting status row
import { View, Text, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { ShieldCheck, Lock, BadgeCheck, Zap, MessageCircle, ChevronRight } from 'lucide-react-native';
import { FEATURED_SERVICES } from '@/constants/home/home';

const { width: W } = Dimensions.get('window');
// mx-5 (40) + p-4 inner (32) + gap (10) → each card half the inner width
const CARD_W = (W - 40 - 32 - 10) / 2;

// ── Reusable dark-navy card shell (shared look with GreetingBanner) ───────────
function NavyCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#1E3A8A',
        borderWidth: 1,
        borderColor: '#1D4ED8',
        shadowColor: '#1D4ED8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
        ...style,
      }}
    >
      {/* Same top accent bar as GreetingBanner */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: '#60A5FA', opacity: 0.6 }} />
      {/* Same diagonal lines as GreetingBanner */}
      {[...Array(7)].map((_, i) => (
        <View key={i} style={{ position: 'absolute', left: i * 65 - 10, top: -20, width: 1, height: '200%', backgroundColor: 'rgba(255,255,255,0.04)', transform: [{ rotate: '20deg' }] }} />
      ))}
      {children}
    </View>
  );
}

// ── Glass icon box (same as GreetingBanner weather box) ──────────────────────
function GlassBox({ children, size = 38 }: { children: React.ReactNode; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function FeaturedServicesGrid() {
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
        {/* ── Header — mirrors GreetingBanner top row layout ── */}
        <View className="p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <GlassBox>
              <ShieldCheck size={18} color="#FCD34D" />
            </GlassBox>
            <View>
              {/* Same typography as GreetingBanner title */}
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>
                Complaint Services
              </Text>
              {/* Same sub-label as GreetingBanner "Stay updated..." */}
              <Text style={{ color: '#93C5FD', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                Secure · Transparent · Fast
              </Text>
            </View>
          </View>
          {/* "View All" — same glass pill as GreetingBanner lang button */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: '#93C5FD', fontSize: 11, fontWeight: '800' }}>View All</Text>
            <ChevronRight size={11} color="#93C5FD" />
          </TouchableOpacity>
        </View>

        {/* ── Trust badges row — mirrors GreetingBanner status row ── */}
        <View
          className="flex-row px-4 pb-4 gap-2"
          style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)', paddingTop: 12 }}
        >
          {[
            { Icon: Lock,       label: 'Encrypted', color: '#A78BFA' },
            { Icon: BadgeCheck, label: 'Verified',  color: '#6EE7B7' },
            { Icon: Zap,        label: 'Instant',   color: '#FCD34D' },
          ].map((b, i) => (
            <View key={i} className="flex-row items-center gap-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
              <b.Icon size={10} color={b.color} />
              <Text style={{ color: b.color, fontSize: 10, fontWeight: '700' }}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Service cards grid ── */}
        <View className="px-4 pb-4 gap-2.5">
          {[0, 2, 4].map(start => (
            <View key={start} className="flex-row gap-2.5">
              {FEATURED_SERVICES.slice(start, start + 2).map((s, i) => (
                <ServiceCard key={i} service={s} />
              ))}
            </View>
          ))}
        </View>

        {/* ── Bottom CTA — same divider + glass style ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 mx-4 mb-4 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 12 }}
        >
          <MessageCircle size={14} color="#93C5FD" />
          <Text style={{ color: '#93C5FD', fontSize: 12, fontWeight: '800' }}>Need help? Talk to our support team</Text>
          <ChevronRight size={12} color="#93C5FD" />
        </TouchableOpacity>
      </NavyCard>
    </Animated.View>
  );
}

// ── Individual service card ───────────────────────────────────────────────────
function ServiceCard({ service }: { service: typeof FEATURED_SERVICES[number] }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_W }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, damping: 15, stiffness: 300 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 8,  stiffness: 200 }).start()}
        style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14, overflow: 'hidden' }}
      >
        {/* Soft glow blob */}
        <View style={{ position: 'absolute', top: -12, left: -12, width: 64, height: 64, borderRadius: 32, backgroundColor: service.glow }} />

        {/* Badge */}
        {service.badge && (
          <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: service.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: '#0F172A', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }}>{service.badge}</Text>
          </View>
        )}

        {/* Glass icon box — same as GreetingBanner weather icon */}
        <GlassBox size={40}>
          <service.Icon size={19} color={service.accent} />
        </GlassBox>

        {/* Title — same weight/size as GreetingBanner greeting text scaled down */}
        <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', lineHeight: 17, letterSpacing: -0.2, marginTop: 10, marginBottom: 3 }} numberOfLines={2}>
          {service.label}
        </Text>
        {/* Sub — same color as GreetingBanner subtitle (#93C5FD) */}
        <Text style={{ color: '#93C5FD', fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
          {service.desc}
        </Text>

        {/* Divider + arrow — matches GreetingBanner status row divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <ChevronRight size={11} color={service.accent} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}