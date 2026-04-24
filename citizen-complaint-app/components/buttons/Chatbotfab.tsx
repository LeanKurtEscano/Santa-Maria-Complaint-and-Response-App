import { useEffect, useRef } from 'react';
import { Animated, Easing, TouchableOpacity, View, Text } from 'react-native';
import { Bot } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ChatbotFABProps {
  onPress: () => void;
  badgeCount?: number;
  showLabel?: boolean;
  bottomOffset?: number;
  rightOffset?: number;
}

export default function ChatbotFAB({
  onPress,
  badgeCount = 0,
  showLabel = true,
  bottomOffset = 108,
  rightOffset = 20,
}: ChatbotFABProps) {
  const mountAnim    = useRef(new Animated.Value(0)).current;
  const ripple1      = useRef(new Animated.Value(0)).current;
  const ripple2      = useRef(new Animated.Value(0)).current;
  const labelSlide   = useRef(new Animated.Value(16)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const pressScale   = useRef(new Animated.Value(1)).current;
  const iconSway     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!showLabel) return;
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(labelSlide,   { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(labelOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }, 320);
    return () => clearTimeout(timeout);
  }, [showLabel]);

  useEffect(() => {
    const createRipple = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const r1 = createRipple(ripple1, 0);
    const r2 = createRipple(ripple2, 700);
    r1.start();
    r2.start();
    return () => { r1.stop(); r2.stop(); };
  }, []);

  useEffect(() => {
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(iconSway, { toValue: 1,  duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconSway, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconSway, { toValue: 0,  duration: 600,  easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(1800),
      ])
    );
    sway.start();
    return () => sway.stop();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.84, duration: 80, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, tension: 90, friction: 5, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const makeRippleStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] }) }],
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.25, 0] }),
  });

  const iconRotate = iconSway.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  const { t } = useTranslation();
  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        right: rightOffset,
        zIndex: 999,
        transform: [{ scale: Animated.multiply(mountAnim, pressScale) }],
      }}
    >
      <View className="flex-row items-center gap-3">

        {showLabel && (
          <Animated.View style={{ transform: [{ translateX: labelSlide }], opacity: labelOpacity }}>
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: THEME.primary + '33',
              }}
            >
              <View className="flex-row items-center gap-1.5">
                <BlinkDot />
                <Text style={{ color: THEME.primaryDark, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
                  {t('chatbot.ask')}
                </Text>
              </View>
            </View>
            <View
              className="absolute right-[-6px] top-1/2 w-3 h-3 bg-white rotate-45"
              style={{ marginTop: -6, borderRightWidth: 1, borderTopWidth: 1, borderColor: THEME.primary + '33' }}
            />
          </Animated.View>
        )}

        <View className="items-center justify-center">
          <Animated.View
            style={[{ position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: THEME.primary }, makeRippleStyle(ripple1)]}
          />
          <Animated.View
            style={[{ position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: THEME.primaryLight }, makeRippleStyle(ripple2)]}
          />

          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={1}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
              <Bot size={26} color="white" />
            </Animated.View>

            {badgeCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1 border-2 border-white">
                <Text className="text-white text-[9px] font-extrabold leading-none">
                  {badgeCount > 9 ? '9+' : String(badgeCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </Animated.View>
  );
}

function BlinkDot() {
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      className="w-2 h-2 rounded-full bg-green-500"
      style={{ opacity: blink }}
    />
  );
}