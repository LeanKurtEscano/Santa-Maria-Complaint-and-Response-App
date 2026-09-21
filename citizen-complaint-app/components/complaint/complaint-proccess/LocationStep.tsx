import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState, useEffect, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Navigation, LocateFixed, AlertCircle, Check, WifiOff, RefreshCw, Layers, Timer, ShieldAlert } from 'lucide-react-native';
import { StepDots } from './StepDots';
import { THEME } from '@/constants/theme';
import { complaintApiClient } from '@/lib/client/complaint';
import { userApiClient } from '@/lib/client/user';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/store/useCurrentUserStore';

interface LocationStepProps {
  barangayName: string;
  barangayLat: number;
  barangayLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onBack: () => void;
}

const GPS_COOLDOWN_SECONDS = 30;

// Flip to false once you've confirmed the map loads reliably. While true,
// every message coming out of the WebView (mapReady, tile errors, drawBoundary
// calls, JS exceptions, etc.) gets printed to the RN console with a [MapWebView] tag.
const DEBUG_MAP = true;

type GpsErrorType = 'permission_denied' | 'position_unavailable' | 'timeout' | 'unknown';

function getGpsErrorMessage(type: GpsErrorType): string {
  switch (type) {
    case 'permission_denied': return 'Location permission denied. Please enable it in your device Settings.';
    case 'position_unavailable': return 'Your position could not be determined. Make sure GPS is enabled.';
    case 'timeout': return 'Location request timed out. Move to an open area and try again.';
    default: return 'Could not get your location. Please try again.';
  }
}

function classifyLocationError(error: unknown): GpsErrorType {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('permission') || msg.includes('denied')) return 'permission_denied';
    if (msg.includes('unavailable') || msg.includes('disabled')) return 'position_unavailable';
    if (msg.includes('timeout') || msg.includes('timed')) return 'timeout';
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as any).code;
    if (code === 1) return 'permission_denied';
    if (code === 2) return 'position_unavailable';
    if (code === 3) return 'timeout';
  }
  return 'unknown';
}

function isPointInPolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  const x = lng, y = lat;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function extractRings(geometry: any): [number, number][][] {
  if (!geometry) return [];
  const g = geometry.type === 'Feature' ? geometry.geometry : geometry;
  if (g.type === 'Polygon') return [g.coordinates[0]];
  if (g.type === 'MultiPolygon') return g.coordinates.map((p: any) => p[0]);
  return [];
}

function isInsideAnyRing(lat: number, lng: number, rings: [number, number][][]): boolean {
  if (rings.length === 0) return true; // geometry not loaded yet → don't block
  return rings.some((ring) => isPointInPolygon(lat, lng, ring));
}

