/**
 * LocationCard
 *
 * Shows a read-only pinned map + full address derived live from the
 * current coordinates via reverse geocoding. The address always reflects
 * the latest pin — it never reads from stale backend fields.
 *
 * Edge cases handled:
 *  - No lat/lng          → renders null
 *  - Invalid coordinates → shows error card with update prompt
 *  - Outside Philippines → shows amber notice with country name
 *  - Geocoding in flight → shows spinner where address will appear
 *  - Geocode fails       → shows "Address unavailable" gracefully
 *
 * Swapping map providers:
 *   import { GoogleMapsProvider } from './MapDisplay';
 *   <LocationCard ... mapProvider={GoogleMapsProvider} />
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Navigation, AlertTriangle, Globe } from 'lucide-react-native';
import { MapDisplay,MapProvider } from './Mapdisplay';
import {
  useReverseGeocode,
  isInsidePhilippines,
  isValidCoordinate,
} from '@/hooks/general/useReverseGeocode';

interface LocationCardProps {
  latitude?: string | number | null;
  longitude?: string | number | null;
  onUpdatePress?: () => void;
  mapProvider?: MapProvider;
  updateLabel?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  latitude,
  longitude,
  onUpdatePress,
  mapProvider,
  updateLabel = 'Update Location',
}) => {
  const lat = latitude != null ? parseFloat(latitude.toString()) : null;
  const lng = longitude != null ? parseFloat(longitude.toString()) : null;

  const validCoords = lat !== null && lng !== null && isValidCoordinate(lat, lng);
  const isInPH = validCoords ? isInsidePhilippines(lat!, lng!) : false;

  // Always geocode from current coords — this is the only source of address truth
  const { geocoded, loading: geocoding } = useReverseGeocode(lat, lng, {
    skip: !validCoords,
  });

  // ── No coordinates → render nothing ──
  if (lat === null || lng === null) return null;

  // ── Invalid coordinates → error card ──
  if (!isValidCoordinate(lat, lng)) {
    return (
      <View className="rounded-2xl border border-error-200 bg-error-50 p-4 flex-row items-start gap-3">
        <AlertTriangle size={18} color="#EF4444" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-error-700">
            Invalid location data
          </Text>
          <Text className="text-xs text-error-500 mt-0.5">
            The saved coordinates are not valid. Please update your location.
          </Text>
          {onUpdatePress && (
            <TouchableOpacity onPress={onUpdatePress} className="mt-3" activeOpacity={0.7}>
              <Text className="text-sm font-semibold text-error-600 underline">
                Update Location
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">

      {/* Map */}
      <MapDisplay
        latitude={lat}
        longitude={lng}
        zoom={15}
        height={200}
        provider={mapProvider}
      />

      {/* Outside PH notice */}
      {!isInPH && (
        <View className="flex-row items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
          <Globe size={14} color="#D97706" />
          <Text className="text-xs text-amber-700 font-medium flex-1">
            Location is outside the Philippines
            {geocoded?.country ? ` · ${geocoded.country}` : ''}
          </Text>
        </View>
      )}

      <View className="p-4">

        {/* Coordinates */}
        <View className="flex-row items-start">
          <View className="w-7 mt-0.5">
            <Navigation size={16} color="#2563EB" />
          </View>
          <Text className="flex-1 text-xs font-semibold text-primary-600 font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </Text>
        </View>

        <View className="h-px bg-neutral-100 my-3" />

        {/* Full address — always from reverse geocode */}
        <View className="flex-row items-start">
          <View className="w-7 mt-0.5">
            <MapPin size={16} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">
              Address
            </Text>
            {geocoding ? (
              <View className="flex-row items-center gap-1.5">
                <ActivityIndicator size="small" color="#9CA3AF" />
                <Text className="text-xs text-neutral-400">Fetching address…</Text>
              </View>
            ) : geocoded?.display ? (
              <Text className="text-sm text-neutral-800 leading-5">
                {geocoded.display}
              </Text>
            ) : (
              <Text className="text-sm text-neutral-400 italic">
                Address unavailable
              </Text>
            )}
          </View>
        </View>

        {/* Update button */}
        {onUpdatePress && (
          <>
            <View className="h-px bg-neutral-100 my-3" />
            <TouchableOpacity
              onPress={onUpdatePress}
              className="flex-row items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-50"
              activeOpacity={0.7}
            >
              <MapPin size={14} color="#2563EB" />
              <Text className="text-sm font-semibold text-primary-600">{updateLabel}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};