/**
 * EvacuationCentersOverviewMap
 *
 * Single, shared preview map for the whole evacuation-centers list.
 * Shows every center as a numbered pin (+ the user's location if known).
 * Non-interactive — tapping anywhere opens the fullscreen EvacuationRouteModal
 * where actual routing happens.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Maximize2, MapPinned } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { isValidCoordinate } from '@/hooks/general/useReverseGeocode';
import { EvacuationCenter } from '@/constants/emergency/evacuation';

interface EvacuationCentersOverviewMapProps {
  centers: EvacuationCenter[];
  userLatitude?: number | null;
  userLongitude?: number | null;
  onPress: () => void;
  height?: number;
}

function buildOverviewHtml(
  centers: EvacuationCenter[],
  userLat: number | null,
  userLng: number | null,
): string {
  const validCenters = centers.filter((c) => isValidCoordinate(c.latitude, c.longitude));

  const hasUser =
    userLat !== null && userLng !== null && isValidCoordinate(userLat, userLng);

  const destinations = validCenters.map((c, i) => ({
    n: i + 1,
    name: c.name,
    lat: c.latitude,
    lng: c.longitude,
  }));

  const fallbackLat = destinations[0]?.lat ?? userLat ?? 0;
  const fallbackLng = destinations[0]?.lng ?? userLng ?? 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#F1F5F9; }
    .pin {
      width:24px;height:24px;border-radius:50% 50% 50% 0;
      background:#059669;border:2px solid #fff;
      transform: rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    }
    .pin span { transform: rotate(45deg); color:#fff; font-weight:800; font-size:11px; font-family:-apple-system,sans-serif; }
    .userDot {
      width:16px;height:16px;border-radius:50%;
      background:#2563EB;border:3px solid #fff;
      box-shadow:0 0 0 4px rgba(37,99,235,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: false,
    }).setView([${fallbackLat}, ${fallbackLng}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const destinations = ${JSON.stringify(destinations)};
    const bounds = [];

    destinations.forEach(d => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="pin"><span>' + d.n + '</span></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });
      L.marker([d.lat, d.lng], { icon }).addTo(map);
      bounds.push([d.lat, d.lng]);
    });

    ${
      hasUser
        ? `
    const userIcon = L.divIcon({ className: '', html: '<div class="userDot"></div>', iconSize: [16,16], iconAnchor: [8,8] });
    L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map);
    bounds.push([${userLat}, ${userLng}]);
    `
        : ''
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }

    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'mapLoaded' })
    );
  </script>
</body>
</html>`;
}

export const EvacuationCentersOverviewMap: React.FC<EvacuationCentersOverviewMapProps> = ({
  centers,
  userLatitude,
  userLongitude,
  onPress,
  height = 200,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const html = useMemo(
    () => buildOverviewHtml(centers, userLatitude ?? null, userLongitude ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centers, userLatitude, userLongitude],
  );

  if (centers.length === 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel={t('emergency.evacuation.viewAllRoutes', { defaultValue: 'View all routes' })}
      className="rounded-2xl overflow-hidden mb-4 bg-slate-100"
      style={{
        height,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        pointerEvents="none"
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onMessage={() => setLoading(false)}
        onError={() => setLoading(false)}
      />

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-slate-100">
          <ActivityIndicator size="small" color="#059669" />
        </View>
      )}

      {/* Count badge */}
      <View className="absolute top-2.5 left-2.5 bg-white/90 rounded-full px-2.5 py-1 flex-row items-center gap-x-1">
        <MapPinned size={12} color="#059669" />
        <Text className="text-[11px] font-bold text-emerald-700">
          {t('emergency.evacuation.centersCount', {
            count: centers.length,
            defaultValue: `${centers.length} center${centers.length === 1 ? '' : 's'}`,
          })}
        </Text>
      </View>

      {/* View all routes pill */}
      <View className="absolute bottom-2.5 right-2.5 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center gap-x-1.5">
        <Maximize2 size={11} color="#fff" />
        <Text className="text-white text-[11px] font-bold tracking-wide">
          {t('emergency.evacuation.viewAllRoutes', { defaultValue: 'View All Routes' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};