export function LocationStep({ barangayName, barangayLat, barangayLng, onConfirm, onBack }: LocationStepProps) {
  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useTranslation();

  const { userData, fetchCurrentUser } = useCurrentUser();

  const [webViewKey, setWebViewKey] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [pinned, setPinned] = useState<{ lat: number; lng: number }>({ lat: barangayLat, lng: barangayLng });
  const [locationMode, setLocationMode] = useState<'barangay' | 'gps' | 'pin'>('barangay');
  const [gettingGps, setGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cardAnim = useRef(new Animated.Value(1)).current;

  // ── Background location update state ──
  const [syncingLocation, setSyncingLocation] = useState(true); // true while mount fetch is in-flight
  const [userOutsideBoundary, setUserOutsideBoundary] = useState(false);

  // ── Fetch boundary geometry ──
  const { data: locationDetails } = useQuery({
    queryKey: ['location-details', barangayLat, barangayLng, barangayName],
    queryFn: () =>
      complaintApiClient
        .get('/location-details', { params: { latitude: barangayLat, longitude: barangayLng, barangay_name: barangayName } })
        .then((res) => res.data),
    staleTime: Infinity,
    retry: 2,
  });

  const boundaryRings = extractRings(locationDetails?.geometry ?? null);

  if (DEBUG_MAP) {
    // eslint-disable-next-line no-console
    console.log('[MapWebView][RN] locationDetails geometry present:', !!locationDetails?.geometry, 'rings:', boundaryRings.length);
  }

  // ── Re-check boundary whenever userData location or geometry changes ──
  useEffect(() => {
    if (!userData?.latitude || !userData?.longitude) return;
    const outside = !isInsideAnyRing(
      parseFloat(userData.latitude),
      parseFloat(userData.longitude),
      boundaryRings
    );
    setUserOutsideBoundary(outside);
  }, [userData?.latitude, userData?.longitude, locationDetails?.geometry]);

  // ── On mount: silently get GPS → update backend → refresh userData ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Check permission without prompting
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Can't get location silently — use whatever is in userData already
          setSyncingLocation(false);
          return;
        }

        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12_000)),
        ]);

        if (cancelled) return;

        const { latitude, longitude } = loc.coords;

        // Silently update backend location
        await userApiClient.put('/update-current-location', {
          latitude: String(latitude),
          longitude: String(longitude),
        });

        // Refresh userData so boundary check uses fresh coords
        await fetchCurrentUser(true);

      } catch (err) {
        if (DEBUG_MAP) {
          // eslint-disable-next-line no-console
          console.log('[MapWebView][RN] silent GPS sync failed:', err);
        }
        // Silent failure — never surface this error to the user
      } finally {
        if (!cancelled) setSyncingLocation(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Draw boundary once map + geometry ready ──
  useEffect(() => {
    if (mapReady && locationDetails?.geometry) {
      const geoJson = JSON.stringify(locationDetails.geometry);
      if (DEBUG_MAP) {
        // eslint-disable-next-line no-console
        console.log('[MapWebView][RN] injecting drawBoundary, geometry type:', locationDetails.geometry?.type);
      }
      webViewRef.current?.injectJavaScript(`drawBoundary(${geoJson}); true;`);
    }
  }, [mapReady, locationDetails?.geometry]);

  // ── Load timeout ──
  useEffect(() => {
    if (!mapReady && !mapError) {
      loadTimeoutRef.current = setTimeout(() => {
        if (DEBUG_MAP) {
          // eslint-disable-next-line no-console
          console.log('[MapWebView][RN] 10s load timeout fired — no mapReady message was ever received from the WebView.');
        }
        setMapError(true);
      }, 10_000);
    } else {
      if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null; }
    }
    return () => { if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current); };
  }, [mapReady, mapError, webViewKey]);

  // ── Toggle tile layer ──
  useEffect(() => {
    if (mapReady) webViewRef.current?.injectJavaScript(`setTileLayer(${is3D}); true;`);
  }, [is3D, mapReady]);

  // ── Cleanup ──
  useEffect(() => {
    return () => { if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current); };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldownRemaining(GPS_COOLDOWN_SECONDS);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) { if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(false);
    setMapReady(false);
    setWebViewKey((k) => k + 1);
  }, []);

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    if (DEBUG_MAP) {
      // eslint-disable-next-line no-console
      console.log('[MapWebView][RN] onError/onHttpError fired:', syntheticEvent?.nativeEvent);
    }
    if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null; }
    setMapError(true);
  }, []);

  const handleResetToBarangay = () => {
    setGpsError(null);
    setBoundaryError(null);
    setPinned({ lat: barangayLat, lng: barangayLng });
    setLocationMode('barangay');
    webViewRef.current?.injectJavaScript(`movePin(${barangayLat}, ${barangayLng}, true); true;`);
  };

  const handleUseCurrentLocation = async () => {
    if (cooldownRemaining > 0 || gettingGps) return;
    setGpsError(null);
    setBoundaryError(null);
    setGettingGps(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError(getGpsErrorMessage('permission_denied'));
        return;
      }

      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12_000)),
      ]);

      const { latitude, longitude } = loc.coords;

      // Update pin
      setPinned({ lat: latitude, lng: longitude });
      setLocationMode('gps');
      webViewRef.current?.injectJavaScript(`movePin(${latitude}, ${longitude}, true); true;`);

      // Also silently update backend + refresh userData (updates boundary check too)
      try {
        await userApiClient.put('/update-current-location', {
          latitude: String(latitude),
          longitude: String(longitude),
        });
        await fetchCurrentUser(true);
      } catch (err) {
        if (DEBUG_MAP) {
          // eslint-disable-next-line no-console
          console.log('[MapWebView][RN] backend location sync failed after GPS button:', err);
        }
        // Silent — don't block the GPS pin update if sync fails
      }

      startCooldown();
    } catch (error) {
      const errType = classifyLocationError(error);
      setGpsError(getGpsErrorMessage(errType));
    } finally {
      setGettingGps(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (DEBUG_MAP && data.type !== 'debug') {
        // eslint-disable-next-line no-console
        console.log('[MapWebView][RN] message:', data);
      }

      if (data.type === 'mapReady') {
        setMapReady(true);
        setMapError(false);
      } else if (data.type === 'pinMoved') {
        setPinned({ lat: data.lat, lng: data.lng });
        setLocationMode('pin');
        setGpsError(null);
        setBoundaryError(null);
      } else if (data.type === 'pinOutOfBounds') {
        setBoundaryError(t('location_step.outside_boundary_error'));
        setPinned({ lat: barangayLat, lng: barangayLng });
        setLocationMode('barangay');
      } else if (data.type === 'debug') {
        if (DEBUG_MAP) {
          // eslint-disable-next-line no-console
          console.log('[MapWebView]', data.message);
        }
      } else if (data.type === 'jsError') {
        // eslint-disable-next-line no-console
        console.warn('[MapWebView][JS ERROR]', data.message);
      }
    } catch (err) {
      if (DEBUG_MAP) {
        // eslint-disable-next-line no-console
        console.log('[MapWebView][RN] failed to parse message:', event?.nativeEvent?.data, err);
      }
    }
  }

  // ── Confirm disabled when: map error | still syncing | user outside boundary ──
  const isConfirmDisabled = mapError || syncingLocation || userOutsideBoundary;
  const isGpsDisabled = gettingGps || cooldownRemaining > 0;
  const pinColor =  '#16A34A';

  const mapHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; }
        #map { height: 100%; width: 100%; }
        .pin-icon { background: none !important; border: none !important; overflow: visible; }
        .leaflet-control-attribution { font-size: 8px !important; background: rgba(255,255,255,0.55) !important; padding: 1px 4px !important; line-height: 1.2 !important; backdrop-filter: blur(2px); }
        .leaflet-control-attribution a { color: #666 !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // ---------- debug helpers ----------
        function debugLog(msg) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: String(msg) }));
          } catch (e) { /* no-op if bridge not ready yet */ }
        }
        window.onerror = function (message, source, lineno, colno) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'jsError',
              message: message + ' (line ' + lineno + ':' + colno + ')'
            }));
          } catch (e) {}
        };

        debugLog('script start');

        // ---------- map + tiles ----------
        const map = L.map('map', { zoomControl: true, minZoom: 13, maxZoom: 18 })
          .setView([${barangayLat}, ${barangayLng}], 16);

        const MAPBOX_TOKEN = '${process.env.EXPO_PUBLIC_MAPBOX_TOKEN || ''}';

        if (!MAPBOX_TOKEN) {
          debugLog('WARNING: EXPO_PUBLIC_MAPBOX_TOKEN is empty/undefined — satellite tiles will fail, using OSM standard tiles instead');
        }

        const satelliteTile = L.tileLayer(
          'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=' + MAPBOX_TOKEN,
          { attribution: '© Mapbox © OpenStreetMap', maxZoom: 18, tileSize: 512, zoomOffset: -1 }
        );
        const standardTile = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>', maxZoom: 18 }
        );

        let readySent = false;
        function sendMapReady(reason) {
          if (readySent) return;
          readySent = true;
          debugLog('mapReady (' + reason + ')');
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
        }

        satelliteTile.on('load', function () { sendMapReady('satellite tiles loaded'); });
        standardTile.on('load', function () { sendMapReady('standard tiles loaded'); });

        satelliteTile.on('tileerror', function (e) {
          debugLog('satellite tileerror: ' + (e && e.error ? e.error.message : 'unknown') + ' — falling back to standard tiles');
          if (!readySent && map.hasLayer(satelliteTile)) {
            map.removeLayer(satelliteTile);
            if (!map.hasLayer(standardTile)) standardTile.addTo(map);
          }
        });
        standardTile.on('tileerror', function (e) {
          debugLog('standard tileerror: ' + (e && e.error ? e.error.message : 'unknown'));
        });

        if (MAPBOX_TOKEN) {
          satelliteTile.addTo(map);
        } else {
          standardTile.addTo(map);
        }

        // Fallback: never let the WebView hang forever even if a 'load' event never fires
        setTimeout(function () { sendMapReady('fallback timeout, 6s'); }, 6000);

        function setTileLayer(useSatellite) {
          debugLog('setTileLayer(' + useSatellite + ')');
          if (useSatellite && MAPBOX_TOKEN) {
            if (map.hasLayer(standardTile)) map.removeLayer(standardTile);
            if (!map.hasLayer(satelliteTile)) satelliteTile.addTo(map);
          } else {
            if (map.hasLayer(satelliteTile)) map.removeLayer(satelliteTile);
            if (!map.hasLayer(standardTile)) standardTile.addTo(map);
          }
        }

        // ---------- pin marker ----------
        function pinIconHtml(color) {
          return '<svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M18 0C8 0 0 8 0 18c0 13 18 30 18 30s18-17 18-30C36 8 28 0 18 0z" fill="' + color + '"/>' +
            '<circle cx="18" cy="18" r="7" fill="#ffffff"/>' +
            '</svg>';
        }

        const pinDivIcon = L.divIcon({
          className: 'pin-icon',
          html: pinIconHtml('${pinColor}'),
          iconSize: [36, 48],
          iconAnchor: [18, 48],
        });

        const marker = L.marker([${barangayLat}, ${barangayLng}], { icon: pinDivIcon, draggable: true }).addTo(map);

        // ---------- boundary ----------
        let boundaryRings = []; // array of rings, each ring = array of [lng, lat] (GeoJSON order)
        let boundaryLayer = null;

        function extractRingsJS(geometry) {
          if (!geometry) return [];
          const g = geometry.type === 'Feature' ? geometry.geometry : geometry;
          if (!g) return [];
          if (g.type === 'Polygon') return [g.coordinates[0]];
          if (g.type === 'MultiPolygon') return g.coordinates.map(function (p) { return p[0]; });
          return [];
        }

        function isPointInPolygonJS(lat, lng, ring) {
          let inside = false;
          const x = lng, y = lat;
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
          }
          return inside;
        }

        function isInsideBoundary(lat, lng) {
          if (boundaryRings.length === 0) return true; // not loaded yet — don't block
          return boundaryRings.some(function (ring) { return isPointInPolygonJS(lat, lng, ring); });
        }

        function drawBoundary(geometry) {
          try {
            debugLog('drawBoundary called, type=' + (geometry && geometry.type));
            if (boundaryLayer) {
              map.removeLayer(boundaryLayer);
              boundaryLayer = null;
            }
            boundaryRings = extractRingsJS(geometry);
            boundaryLayer = L.geoJSON(geometry, {
              style: {  color: '#EF4444',
  weight: 2.5,
   fillColor: '#EF4444',
  fillOpacity: 0.08 }
            }).addTo(map);
            debugLog('boundary drawn OK, rings=' + boundaryRings.length);
          } catch (e) {
            debugLog('drawBoundary ERROR: ' + e.message);
          }
        }

        // ---------- pin movement / interaction ----------
        function sendPinMoved(lat, lng) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pinMoved', lat: lat, lng: lng }));
        }
        function sendPinOutOfBounds() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pinOutOfBounds' }));
        }

        marker.on('dragend', function (e) {
          const pos = e.target.getLatLng();
          if (!isInsideBoundary(pos.lat, pos.lng)) {
            debugLog('drag ended OUTSIDE boundary at ' + pos.lat + ',' + pos.lng + ' — snapping back');
            marker.setLatLng([${barangayLat}, ${barangayLng}]);
            sendPinOutOfBounds();
          } else {
            sendPinMoved(pos.lat, pos.lng);
          }
        });

        map.on('click', function (e) {
          const lat = e.latlng.lat, lng = e.latlng.lng;
          if (!isInsideBoundary(lat, lng)) {
            debugLog('map click OUTSIDE boundary at ' + lat + ',' + lng);
            sendPinOutOfBounds();
            return;
          }
          marker.setLatLng([lat, lng]);
          sendPinMoved(lat, lng);
        });

        function movePin(lat, lng, recenter) {
          marker.setLatLng([lat, lng]);
          if (recenter) map.setView([lat, lng], map.getZoom());
        }

        debugLog('script end, map + marker initialized');
      </script>
    </body>
  </html>
