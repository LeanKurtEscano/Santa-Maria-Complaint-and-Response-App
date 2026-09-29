import { useState } from 'react';
import * as Location from 'expo-location';

interface LocationResult {
  granted: boolean;
  latitude?: number;
  longitude?: number;
  reason?: 'services_disabled' | 'denied' | 'error';
  canAskAgain?: boolean;
}

interface UseLocationPermissionReturn {
  locationLoading: boolean;
  requestLocationPermission: () => Promise<LocationResult>;
}

const LOCATION_TIMEOUT_MS = 10000;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });

/**
 * Requests location permission and returns coordinates.
 * Shows no alerts: callers decide what to show based on `reason`.
 */
export const useLocationPermission = (): UseLocationPermissionReturn => {
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocationPermission = async (): Promise<LocationResult> => {
    try {
      setLocationLoading(true);

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return { granted: false, reason: 'services_disabled' };
      }

      // Prompts again on each call, as long as the OS allows it
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { granted: false, reason: 'denied', canAskAgain };
      }

      // Use a recent cached position if available (instant),
      // otherwise fetch a fresh one with a timeout for slow devices
      let location = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 500,
      });

      if (!location) {
        location = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          LOCATION_TIMEOUT_MS,
        );
      }

      return {
        granted: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.warn('Failed to get location:', error);
      return { granted: false, reason: 'error' };
    } finally {
      setLocationLoading(false);
    }
  };

  return { locationLoading, requestLocationPermission };
};