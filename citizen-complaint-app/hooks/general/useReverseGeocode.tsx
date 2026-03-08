/**
 * useReverseGeocode
 *
 * Shared hook used by LocationCard and ProfileScreen (and anywhere else)
 * to reverse-geocode a lat/lng into a human-readable address via Nominatim.
 *
 * Returns null while loading, null on failure (graceful degradation).
 */

import { useState, useEffect } from 'react';

export interface GeocodedAddress {
  display: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

// ─── Philippines bounding box ─────────────────────────────────────────────────
const PH_BOUNDS = { minLat: 4.5, maxLat: 21.5, minLng: 116.0, maxLng: 127.0 };

export const isInsidePhilippines = (lat: number, lng: number): boolean =>
  lat >= PH_BOUNDS.minLat &&
  lat <= PH_BOUNDS.maxLat &&
  lng >= PH_BOUNDS.minLng &&
  lng <= PH_BOUNDS.maxLng;

export const isValidCoordinate = (lat: number, lng: number): boolean =>
  !isNaN(lat) &&
  !isNaN(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const reverseGeocode = async (lat: number, lng: number): Promise<GeocodedAddress | null> => {
  try {
    const res = await fetch(
     `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
  { 
    headers: { 
      'Accept-Language': 'en',
       'User-Agent': 'citizen-complaint-app/1.0 (noreply.stamaria.ucrs@gmail.com)'
    } 
  }
);
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return {
      display: data.display_name ?? '',
      city: a.city ?? a.town ?? a.municipality ?? a.village ?? '',
      region: a.state ?? a.region ?? '',
      country: a.country ?? '',
      countryCode: (a.country_code ?? '').toUpperCase(),
    };
  } catch {
    return null;
  }
};

interface UseReverseGeocodeOptions {
  /** Skip the fetch entirely — useful when barangay is known and inside PH */
  skip?: boolean;
}

export const useReverseGeocode = (
  lat: number | null,
  lng: number | null,
  options: UseReverseGeocodeOptions = {}
) => {
  const [geocoded, setGeocode] = useState<GeocodedAddress | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear stale result immediately so the old address doesn't linger
    setGeocode(null);

    if (options.skip || lat === null || lng === null) return;

    let cancelled = false;
    setLoading(true);

    reverseGeocode(lat, lng).then((result) => {
      if (!cancelled) {
        setGeocode(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      setLoading(false);
    };
  // Re-run whenever coordinates or skip flag changes
  }, [lat, lng, options.skip]);

  return { geocoded, loading };
};