`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: `${THEME.primary}15` }]} activeOpacity={0.7}>
          <ArrowLeft size={22} color={THEME.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('location_step.title')}</Text>
          <Text style={[styles.headerSub, { color: THEME.primary }]} numberOfLines={1}>{barangayName}</Text>
        </View>
        <StepDots current={3} />
      </View>

      {/* Instruction strip */}
      <View style={styles.strip}>
        <MapPin size={13} color="#4B5563" />
        <Text style={styles.stripText}>{t('location_step.instruction')}</Text>
      </View>

      {/* Map */}
      <View style={{ flex: 1, position: 'relative' }}>
        <WebView
          key={webViewKey}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHTML }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
          javaScriptEnabled
          domStorageEnabled
        />

        {!mapReady && !mapError && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={{ marginTop: 10, fontSize: 13, color: '#94A3B8' }}>{t('location_step.loading_map')}</Text>
          </View>
        )}

        {mapError && (
          <View style={styles.mapOverlay}>
            <WifiOff size={44} color={THEME.primary} style={{ opacity: 0.85, marginBottom: 14 }} />
            <Text style={styles.errorTitle}>{t('location_step.map_error_title')}</Text>
            <Text style={styles.errorSubtitle}>{t('location_step.map_error_desc')}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: THEME.primary }]} onPress={handleRetry} activeOpacity={0.8}>
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.retryButtonText}>{t('location_step.reload_map')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {mapReady && !mapError && (
          <Animated.View style={[styles.coordsBadge, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          }]}>
            <Navigation size={11} color={THEME.primary} />
            <Text style={[styles.coordsText, { color: THEME.primary }]}>
              {pinned.lat.toFixed(6)},  {pinned.lng.toFixed(6)}
            </Text>
            {locationMode === 'gps' && <View style={[styles.modeBadge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.modeBadgeText, { color: '#16A34A' }]}>GPS</Text></View>}
            {locationMode === 'barangay' && <View style={[styles.modeBadge, { backgroundColor: `${THEME.primary}20` }]}><Text style={[styles.modeBadgeText, { color: THEME.primary }]}>BRY</Text></View>}
            {locationMode === 'pin' && <View style={[styles.modeBadge, { backgroundColor: '#FEF9C3' }]}><Text style={[styles.modeBadgeText, { color: '#A16207' }]}>PIN</Text></View>}
          </Animated.View>
        )}

        {mapReady && !mapError && (
          <TouchableOpacity
            style={[styles.terrainToggle, is3D && { backgroundColor: THEME.primary, borderColor: THEME.primary }]}
            onPress={() => setIs3D((v) => !v)}
            activeOpacity={0.85}
          >
            <Layers size={16} color={is3D ? '#fff' : THEME.primary} />
            <Text style={[styles.terrainToggleText, { color: is3D ? '#fff' : THEME.primary }]}>
              {is3D ? 'Satellite' : 'Standard'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>

        {gpsError && (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color="#DC2626" />
            <Text style={styles.errorText}>{gpsError}</Text>
            <TouchableOpacity onPress={() => setGpsError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 14, color: '#DC2626', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {boundaryError && !gpsError && (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color="#DC2626" />
            <Text style={styles.errorText}>{boundaryError}</Text>
            <TouchableOpacity onPress={() => setBoundaryError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 14, color: '#DC2626', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {cooldownRemaining > 0 && (
          <View style={styles.cooldownRow}>
            <Timer size={13} color="#92400E" />
            <Text style={styles.cooldownText}>{t('location_step.gps_cooldown', { seconds: cooldownRemaining })}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            style={[styles.actionButton, { flex: 1, backgroundColor: `${THEME.primary}15`, borderColor: `${THEME.primary}40` }, isGpsDisabled && styles.disabledButton]}
            activeOpacity={0.8}
            disabled={isGpsDisabled}
          >
            {gettingGps ? <ActivityIndicator size="small" color={THEME.primary} /> : cooldownRemaining > 0 ? <Timer size={16} color={THEME.primary} style={{ opacity: 0.5 }} /> : <LocateFixed size={16} color={THEME.primary} />}
            <Text style={[styles.actionButtonText, { color: isGpsDisabled ? `${THEME.primary}60` : THEME.primary }]}>
              {gettingGps ? t('location_step.gps_getting') : cooldownRemaining > 0 ? t('location_step.gps_wait', { seconds: cooldownRemaining }) : t('location_step.gps_button')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetToBarangay}
            style={[styles.actionButton, { flex: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}
            activeOpacity={0.8}
          >
            <MapPin size={16} color="#16A34A" />
            <Text style={[styles.actionButtonText, { color: '#16A34A' }]}>{t('location_step.barangay_pin')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>{t('location_step.or_hint')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Outside boundary warning — shown above confirm button */}
        { userOutsideBoundary && !syncingLocation && (
          <View style={styles.outsideBoundaryBanner}>
            <ShieldAlert size={15} color="#991B1B" style={{ flexShrink: 0 }} />
            <Text style={styles.outsideBoundaryText}>
              {t('location_step.outside_boundary_warning', { barangayName, defaultValue: 'You must be physically present within {{barangayName}} to submit a complaint for this area.' })}
            </Text>
          </View>
        )}

        {/* Verifying strip — shown while background sync is in-flight */}
        {syncingLocation && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color={THEME.primary} style={{ transform: [{ scale: 0.75 }] }} />
            <Text style={styles.verifyingText}>{t('location_step.verifying_location', { defaultValue: 'Verifying your location…' })}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => onConfirm(pinned.lat, pinned.lng)}
          style={[
            styles.confirmButton,
            { backgroundColor: THEME.primary, shadowColor: THEME.primary },
            isConfirmDisabled && styles.confirmButtonDisabled,
          ]}
          activeOpacity={0.85}
          disabled={isConfirmDisabled}
        >
          {syncingLocation
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Check size={18} color="#ffffff" />
          }
          <Text style={styles.confirmButtonText}>
            {syncingLocation
              ? t('location_step.verifying_location', { defaultValue: 'Verifying location…' })
              : t('location_step.confirm_location')}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 1 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  stripText: { fontSize: 12, color: '#4B5563', flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', zIndex: 10, paddingHorizontal: 32 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 6, textAlign: 'center' },
  errorSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 22, lineHeight: 19 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  coordsBadge: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  coordsText: { flex: 1, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600' },
  modeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  modeBadgeText: { fontSize: 10, fontWeight: '700' },
  terrainToggle: { position: 'absolute', bottom: 16, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1.5, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  terrainToggleText: { fontSize: 12, fontWeight: '700' },
  bottomPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  errorText: { flex: 1, fontSize: 12, color: '#DC2626', lineHeight: 17 },
  cooldownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#FDE68A' },
  cooldownText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '500' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, borderWidth: 1.5 },
  actionButtonText: { fontSize: 12, fontWeight: '600' },
  disabledButton: { opacity: 0.55 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  outsideBoundaryBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#FECACA' },
  outsideBoundaryText: { flex: 1, fontSize: 12, color: '#991B1B', lineHeight: 18, fontWeight: '500' },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  verifyingText: { fontSize: 12, color: '#94A3B8' },
  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  confirmButtonDisabled: { opacity: 0.45, shadowOpacity: 0 },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});