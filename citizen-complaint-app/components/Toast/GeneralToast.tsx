import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Animated } from 'react-native';

interface GeneralToastProps {
  visible: boolean;
  onHide: () => void;
  message: string;
  type: 'success' | 'error';
}

const GeneralToast: React.FC<GeneralToastProps> = ({ visible, onHide, message, type }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      iconScaleAnim.setValue(0);
      iconRotateAnim.setValue(0);
      shakeAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (type === 'success') {
          // Success checkmark animation
          Animated.sequence([
            Animated.spring(iconScaleAnim, {
              toValue: 1.2,
              tension: 100,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.spring(iconScaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
          ]).start();

          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        } else {
          // Error shake animation
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]).start();

          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      });

      // Auto hide after duration (longer for errors)
      const duration = type === 'error' ? 3000 : 2000;
      const timer = setTimeout(() => {
        handleHide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, type]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-pink-500' : 'bg-red-500';
  const textColor = isSuccess ? 'text-pink-500' : 'text-red-500';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleHide}
    >
      <View className="flex-1 justify-center items-center bg-black/40">
        <Animated.View
          style={{
            transform: [
              { scale: scaleAnim },
              { translateX: type === 'error' ? shakeAnim : 0 }
            ],
            opacity: opacityAnim,
          }}
          className="bg-white rounded-2xl px-8 py-6 mx-8 shadow-lg max-w-sm"
        >
          <View className={`${bgColor} rounded-full w-16 h-16 justify-center items-center mx-auto mb-4`}>
            {isSuccess ? (
              <Animated.Text
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
                className="text-white text-3xl font-bold"
              >
                ✓
              </Animated.Text>
            ) : (
              <Animated.Text
                style={{
                  transform: [{ scale: iconScaleAnim }],
                }}
                className="text-white text-4xl font-bold"
              >
                ✕
              </Animated.Text>
            )}
          </View>
          <Text className={`${textColor} text-lg font-bold text-center`}>
            {isSuccess ? 'Success!' : 'Oops!'}
          </Text>
          <Text className="text-gray-600 text-sm text-center mt-2">
            {message}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default GeneralToast;