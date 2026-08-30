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
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

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
        duration: 150,
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
            transform: [{ scale: scaleAnim }],
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
            <LucideIcon size={36} color={config.iconBg} strokeWidth={2} />
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
        <Text
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 20,
            letterSpacing: 0.6,
            fontWeight: '400',
          }}
        >
          Tap anywhere to dismiss
        </Text>
      </Pressable>
    </Modal>
  );
};

export default GeneralToast;