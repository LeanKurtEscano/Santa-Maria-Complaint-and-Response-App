import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle, Navigation } from 'lucide-react-native';

interface LocationPermissionModalProps {
  visible: boolean;
  loading: boolean;
  onAllow: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

/**
 * Reusable modal component for requesting location permission
 * 
 * @example
 * <LocationPermissionModal
 *   visible={showModal}
 *   loading={isLoading}
 *   onAllow={handleAllowLocation}
 *   onCancel={() => setShowModal(false)}
 * />
 */
export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  loading,
  onAllow,
  onCancel,
  title = 'Enable Location Access',
  description = 'To file complaints, we need to know your location. This helps us direct your concerns to the right authorities in your area.',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
              <Navigation size={32} color="#2563EB" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-neutral-900 text-center mb-2">
            {title}
          </Text>

          {/* Description */}
          <Text className="text-neutral-600 text-center text-sm mb-6">
            {description}
          </Text>

          {/* Benefits */}
          <View className="bg-neutral-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-start mb-3">
              <CheckCircle size={16} color="#10B981" className="mt-0.5" />
              <Text className="text-neutral-700 text-sm ml-2 flex-1">
                File location-specific complaints
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <CheckCircle size={16} color="#10B981" className="mt-0.5" />
              <Text className="text-neutral-700 text-sm ml-2 flex-1">
                Faster response from local authorities
              </Text>
            </View>
            <View className="flex-row items-start">
              <CheckCircle size={16} color="#10B981" className="mt-0.5" />
              <Text className="text-neutral-700 text-sm ml-2 flex-1">
                Track complaints in your area
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={onAllow}
              disabled={loading}
              className="bg-primary-600 rounded-xl py-3.5 items-center"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Allow Location
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="bg-neutral-100 rounded-xl py-3.5 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-neutral-700 font-semibold text-base">
                Not Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <Text className="text-neutral-500 text-xs text-center mt-4">
            Your location is only used for complaint filing and is not shared with
            third parties.
          </Text>
        </View>
      </View>
    </Modal>
  );
};