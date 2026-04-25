import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Animated, Pressable } from 'react-native';
import { CheckCircle2, XCircle, Info } from 'lucide-react-native';

interface GeneralToastProps {
  visible: boolean;
  onHide: () => void;
  message: string;
  type: 'success' | 'error' | 'info';
}

const GeneralToast: React.FC<GeneralToastProps> = ({ visible, onHide, message, type }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      iconScaleAnim.setValue(0);
      iconRotateAnim.setValue(0);
      shakeAnim.setValue(0);
      translateYAnim.setValue(-20);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (type === 'success') {
          Animated.sequence([
            Animated.spring(iconScaleAnim, {
              toValue: 1.3,
              tension: 120,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.spring(iconScaleAnim, {
              toValue: 1,
              tension: 120,
              friction: 5,
              useNativeDriver: true,
            }),
          ]).start();

          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        } else if (type === 'error') {
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          ]).start();

          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 4,
            useNativeDriver: true,
          }).start();
        } else {
          // info
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      });

      const duration = type === 'error' ? 3000 : type === 'info' ? 3500 : 2500;
      const timer = setTimeout(() => {
        handleHide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, type]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -10,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const config = {
    success: {
      iconBg: '#22c55e',
      iconBgLight: '#dcfce7',
      labelColor: '#15803d',
      label: 'Success!',
      borderColor: '#86efac',
      LucideIcon: CheckCircle2,
    },
    error: {
      iconBg: '#ef4444',
      iconBgLight: '#fee2e2',
      labelColor: '#b91c1c',
      label: 'Oops!',
      borderColor: '#fca5a5',
      LucideIcon: XCircle,
    },
    info: {
      iconBg: '#ffffff',
      iconBgLight: '#3b82f6',
      labelColor: '#1d4ed8',
      label: 'Heads up!',
      borderColor: '#93c5fd',
      LucideIcon: Info,
    },
  }[type];

  const { LucideIcon } = config;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleHide}
    >
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
        onPress={handleHide}
      >
        <Animated.View
          style={{
            transform: [
              { scale: scaleAnim },
              { translateX: type === 'error' ? shakeAnim : 0 },
              { translateY: translateYAnim },
            ],
            opacity: opacityAnim,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            paddingHorizontal: 32,
            paddingVertical: 28,
            marginHorizontal: 32,
            maxWidth: 320,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 12,
            borderWidth: 1,
            borderColor: config.borderColor,
          }}
        >
          {/* Icon circle */}
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: config.iconBgLight,
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          >
            {type === 'success' ? (
              <Animated.View
                style={{
                  transform: [
                    { scale: iconScaleAnim },
                    {
                      rotate: iconRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-180deg', '0deg'],
                      }),
                    },
                  ],
                }}
              >
                <LucideIcon size={36} color={config.iconBg} strokeWidth={2} />
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: iconScaleAnim }] }}>
                <LucideIcon size={36} color={config.iconBg} strokeWidth={2} />
              </Animated.View>
            )}
          </View>

          {/* Label */}
          <Text
            style={{
              color: config.labelColor,
              fontSize: 17,
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: 0.2,
            }}
          >
            {config.label}
          </Text>

          {/* Message */}
          <Text
            style={{
              color: '#6b7280',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
        </Animated.View>

        {/* Dismiss hint — outside the card */}
        <Animated.Text
          style={{
            opacity: opacityAnim,
            color: 'rgba(255,255,255,0.55)',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 20,
            letterSpacing: 0.6,
            fontWeight: '400',
          }}
        >
          Tap anywhere to dismiss
        </Animated.Text>
      </Pressable>
    </Modal>
  );
};

export default GeneralToast;