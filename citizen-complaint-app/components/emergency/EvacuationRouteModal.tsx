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

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { X, Building2, WifiOff, RefreshCw } from 'lucide-react-native';
import { isValidCoordinate } from '@/hooks/general/useReverseGeocode';
import { THEME } from '@/constants/theme';

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
  const hasUser =
    userLat !== null &&
    userLng !== null &&
    isValidCoordinate(userLat!, userLng!);

  const viewLat = hasUser ? (userLat! + destLat) / 2 : destLat;
  const viewLng = hasUser ? (userLng! + destLng) / 2 : destLng;
  const zoom = hasUser ? 13 : 15;

  const userMarkerJs = hasUser
    ? `
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
  `
    : '';

  const routeJs = hasUser
    ? `
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
        if (!data.routes || data.routes.length === 0) { showNoRoute(); return; }

        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const polyline = L.polyline(coords, {
          color: '#DC2626',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [48, 48] });

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
  `
    : `
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

  <div id="status" class="overlay">
    <div class="spinner"></div>
    <span style="color:#475569;font-weight:600;">Finding best route…</span>
  </div>

  <div id="routeChip" class="overlay"></div>

  <div id="noRoute" class="overlay">⚠️ Route unavailable — navigate manually</div>
  <div id="noUser"  class="overlay">📍 Enable location to see route</div>

  <script>
    const map = L.map('map', { zoomControl: true }).setView([${viewLat}, ${viewLng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

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

    // Notify RN that the map loaded successfully
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'mapLoaded' })
    );
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

  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  const html = useMemo(
    () =>
      buildMapHtml(
        centerName,
        centerLat,
        centerLng,
        userLat ?? null,
        userLng ?? null,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centerName, centerLat, centerLng, userLat, userLng, webViewKey],
  );

  // Reset state whenever the modal opens or is retried
  useEffect(() => {
    if (visible) {
      setMapError(false);
      setMapLoading(true);
    }
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [visible, webViewKey]);

  // 12-second timeout — if mapLoaded never fires, show the error screen
  useEffect(() => {
    if (mapLoading && !mapError) {
      loadTimeoutRef.current = setTimeout(() => {
        setMapLoading(false);
        setMapError(true);
      }, 12_000);
    } else {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  }, [mapLoading, mapError]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapLoaded') {
        setMapLoading(false);
        setMapError(false);
      }
    } catch (_) {}
  }, []);

  const handleWebViewError = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    setMapLoading(false);
    setMapError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(false);
    setMapLoading(true);
    setWebViewKey((k) => k + 1); // remounts the WebView
  }, []);

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

      {/* ── Map area ── */}
      <View style={styles.mapArea}>
        {/* WebView — always mounted so it can load in background */}
        <WebView
          key={webViewKey}
          ref={webViewRef}
          style={[styles.webview, mapError && styles.hidden]}
          source={{ html }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
        />

        {/* Loading overlay */}
        {mapLoading && !mapError && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loadingText}>
              {t('emergency.evacuation.routeModal.loadingMap')}
            </Text>
          </View>
        )}

        {/* Error / retry overlay */}
        {mapError && (
          <View style={styles.overlay}>
            <WifiOff size={48} color={THEME.primary} style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Map failed to load</Text>
            <Text style={styles.errorSubtitle}>
              Check your connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.retryButtonText}>Reload Map</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  mapArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  webview: {
    flex: 1,
  },
  hidden: {
    // Keep WebView mounted but invisible during error so retry remount is clean
    opacity: 0,
    position: 'absolute',
    width: 0,
    height: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  errorIcon: {
    marginBottom: 16,
    opacity: 0.85,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});