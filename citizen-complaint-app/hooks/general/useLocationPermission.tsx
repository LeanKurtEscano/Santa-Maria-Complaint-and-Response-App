import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

interface LocationResult {
  granted: boolean;
  latitude?: number;
  longitude?: number;
}

interface UseLocationPermissionReturn {
  locationLoading: boolean;
  requestLocationPermission: () => Promise<LocationResult>;
}

/**
 * Reusable hook for requesting location permission and getting coordinates
 * 
 * @example
 * const { locationLoading, requestLocationPermission } = useLocationPermission();
 * 
 * const handleGetLocation = async () => {
 *   const result = await requestLocationPermission();
 *   if (result.granted) {
 *     console.log('Lat:', result.latitude, 'Lng:', result.longitude);
 *   }
 * };
 */
export const useLocationPermission = (): UseLocationPermissionReturn => {
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocationPermission = async (): Promise<LocationResult> => {
    try {
      setLocationLoading(true);

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to continue.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return { granted: false };
      }

      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to file complaints in your area.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return { granted: false };
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocationLoading(false);

      return {
        granted: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error requesting location:', error);
      setLocationLoading(false);
      
      Alert.alert(
        'Error',
        'Failed to get your location. Please try again.',
        [{ text: 'OK' }]
      );
      
      return { granted: false };
    }
  };

  return {
    locationLoading,
    requestLocationPermission,
  };
};