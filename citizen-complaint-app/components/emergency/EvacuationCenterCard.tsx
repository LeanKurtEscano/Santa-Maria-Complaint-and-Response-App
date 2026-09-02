/**
 * EvacuationCenterCard
 *
 * CHANGED: now represents a GROUP of evacuation centers (e.g. all centers in
 * a chosen barangay, or all "nearby" centers) as a single card, instead of
 * one card per center.
 *
 * - Uses the OSRM Table Service (one request, many destinations) to find the
 *   best (fastest) center among the group, and previews that one — map
 *   thumbnail, distance/ETA badge, geocoded address.
 * - Shows a "+N more" indicator when there's more than one center.
 * - Tapping the card (or "View All on Map") opens EvacuationRouteModal with
 *   the FULL list of centers, so all of them get pinned there.
 * - Falls back to Haversine (over all centers) if the OSRM table call fails.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, Building2, Maximize2, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { MapDisplay } from '@/components/location/Mapdisplay';
import {
  useReverseGeocode,
  isValidCoordinate,
} from '@/hooks/general/useReverseGeocode';
import { EvacuationCenter } from '@/constants/emergency/evacuation';
import { EvacuationRouteModal } from './EvacuationRouteModal';
import { NAME_CORRECTIONS, displayName } from '@/utils/general/barangayNameError';
// ── Haversine (fallback only) ─────────────────────────────────────────────────
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatMins(secs: number): string {
  const m = Math.round(secs / 60);
  if (m < 60) return `~${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `~${h}h ${rem}m` : `~${h}h`;
}

// ── OSRM "nearest of many" via the Table Service ──────────────────────────────
interface NearestResult {
  center: EvacuationCenter;
  distanceKm: number;
  durationSecs: number;
}

function useOsrmNearest(
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  centers: EvacuationCenter[],
): { data: NearestResult | null; loading: boolean } {
  const [data, setData] = useState<NearestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validCenters = centers.filter((c) => isValidCoordinate(c.latitude, c.longitude));
  // Stable string key so the effect doesn't refire just because a new array
  // reference was passed in with the same contents.
  const centersKey = validCenters.map((c) => `${c.id}:${c.latitude},${c.longitude}`).join('|');

  const hasUser =
    userLat != null &&
    userLng != null &&
    isValidCoordinate(userLat, userLng) &&
    validCenters.length > 0;

  useEffect(() => {
    if (!hasUser) return;

    let cancelled = false;
    setLoading(true);
    setData(null);

    const coordsList = [
      `${userLng},${userLat}`,
      ...validCenters.map((c) => `${c.longitude},${c.latitude}`),
    ].join(';');
    const destIndices = validCenters.map((_, i) => i + 1).join(';');

    const url =
      `https://router.project-osrm.org/table/v1/driving/${coordsList}` +
      `?sources=0&destinations=${destIndices}&annotations=distance,duration`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;

        const distances: (number | null)[] | undefined = json?.distances?.[0];
        const durations: (number | null)[] | undefined = json?.durations?.[0];

        if (!Array.isArray(distances)) throw new Error('no table result');

        let bestIdx = -1;
        let bestDuration = Infinity;
        (durations ?? distances).forEach((d, i) => {
          if (d != null && d < bestDuration) {
            bestDuration = d;
            bestIdx = i;
          }
        });

        if (bestIdx === -1) throw new Error('no reachable center');

        setData({
          center: validCenters[bestIdx],
          distanceKm: (distances[bestIdx] ?? 0) / 1000,
          durationSecs: durations?.[bestIdx] ?? 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: Haversine straight-line distance to every center, pick nearest
        let best: NearestResult | null = null;
        validCenters.forEach((c) => {
          const km = haversineKm(userLat!, userLng!, c.latitude, c.longitude);
          if (!best || km < best.distanceKm) {
            best = { center: c, distanceKm: km, durationSecs: 0 };
          }
        });
        setData(best);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLat, userLng, centersKey, hasUser]);

  return { data, loading };
}

// ─────────────────────────────────────────────────────────────────────────────

interface EvacuationCenterCardProps {
  /** All evacuation centers belonging to this group (a barangay, or "nearby"). */
  centers: EvacuationCenter[];
  /** Label for the group, e.g. the barangay name. Omit for the "nearby" default. */
  areaLabel?: string;
  userLatitude?: number | null;
  userLongitude?: number | null;
}

