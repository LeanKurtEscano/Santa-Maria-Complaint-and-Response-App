/**
 * ChatbotFAB — Floating Action Button for the chatbot modal.
 *
 * Stack: React Native + NativeWind (Tailwind className)
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *
 *   <ChatbotFAB onPress={() => setOpen(true)} />
 *   <ChatbotModal visible={open} onClose={() => setOpen(false)} />
 *
 * Props:
 *   onPress      — opens the chatbot (wire to ChatbotModal visible state)
 *   badgeCount   — red badge number (0 = hidden)
 *   showLabel    — toggle the animated "Tanong?" label pill
 *   bottomOffset — distance from bottom of screen (default: 108)
 *   rightOffset  — distance from right edge (default: 20)
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, TouchableOpacity, View, Text } from 'react-native';
import { Bot } from 'lucide-react-native';

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
  // Mount pop-in
  const mountAnim   = useRef(new Animated.Value(0)).current;

  // Two independent ripple rings
  const ripple1     = useRef(new Animated.Value(0)).current;
  const ripple2     = useRef(new Animated.Value(0)).current;

  // Label slide-in from right
  const labelSlide  = useRef(new Animated.Value(16)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;

  // Press squeeze
  const pressScale  = useRef(new Animated.Value(1)).current;

  // Icon sway
  const iconSway    = useRef(new Animated.Value(0)).current;

  // ── Mount pop-in ──────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      tension: 50,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Label slide-in (200ms after mount) ───────────────────────────────────
  useEffect(() => {
    if (!showLabel) return;
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(labelSlide, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }, 320);
    return () => clearTimeout(timeout);
  }, [showLabel]);

  // ── Ripple pulse (runs always, staggered) ─────────────────────────────────
  useEffect(() => {
    const createRipple = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const r1 = createRipple(ripple1, 0);
    const r2 = createRipple(ripple2, 700);
    r1.start();
    r2.start();
    return () => { r1.stop(); r2.stop(); };
  }, []);

  // ── Icon idle sway ────────────────────────────────────────────────────────
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

  // ── Press handler ─────────────────────────────────────────────────────────
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.84, duration: 80, useNativeDriver: true }),
      Animated.spring(pressScale,  { toValue: 1, tension: 90, friction: 5, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  // ── Ripple interpolations ─────────────────────────────────────────────────
  const makeRippleStyle = (anim: Animated.Value) => ({
    transform: [{
      scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] }),
    }],
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.25, 0] }),
  });

  const iconRotate = iconSway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

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

        {/* ── "Tanong?" label pill ── */}
        {showLabel && (
          <Animated.View
            style={{
              transform: [{ translateX: labelSlide }],
              opacity: labelOpacity,
            }}
          >
            <View className="bg-white rounded-2xl px-4 py-2 border border-blue-100 shadow shadow-blue-100">
              <View className="flex-row items-center gap-1.5">
                {/* Blinking dot */}
                <BlinkDot />
                <Text className="text-blue-700 text-sm font-bold tracking-wide">
                  Tanong?
                </Text>
              </View>
            </View>
            {/* Small arrow pointing right toward FAB */}
            <View
              className="absolute right-[-6px] top-1/2 w-3 h-3 bg-white border-r border-t border-blue-100 rotate-45"
              style={{ marginTop: -6 }}
            />
          </Animated.View>
        )}

        {/* ── FAB with ripple rings ── */}
        <View className="items-center justify-center">
          {/* Ripple ring 1 */}
          <Animated.View
            className="absolute w-14 h-14 rounded-full bg-blue-500"
            style={makeRippleStyle(ripple1)}
          />
          {/* Ripple ring 2 */}
          <Animated.View
            className="absolute w-14 h-14 rounded-full bg-blue-400"
            style={makeRippleStyle(ripple2)}
          />

          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={1}
            className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center"
          >
            {/* Animated bot icon */}
            <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
              <Bot size={26} color="white" />
            </Animated.View>

            {/* Badge */}
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

// ── Blinking dot indicator ─────────────────────────────────────────────────────

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