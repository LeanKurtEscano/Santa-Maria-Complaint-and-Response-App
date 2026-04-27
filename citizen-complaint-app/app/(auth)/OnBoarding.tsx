import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, BarChart2, Bell, ArrowRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { Image } from 'react-native';
import { router } from 'expo-router';
const { width: W } = Dimensions.get('window');

// ─── Feature data ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: MapPin,
    color: THEME.primary,
    bg: '#DCFCE7',
    label: 'Report Issues',
    sub: 'Submit community complaints in just a few taps',
  },
  {
    icon: BarChart2,
    color: '#D97706',
    bg: '#FEF3C7',
    label: 'Track in Real-Time',
    sub: 'Follow every update from submission to resolution',
  },
  {
    icon: Bell,
    color: '#7C3AED',
    bg: '#EDE9FE',
    label: 'Instant Notifications',
    sub: 'Get alerted the moment your barangay takes action',
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeAnim() {
  return { opacity: new Animated.Value(0), y: new Animated.Value(40) };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {


  // 9 elements: logo, appName, tagline, divider, feat0, feat1, feat2, cta, loginRow
  const anims = useRef(Array.from({ length: 9 }, makeAnim)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Redirect if already onboarded
    AsyncStorage.getItem('hasSeenOnboarding').then((val) => {
      if (val === 'true') router.replace('/(auth)');
    });

    // Staggered entrance — each element fans in 130ms apart
    const STAGGER = 130;
    anims.forEach((a, i) => {
      const delay = i * STAGGER;
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 420,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(a.y, {
          toValue: 0,
          speed: 14,
          bounciness: 5,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Logo pops in with a spring scale
    Animated.spring(logoScale, {
      toValue: 1,
      speed: 13,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  const finish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)');
  };

  // Shorthand to pull animated style for element i
  const a = (i: number) => ({
    opacity: anims[i].opacity,
    transform: [{ translateY: anims[i].y }],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      {/* Decorative background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.container}>

        {/* ── HERO ─────────────────────────────────────── */}
        <View style={styles.hero}>

          {/* Logo — animates with scale + opacity */}
          <Animated.View
            style={[
              styles.logoWrap,
              { opacity: anims[0].opacity, transform: [{ scale: logoScale }] },
            ]}
          >
            <Image
              source={require('../../assets/images/santamarialogoapp.jpg')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </Animated.View>

          {/* App name */}
          <Animated.Text style={[styles.appName, a(1)]}>
            Mary App
          </Animated.Text>

          {/* Tagline pill */}
          <Animated.View style={[styles.taglinePill, a(2)]}>
            <Text style={styles.taglineText}>YOUR COMMUNITY VOICE</Text>
          </Animated.View>
        </View>

        {/* ── DIVIDER ──────────────────────────────────── */}
        <Animated.View style={[styles.divider, a(3)]} />

        {/* ── FEATURE CARDS ────────────────────────────── */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Animated.View key={f.label} style={[styles.featureCard, a(4 + i)]}>
                <View style={[styles.iconWrap, { backgroundColor: f.bg }]}>
                  <Icon size={20} color={f.color} strokeWidth={1.9} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featLabel}>{f.label}</Text>
                  <Text style={styles.featSub}>{f.sub}</Text>
                </View>
                <View style={[styles.accentDot, { backgroundColor: f.bg }]}>
                  <View style={[styles.accentDotCore, { backgroundColor: f.color }]} />
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* ── CTA SECTION ──────────────────────────────── */}
        <View style={styles.ctaSection}>

          <Animated.View style={a(7)}>
            <TouchableOpacity
              onPress={finish}
              activeOpacity={0.87}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.loginRow, a(8)]}>
            <Text style={styles.loginMuted}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)')} activeOpacity={0.7}>
              <Text style={[styles.loginLink, { color: THEME.primary }]}> Log In</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  // Soft background blobs for depth
  blob1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#DCFCE7',
    opacity: 0.6,
    top: -100,
    right: -100,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#BBF7D0',
    opacity: 0.28,
    bottom: 40,
    left: -70,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },

  // ── Hero ──────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: 8,
  },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImg: {
    width: 92,
    height: 92,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1.2,
    marginBottom: 10,
  },
  taglinePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: THEME.primary,
  },

  // ── Divider ───────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#D1FAE5',
    marginVertical: 22,
  },

  // ── Feature cards ─────────────────────────────────
  featureList: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  featSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  accentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── CTA section ───────────────────────────────────
  ctaSection: {
    paddingTop: 22,
    paddingBottom: 6,
    alignItems: 'center',
    gap: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: W - 48,
    paddingVertical: 18,
    borderRadius: 22,
    gap: 10,
    backgroundColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 7,
    marginBottom: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginMuted: {
    fontSize: 14,
    color: '#94A3B8',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});