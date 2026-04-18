import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  MapPin,
  FileText,
  BarChart2,
  Bell,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'welcome',
    icon: MapPin,
    iconBg: '#DBEAFE',
    iconBorder: '#93C5FD',
    iconColor: '#1D4ED8',
    accentColor: '#0284C7',
    tagBg: '#EFF6FF',
    tagBorder: '#BFDBFE',
    tagColor: '#1D4ED8',
    tag: 'COMMUNITY FIRST',
    title: 'Welcome to\nSanta Maria Complaint App',
    description:
      'Your direct line to local government. Report, track, and resolve community issues — all in one place.',
    bg: '#F0F9FF',
  },
  {
    key: 'submit',
    icon: FileText,
    iconBg: '#DCFCE7',
    iconBorder: '#86EFAC',
    iconColor: '#15803D',
    accentColor: '#16A34A',
    tagBg: '#F0FDF4',
    tagBorder: '#BBF7D0',
    tagColor: '#15803D',
    tag: 'EASY REPORTING',
    title: 'Report Complaints\nin Seconds',
    description:
      'Submit incidents like noise disturbances, waste issues, or neighbor disputes in just a few taps.',
    bg: '#F0FDF4',
  },
  {
    key: 'track',
    icon: BarChart2,
    iconBg: '#FEF9C3',
    iconBorder: '#FCD34D',
    iconColor: '#B45309',
    accentColor: '#D97706',
    tagBg: '#FFFBEB',
    tagBorder: '#FDE68A',
    tagColor: '#92400E',
    tag: 'REAL-TIME UPDATES',
    title: 'Track Your\nComplaints Live',
    description:
      'See exactly where your complaint stands — from submission to resolution — with live status updates.',
    bg: '#FFFBEB',
  },
  {
    key: 'notify',
    icon: Bell,
    iconBg: '#EDE9FE',
    iconBorder: '#C4B5FD',
    iconColor: '#6D28D9',
    accentColor: '#7C3AED',
    tagBg: '#F5F3FF',
    tagBorder: '#DDD6FE',
    tagColor: '#5B21B6',
    tag: 'STAY INFORMED',
    title: 'Get Notified\nInstantly',
    description:
      'Receive alerts the moment your complaint is reviewed, updated, or resolved by your barangay.',
    bg: '#F5F3FF',
  },
];

const DotIndicator = ({
  count,
  active,
  accentColor,
}: {
  count: number;
  active: number;
  accentColor: string;
}) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: count }).map((_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.dot,
          {
            width: i === active ? 24 : 8,
            backgroundColor: i === active ? accentColor : '#CBD5E1',
          },
        ]}
      />
    ))}
  </View>
);

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
          router.replace('/(auth)');
          return;
        }
      } catch (_) {}
      setIsChecking(false);
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isChecking) return;

    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    iconScale.setValue(0.7);
    iconOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 16,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        speed: 14,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, isChecking]);

  if (isChecking) return null;

  const animateOut = (onDone: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onDone);
  };

  const goNext = () => {
    if (isLast) return finishOnboarding();
    animateOut(() => setCurrentIndex((i) => i + 1));
  };

  const goBack = () => {
    if (currentIndex === 0) return;
    animateOut(() => setCurrentIndex((i) => i - 1));
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (_) {}
    router.replace('/(auth)');
  };

  const IconComponent = slide.icon;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={slide.bg} />

      {/* Top bar */}
      <View style={styles.topBar}>
        {currentIndex > 0 ? (
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={[styles.backText, { color: slide.accentColor }]}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <TouchableOpacity onPress={finishOnboarding} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Icon card — now has a visible border */}
        <Animated.View
          style={[
            styles.iconCard,
            {
              backgroundColor: slide.iconBg,
              borderColor: slide.iconBorder,
              transform: [{ scale: iconScale }],
              opacity: iconOpacity,
            },
          ]}
        >
          <IconComponent size={52} color={slide.iconColor} strokeWidth={1.5} />
        </Animated.View>

        {/* Tag pill — now has its own bg + border so it's visible */}
        <View
          style={[
            styles.tagPill,
            {
              backgroundColor: slide.tagBg,
              borderColor: slide.tagBorder,
            },
          ]}
        >
          <Text style={[styles.tagText, { color: slide.tagColor }]}>{slide.tag}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <DotIndicator
          count={SLIDES.length}
          active={currentIndex}
          accentColor={slide.accentColor}
        />

        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.88}
          style={[styles.ctaButton, { backgroundColor: slide.accentColor }]}
        >
          <Text style={styles.ctaText}>
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
          {isLast ? (
            <ArrowRight size={20} color="#FFFFFF" />
          ) : (
            <ChevronRight size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {isLast && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/Login')}
              activeOpacity={0.7}
              style={styles.loginRow}
            >
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={[styles.loginLink, { color: slide.accentColor }]}>Log In</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!isLast && <View style={{ height: 36 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 72,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  iconCard: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // KEY FIX: visible border so the card doesn't blend into the bg
    borderWidth: 1.5,
    borderStyle: 'solid',
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 16,
    // KEY FIX: visible border on the pill
    borderWidth: 1,
    borderStyle: 'solid',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 8,
    elevation: 4,
    marginBottom: 16,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});