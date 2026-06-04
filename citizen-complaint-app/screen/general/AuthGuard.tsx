import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogIn, ShieldAlert, UserPlus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export default function AuthGuard() {
  const router = useRouter();
  const { t } = useTranslation();

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const scaleLogin  = useRef(new Animated.Value(1)).current;
  const scaleSignup = useRef(new Animated.Value(1)).current;

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
          <ShieldAlert size={52} color={THEME.primary} />
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
          {t('authGuard.title')}
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
          {t('authGuard.subtitle')}
        </Text>

        {/* Login button */}
        <Animated.View style={{ transform: [{ scale: scaleLogin }], width: '100%', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/Login')}
            onPressIn={() => pressIn(scaleLogin)}
            onPressOut={() => pressOut(scaleLogin)}
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
            <LogIn size={22} color="white" />
            <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>
              {t('authGuard.login')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>
            {t('authGuard.noAccount')}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
        </View>

        {/* Sign up button */}
        <Animated.View style={{ transform: [{ scale: scaleSignup }], width: '100%' }}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/Register')}
            onPressIn={() => pressIn(scaleSignup)}
            onPressOut={() => pressOut(scaleSignup)}
            activeOpacity={1}
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 2,
              borderColor: THEME.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <UserPlus size={22} color={THEME.primary} />
            <Text style={{ color: THEME.primary, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>
              {t('authGuard.signup')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>
    </SafeAreaView>
  );
}