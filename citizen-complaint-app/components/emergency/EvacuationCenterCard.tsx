/**
 * EvacuationCenterCard
 *
 * Distance badge now uses OSRM road distance — the same source as the
 * fullscreen route modal — so the numbers always match.
 * Falls back to Haversine only if the OSRM fetch fails.
 *
 * Layout is tightened so the building icon and name sit on the same
 * vertical centre line with no misalignment.
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

// ── OSRM road distance hook ───────────────────────────────────────────────────
interface OsrmResult {
  distanceKm: number;
  durationSecs: number;
}

function useOsrmDistance(
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  destLat: number,
  destLng: number,
): { data: OsrmResult | null; loading: boolean } {
  const [data, setData] = useState<OsrmResult | null>(null);
  const [loading, setLoading] = useState(false);

  const hasUser =
    userLat != null &&
    userLng != null &&
    isValidCoordinate(userLat, userLng) &&
    isValidCoordinate(destLat, destLng);

  useEffect(() => {
    if (!hasUser) return;

    let cancelled = false;
    setLoading(true);
    setData(null);

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${userLng},${userLat};${destLng},${destLat}` +
      `?overview=false`;

    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        const route = json?.routes?.[0];
        if (route) {
          setData({
            distanceKm: route.distance / 1000,
            durationSecs: route.duration,
          });
        } else {
          // OSRM gave no route — fall back to Haversine
          setData({
            distanceKm: haversineKm(userLat!, userLng!, destLat, destLng),
            durationSecs: 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            distanceKm: haversineKm(userLat!, userLng!, destLat, destLng),
            durationSecs: 0,
          });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLat, userLng, destLat, destLng, hasUser]);

  return { data, loading };
}

// ─────────────────────────────────────────────────────────────────────────────

interface EvacuationCenterCardProps {
  center: EvacuationCenter;
  userLatitude?: number | null;
  userLongitude?: number | null;
}

export const EvacuationCenterCard: React.FC<EvacuationCenterCardProps> = ({
  center,
  userLatitude,
  userLongitude,
}) => {
  const { t } = useTranslation();
  const [routeOpen, setRouteOpen] = useState(false);

  const lat = center.latitude;
  const lng = center.longitude;
  const valid = isValidCoordinate(lat, lng);

  const { geocoded, loading: geocoding } = useReverseGeocode(
    valid ? lat : null,
    valid ? lng : null,
  );

  // Road distance from OSRM — same source as the route modal
  const { data: osrm, loading: distLoading } = useOsrmDistance(
    userLatitude, userLongitude, lat, lng,
  );

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
            <MapDisplay latitude={lat} longitude={lng} zoom={16} height={170} />

            {/* "View Route" pill — bottom-right of map */}
            <View className="absolute bottom-2.5 right-2.5 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center gap-x-1.5">
              <Maximize2 size={11} color="#fff" />
              <Text className="text-white text-[11px] font-bold tracking-wide">
                {t('emergency.evacuation.viewRoute')}
              </Text>
            </View>
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

          {/* ── Name row ── */}
          <View className="flex-row items-center gap-x-3">
            {/* Icon — vertically centred with items-center on the row */}
            <View className="w-9 h-9 rounded-full bg-emerald-100 items-center justify-center shrink-0">
              <Building2 size={18} color="#059669" />
            </View>

            {/* Name — flex-1 so it fills space and wraps if long */}
            <Text
              className="flex-1 text-[15px] font-bold text-slate-800 leading-5"
              numberOfLines={2}
            >
              {center.name}
            </Text>
          </View>

          {/* ── Distance + ETA row ── */}
          {(distLoading || osrm) && (
            <View className="flex-row items-center gap-x-2 pl-12">
              {distLoading ? (
                <View className="flex-row items-center gap-x-1.5">
                  <ActivityIndicator size="small" color="#059669" />
                  <Text className="text-[11px] text-slate-400">
                    {t('emergency.evacuation.calculatingRoute')}
                  </Text>
                </View>
              ) : osrm ? (
                <>
                  {/* Road distance badge */}
                  <View className="bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 flex-row items-center gap-x-1">
                    <Navigation size={11} color="#059669" />
                    <Text className="text-[11px] font-bold text-emerald-700">
                      {formatKm(osrm.distanceKm)} {t('emergency.evacuation.away')}
                    </Text>
                  </View>

                  {/* ETA badge (only if OSRM returned a real duration) */}
                  {osrm.durationSecs > 0 && (
                    <View className="bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 flex-row items-center gap-x-1">
                      <Clock size={11} color="#2563EB" />
                      <Text className="text-[11px] font-bold text-blue-700">
                        {formatMins(osrm.durationSecs)}
                      </Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          {/* Divider */}
          <View className="h-px bg-slate-100" />

          {/* ── Geocoded address ── */}
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

          {/* ── Coordinates ── */}
          <View className="flex-row items-center gap-x-3">
            <View className="w-9 items-center shrink-0">
              <Navigation size={13} color="#2563EB" />
            </View>
            <Text className="text-[11px] font-semibold text-blue-600 font-mono tracking-tight">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </Text>
          </View>

          {/* ── Get Route button ── */}
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
                  {t('emergency.evacuation.getRoute')}
                </Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>

      {/* ── Fullscreen route modal ── */}
      <EvacuationRouteModal
        visible={routeOpen}
        onClose={() => setRouteOpen(false)}
        centerName={center.name}
        centerLat={lat}
        centerLng={lng}
        userLat={userLatitude}
        userLng={userLongitude}
      />
    </>
  );
};