import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BadgeCheck, ShieldQuestion, Clock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface VerifyGuardProps {
  pending?: boolean;
}

export default function VerifyGuard({ pending = false }: VerifyGuardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleBtn   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }).start();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
          paddingBottom: 40,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Icon container */}
        <View
          style={{
            backgroundColor: THEME.primaryMuted,
            padding: 32,
            borderRadius: 99,
            marginBottom: 36,
            shadowColor: THEME.primary,
            elevation: 6,
          }}
        >
          {pending ? (
            <Clock size={52} color={THEME.primary} />
          ) : (
            <ShieldQuestion size={52} color={THEME.primary} />
          )}
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: '#111827',
            textAlign: 'center',
            letterSpacing: -0.5,
            marginBottom: 14,
          }}
        >
          {pending ? t('verifyGuard.pendingTitle') : t('verifyGuard.title')}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 15,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 48,
            paddingHorizontal: 8,
          }}
        >
          {pending ? t('verifyGuard.pendingSubtitle') : t('verifyGuard.subtitle')}
        </Text>

        {/* Verify button — hidden while pending, nothing to click */}
        {!pending && (
          <Animated.View style={{ transform: [{ scale: scaleBtn }], width: '100%' }}>
            <TouchableOpacity
              onPress={() => router.push('/profile/GoogleAccountVerification')}
              onPressIn={() => pressIn(scaleBtn)}
              onPressOut={() => pressOut(scaleBtn)}
              activeOpacity={1}
              style={{
                backgroundColor: THEME.primary,
                borderRadius: 16,
                paddingVertical: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                shadowColor: THEME.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <BadgeCheck size={22} color="white" />
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>
                {t('verifyGuard.button')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}