export const EvacuationCenterCard: React.FC<EvacuationCenterCardProps> = ({
  centers,
  areaLabel,
  userLatitude,
  userLongitude,
}) => {
  const { t } = useTranslation();
  const [routeOpen, setRouteOpen] = useState(false);

  const { data: nearest, loading: nearestLoading } = useOsrmNearest(
    userLatitude, userLongitude, centers,
  );

  if (!centers || centers.length === 0) return null;


  // Prefer the OSRM-determined best center for the preview; fall back to the
  // first valid-coordinate center while that lookup is still in flight.
  const previewCenter =
    nearest?.center ??
    centers.find((c) => isValidCoordinate(c.latitude, c.longitude)) ??
    centers[0];

    console.log('EvacuationCenterCard previewCenter:', previewCenter);

  const lat = previewCenter.latitude;
  const lng = previewCenter.longitude;
  const valid = isValidCoordinate(lat, lng);

  const { geocoded, loading: geocoding } = useReverseGeocode(
    valid ? lat : null,
    valid ? lng : null,
  );

  const otherCount = Math.max(centers.length - 1, 0);

  const groupTitle = areaLabel
    ? t('emergency.evacuation.centersInArea', {
        area: areaLabel,
        defaultValue: `Evacuation Centers — ${areaLabel}`,
      })
    : t('emergency.evacuation.nearbyCenters', {
        defaultValue: 'Nearby Evacuation Centers',
      });

  return (
    <>
      <View
        className="bg-white rounded-2xl overflow-hidden mb-4"
        style={{
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 4,
        }}
      >

        {/* ── Mini-map (tappable) ── */}
        {valid ? (
          <TouchableOpacity
            onPress={() => setRouteOpen(true)}
            activeOpacity={0.92}
            accessibilityLabel={t('emergency.evacuation.viewRoute')}
          >
            <MapDisplay latitude={lat} longitude={lng} zoom={15} height={170} />

            {/* "View Route" pill — bottom-right of map */}
            <View className="absolute bottom-2.5 right-2.5 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center gap-x-1.5">
              <Maximize2 size={11} color="#fff" />
              <Text className="text-white text-[11px] font-bold tracking-wide">
                {t('emergency.evacuation.viewRoute')}
              </Text>
            </View>

            {/* Count pill — top-left of map, only when there's more than one */}
            {centers.length > 1 && (
              <View className="absolute top-2.5 left-2.5 bg-emerald-600 rounded-full px-3 py-1.5">
                <Text className="text-white text-[11px] font-bold">
                  {t('emergency.evacuation.centersCount', {
                    count: centers.length,
                    defaultValue: `${centers.length} centers`,
                  })}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View className="h-40 bg-slate-100 items-center justify-center gap-y-1">
            <MapPin size={24} color="#94A3B8" />
            <Text className="text-xs text-slate-400">
              {t('emergency.evacuation.mapUnavailable')}
            </Text>
          </View>
        )}

        {/* ── Card body ── */}
        <View className="px-4 pt-4 pb-4 gap-y-3">

          {/* ── Group title row ── */}
          <View className="flex-row items-center gap-x-3">
            <View className="w-9 h-9 rounded-full bg-emerald-100 items-center justify-center shrink-0">
              <Building2 size={18} color="#059669" />
            </View>

            <View className="flex-1">
              <Text
                className="text-[15px] font-bold text-slate-800 leading-5"
                numberOfLines={2}
              >
                {groupTitle}
              </Text>
              <Text className="text-[12px] text-slate-400 mt-0.5" numberOfLines={1}>
               {otherCount > 0
  ? t('emergency.evacuation.nearestPlusOthers', {
      name: displayName(previewCenter.name),
      count: otherCount,
      defaultValue: `Nearest: ${displayName(previewCenter.name)} · +${otherCount} more`,
    })
  : displayName(previewCenter.name)}
              </Text>
            </View>
          </View>

          {/* ── Distance + ETA row (to the best center) ── */}
          {(nearestLoading || nearest) && (
            <View className="flex-row items-center gap-x-2 pl-12">
              {nearestLoading ? (
                <View className="flex-row items-center gap-x-1.5">
                  <ActivityIndicator size="small" color="#059669" />
                  <Text className="text-[11px] text-slate-400">
                    {t('emergency.evacuation.calculatingRoute')}
                  </Text>
                </View>
              ) : nearest ? (
                <>
                  <View className="bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 flex-row items-center gap-x-1">
                    <Navigation size={11} color="#059669" />
                    <Text className="text-[11px] font-bold text-emerald-700">
                      {formatKm(nearest.distanceKm)} {t('emergency.evacuation.away')}
                    </Text>
                  </View>

                  {nearest.durationSecs > 0 && (
                    <View className="bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 flex-row items-center gap-x-1">
                      <Clock size={11} color="#2563EB" />
                      <Text className="text-[11px] font-bold text-blue-700">
                        {formatMins(nearest.durationSecs)}
                      </Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          {/* Divider */}
          <View className="h-px bg-slate-100" />

          {/* ── Geocoded address (of the best center) ── */}
          <View className="flex-row items-start gap-x-3">
            <View className="w-9 items-center pt-0.5 shrink-0">
              <MapPin size={14} color="#6B7280" />
            </View>
            <View className="flex-1">
              {geocoding ? (
                <View className="flex-row items-center gap-x-1.5">
                  <ActivityIndicator size="small" color="#9CA3AF" />
                  <Text className="text-[12px] text-slate-400">
                    {t('emergency.evacuation.fetchingAddress')}
                  </Text>
                </View>
              ) : geocoded?.display ? (
                <Text className="text-[12px] text-slate-600 leading-[18px]">
                  {geocoded.display}
                </Text>
              ) : (
                <Text className="text-[12px] text-slate-400 italic">
                  {t('emergency.evacuation.addressUnavailable')}
                </Text>
              )}
            </View>
          </View>

          {/* ── View all on map / Get Route button ── */}
          {valid && (
            <>
              <View className="h-px bg-slate-100" />
              <TouchableOpacity
                onPress={() => setRouteOpen(true)}
                className="flex-row items-center justify-center gap-x-2 bg-emerald-600 rounded-xl py-3.5"
                activeOpacity={0.85}
              >
                <Navigation size={15} color="#fff" />
                <Text className="text-[14px] font-bold text-white">
                  {centers.length > 1
                    ? t('emergency.evacuation.viewAllOnMap', { defaultValue: 'View All on Map' })
                    : t('emergency.evacuation.getRoute')}
                </Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>

      {/* ── Fullscreen route modal — gets ALL centers, not just the preview one ── */}
      <EvacuationRouteModal
        visible={routeOpen}
        onClose={() => setRouteOpen(false)}
        areaLabel={areaLabel}
        centers={centers}
        userLat={userLatitude}
        userLng={userLongitude}
      />
    </>
  );
};