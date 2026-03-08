/**
 * EvacuationRouteModal
 *
 * Fullscreen modal that renders a Leaflet map (via WebView) showing:
 *  - User's current location as a blue pulsing marker
 *  - Evacuation center as a red marker
 *  - Best driving/walking route as a bold red polyline fetched from OSRM
 *
 * Algorithm: OSRM (Open Source Routing Machine)
 *  - Runs Contraction Hierarchies (CH) over the OSM road graph
 *  - Free, no API key required
 *  - Returns a GeoJSON LineString of road-snapped waypoints
 *  - We decode it in the WebView and draw it as a Leaflet polyline
 *
 * If no user location is available, only the destination marker is shown
 * with a notice instead of a route.
 */

import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { X, Navigation, Building2 } from 'lucide-react-native';
import { isValidCoordinate } from '@/hooks/general/useReverseGeocode';

interface EvacuationRouteModalProps {
  visible: boolean;
  onClose: () => void;
  centerName: string;
  centerLat: number;
  centerLng: number;
  userLat?: number | null;
  userLng?: number | null;
}

// ── Build the self-contained HTML page ───────────────────────────────────────
function buildMapHtml(
  centerName: string,
  destLat: number,
  destLng: number,
  userLat: number | null,
  userLng: number | null,
): string {
  const hasUser = userLat !== null && userLng !== null &&
    isValidCoordinate(userLat!, userLng!);

  // Initial view: center on destination, or midpoint if user known
  const viewLat = hasUser ? ((userLat! + destLat) / 2) : destLat;
  const viewLng = hasUser ? ((userLng! + destLng) / 2) : destLng;
  const zoom = hasUser ? 13 : 15;

  const userMarkerJs = hasUser ? `
    // ── User marker (blue pulse) ──
    const userIcon = L.divIcon({
      className: '',
      html: \`<div style="
        width:18px;height:18px;border-radius:50%;
        background:#2563EB;border:3px solid #fff;
        box-shadow:0 0 0 4px rgba(37,99,235,0.3);
        animation: pulse 1.8s ease-in-out infinite;
      "></div>\`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker([${userLat}, ${userLng}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');
  ` : '';

  const routeJs = hasUser ? `
    // ── Fetch OSRM route ──
    const statusEl = document.getElementById('status');
    statusEl.style.display = 'flex';

    const osrmUrl =
      'https://router.project-osrm.org/route/v1/driving/' +
      '${userLng},${userLat};' + ${destLng} + ',' + ${destLat} +
      '?overview=full&geometries=geojson';

    fetch(osrmUrl)
      .then(r => r.json())
      .then(data => {
        statusEl.style.display = 'none';

        if (!data.routes || data.routes.length === 0) {
          showNoRoute();
          return;
        }

        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        // Red route polyline
        const polyline = L.polyline(coords, {
          color: '#DC2626',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        // Fit map to route bounds with padding
        map.fitBounds(polyline.getBounds(), { padding: [48, 48] });

        // Route summary chip
        const km = (route.distance / 1000).toFixed(1);
        const mins = Math.round(route.duration / 60);
        const chip = document.getElementById('routeChip');
        chip.textContent = km + ' km · ~' + mins + ' min';
        chip.style.display = 'block';
      })
      .catch(() => {
        statusEl.style.display = 'none';
        showNoRoute();
      });

    function showNoRoute() {
      const el = document.getElementById('noRoute');
      if (el) el.style.display = 'flex';
    }
  ` : `
    // No user location — just show destination
    const el = document.getElementById('noUser');
    if (el) el.style.display = 'flex';
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }

    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0   rgba(37,99,235,0.5); }
      70%  { box-shadow: 0 0 0 10px rgba(37,99,235,0);   }
      100% { box-shadow: 0 0 0 0   rgba(37,99,235,0);   }
    }

    /* Floating overlays */
    .overlay {
      position: absolute;
      z-index: 1000;
      border-radius: 12px;
      font-family: -apple-system, sans-serif;
      font-size: 13px;
      pointer-events: none;
    }

    #status {
      top: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(255,255,255,0.95);
      padding: 8px 16px;
      display: none;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #E2E8F0;
      border-top-color: #2563EB;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    #routeChip {
      top: 12px; left: 50%; transform: translateX(-50%);
      background: #DC2626;
      color: #fff;
      font-weight: 700;
      padding: 7px 16px;
      display: none;
      box-shadow: 0 2px 12px rgba(220,38,38,0.4);
      white-space: nowrap;
    }

    #noRoute, #noUser {
      bottom: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(255,255,255,0.95);
      color: #64748B;
      padding: 10px 18px;
      display: none;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- Loading indicator -->
  <div id="status" class="overlay">
    <div class="spinner"></div>
    <span style="color:#475569;font-weight:600;">Finding best route…</span>
  </div>

  <!-- Route summary chip -->
  <div id="routeChip" class="overlay"></div>

  <!-- Fallbacks -->
  <div id="noRoute" class="overlay">⚠️ Route unavailable — navigate manually</div>
  <div id="noUser"  class="overlay">📍 Enable location to see route</div>

  <script>
    const map = L.map('map', { zoomControl: true }).setView([${viewLat}, ${viewLng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // ── Destination marker (red) ──
    const destIcon = L.divIcon({
      className: '',
      html: \`<div style="
        width:22px;height:22px;border-radius:50%;
        background:#DC2626;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(220,38,38,0.5);
      "></div>\`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([${destLat}, ${destLng}], { icon: destIcon })
      .addTo(map)
      .bindPopup('<b>${centerName.replace(/'/g, "\\'")}</b><br>Evacuation Center')
      .openPopup();

    ${userMarkerJs}
    ${routeJs}
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────

export const EvacuationRouteModal: React.FC<EvacuationRouteModalProps> = ({
  visible,
  onClose,
  centerName,
  centerLat,
  centerLng,
  userLat,
  userLng,
}) => {
  const { t } = useTranslation();

  const html = useMemo(
    () => buildMapHtml(
      centerName,
      centerLat,
      centerLng,
      userLat ?? null,
      userLng ?? null,
    ),
    // Recompute only when coords or name change, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centerName, centerLat, centerLng, userLat, userLng],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header bar ── */}
      <View
        className="bg-white border-b border-slate-200 px-4 pt-12 pb-3 flex-row items-center gap-x-3"
        style={{ zIndex: 10 }}
      >
        <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
          <Building2 size={16} color="#059669" />
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-bold text-slate-800" numberOfLines={1}>
            {centerName}
          </Text>
          <Text className="text-[11px] text-slate-400 font-medium">
            {t('emergency.evacuation.routeModal.subtitle')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
          hitSlop={12}
          activeOpacity={0.7}
        >
          <X size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* ── Legend strip ── */}
      <View className="bg-white px-4 py-2 flex-row items-center gap-x-4 border-b border-slate-100">
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-3 h-3 rounded-full bg-blue-600" />
          <Text className="text-[11px] text-slate-500 font-medium">
            {t('emergency.evacuation.routeModal.legendUser')}
          </Text>
        </View>
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-3 h-3 rounded-full bg-red-600" />
          <Text className="text-[11px] text-slate-500 font-medium">
            {t('emergency.evacuation.routeModal.legendDest')}
          </Text>
        </View>
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-8 h-1 rounded-full bg-red-600" />
          <Text className="text-[11px] text-slate-500 font-medium">
            {t('emergency.evacuation.routeModal.legendRoute')}
          </Text>
        </View>
      </View>

      {/* ── Map ── */}
      <WebView
        className="flex-1"
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center bg-slate-50 absolute inset-0">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-slate-400 text-[13px] mt-3">
              {t('emergency.evacuation.routeModal.loadingMap')}
            </Text>
          </View>
        )}
      />
    </Modal>
  );
};