import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState, useEffect, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Navigation, LocateFixed, AlertCircle, Check, WifiOff, RefreshCw, Layers, Timer } from 'lucide-react-native';
import { StepDots } from './StepDots';
import { THEME } from '@/constants/theme';
import { complaintApiClient } from '@/lib/client/complaint';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
interface LocationStepProps {
  barangayName: string;
  barangayLat: number;
  barangayLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onBack: () => void;
}

const GPS_COOLDOWN_SECONDS = 30;

type GpsErrorType =
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'unknown';

function getGpsErrorMessage(type: GpsErrorType): string {
  switch (type) {
    case 'permission_denied':
      return 'Location permission denied. Please enable it in your device Settings.';
    case 'position_unavailable':
      return 'Your position could not be determined. Make sure GPS is enabled.';
    case 'timeout':
      return 'Location request timed out. Move to an open area and try again.';
    default:
      return 'Could not get your location. Please try again.';
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

export function LocationStep({ barangayName, barangayLat, barangayLng, onConfirm, onBack }: LocationStepProps) {
  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const { t } = useTranslation();
  const [webViewKey, setWebViewKey] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [pinned, setPinned] = useState<{ lat: number; lng: number }>({
    lat: barangayLat,
    lng: barangayLng,
  });
  const [locationMode, setLocationMode] = useState<'barangay' | 'gps' | 'pin'>('barangay');
  const [gettingGps, setGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cardAnim = useRef(new Animated.Value(1)).current;

  // ── Fetch location details + geometry ──
  const { data: locationDetails } = useQuery({
    queryKey: ['location-details', barangayLat, barangayLng, barangayName],
    queryFn: () =>
      complaintApiClient
        .get('/location-details', {
          params: {
            latitude: barangayLat,
            longitude: barangayLng,
            barangay_name: barangayName,
          },
        })
        .then((res) => res.data),
    staleTime: Infinity,
    retry: 2,
  });

  // ── Draw boundary once map + geometry ready ──
  useEffect(() => {
    if (mapReady && locationDetails?.geometry) {
      const geoJson = JSON.stringify(locationDetails.geometry);
      webViewRef.current?.injectJavaScript(`drawBoundary(${geoJson}); true;`);
    }
  }, [mapReady, locationDetails?.geometry]);

  // ── Load timeout ──
  useEffect(() => {
    if (!mapReady && !mapError) {
      loadTimeoutRef.current = setTimeout(() => setMapError(true), 10_000);
    } else {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [mapReady, mapError, webViewKey]);

  // ── Toggle tile layer ──
  useEffect(() => {
    if (mapReady) {
      webViewRef.current?.injectJavaScript(`setTileLayer(${is3D}); true;`);
    }
  }, [is3D, mapReady]);

  // ── Cooldown cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldownRemaining(GPS_COOLDOWN_SECONDS);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(false);
    setMapReady(false);
    setWebViewKey((k) => k + 1);
  }, []);

  const handleWebViewError = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
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
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 12_000)
        ),
      ]);

      const { latitude, longitude } = loc.coords;
      setPinned({ lat: latitude, lng: longitude });
      setLocationMode('gps');
      webViewRef.current?.injectJavaScript(`movePin(${latitude}, ${longitude}, true); true;`);

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
      if (data.type === 'mapReady') {
        setMapReady(true);
        setMapError(false);
      } else if (data.type === 'pinMoved') {
        setPinned({ lat: data.lat, lng: data.lng });
        setLocationMode('pin');
        setGpsError(null);
        setBoundaryError(null);
      } else if (data.type === 'pinOutOfBounds') {
        setBoundaryError('Pin must be placed within the barangay boundary.');
      }
    } catch {}
  };

  const pinColor = THEME.primary;
  const isGpsDisabled = gettingGps || cooldownRemaining > 0;

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

          /* Make attribution tiny and unobtrusive — required by Leaflet ToS but can be styled */
          .leaflet-control-attribution {
            font-size: 8px !important;
            background: rgba(255,255,255,0.55) !important;
            padding: 1px 4px !important;
            line-height: 1.2 !important;
            backdrop-filter: blur(2px);
          }
          .leaflet-control-attribution a {
            color: #666 !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // minZoom 13 = can't zoom out too far; maxZoom 18 = avoids "Map data not available"
          const map = L.map('map', { zoomControl: true, minZoom: 13, maxZoom: 18 })
            .setView([${barangayLat}, ${barangayLng}], 16);

          // ── Satellite tile: ESRI World Imagery ──
          const satelliteTile = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution: '© Esri, Maxar, Earthstar Geographics',
              maxZoom: 18,
            }
          );

          // ── Satellite + labels overlay ──
          const labelsOverlay = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            { maxZoom: 18, opacity: 0.9 }
          );

          // ── Standard OSM tile ──
          const standardTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            maxZoom: 18,
          });

          // Start with satellite
          satelliteTile.addTo(map);
          labelsOverlay.addTo(map);

          function setTileLayer(useSatellite) {
            if (useSatellite) {
              map.removeLayer(standardTile);
              satelliteTile.addTo(map);
              labelsOverlay.addTo(map);
            } else {
              map.removeLayer(satelliteTile);
              map.removeLayer(labelsOverlay);
              standardTile.addTo(map);
            }
          }

          const pinIconHtml = \`
            <div style="position:relative;display:flex;align-items:center;justify-content:center;">
              <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:1;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
                <ellipse cx="18" cy="42" rx="7" ry="2.5" fill="rgba(0,0,0,0.18)"/>
                <path d="M18 0C10.268 0 4 6.268 4 14c0 7.732 14 30 14 30S32 21.732 32 14C32 6.268 25.732 0 18 0z"
                      fill="${pinColor}" stroke="white" stroke-width="1.5"/>
                <circle cx="18" cy="14" r="5.5" fill="white"/>
                <circle cx="18" cy="14" r="2.8" fill="${pinColor}"/>
              </svg>
            </div>
          \`;

          const pinIcon = L.divIcon({
            className: 'pin-icon',
            html: pinIconHtml,
            iconSize: [36, 44],
            iconAnchor: [18, 44],
          });

          let boundaryLayer = null;
          let boundaryPolygon = null;

          function drawBoundary(geoJson) {
            if (boundaryLayer) map.removeLayer(boundaryLayer);
            boundaryLayer = L.geoJSON(geoJson, {
              style: {
                color: '#DC2626',
                weight: 2.5,
                opacity: 0.85,
                fillColor: '#DC2626',
                fillOpacity: 0.07,
                dashArray: '6 4',
              }
            }).addTo(map);

            if (geoJson.type === 'Polygon') {
              boundaryPolygon = geoJson.coordinates[0];
            } else if (geoJson.type === 'MultiPolygon') {
              boundaryPolygon = geoJson.coordinates[0][0];
            } else if (geoJson.type === 'Feature') {
              const g = geoJson.geometry;
              if (g.type === 'Polygon') boundaryPolygon = g.coordinates[0];
              else if (g.type === 'MultiPolygon') boundaryPolygon = g.coordinates[0][0];
            }
          }

          function isInsideBoundary(lat, lng) {
            if (!boundaryPolygon) return true;
            let inside = false;
            const x = lng, y = lat;
            for (let i = 0, j = boundaryPolygon.length - 1; i < boundaryPolygon.length; j = i++) {
              const xi = boundaryPolygon[i][0], yi = boundaryPolygon[i][1];
              const xj = boundaryPolygon[j][0], yj = boundaryPolygon[j][1];
              const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
            }
            return inside;
          }

          function sendPin(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pinMoved', lat, lng }));
          }

          function sendOutOfBounds(prevLat, prevLng) {
            marker.setLatLng([prevLat, prevLng]);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pinOutOfBounds' }));
          }

          let lastValidLat = ${barangayLat};
          let lastValidLng = ${barangayLng};

          let marker = L.marker([${barangayLat}, ${barangayLng}], { draggable: true, icon: pinIcon }).addTo(map);

          marker.on('dragend', function() {
            const p = marker.getLatLng();
            if (isInsideBoundary(p.lat, p.lng)) {
              lastValidLat = p.lat;
              lastValidLng = p.lng;
              sendPin(p.lat, p.lng);
            } else {
              sendOutOfBounds(lastValidLat, lastValidLng);
            }
          });

          map.on('click', function(e) {
            if (isInsideBoundary(e.latlng.lat, e.latlng.lng)) {
              marker.setLatLng(e.latlng);
              lastValidLat = e.latlng.lat;
              lastValidLng = e.latlng.lng;
              sendPin(e.latlng.lat, e.latlng.lng);
            } else {
              sendOutOfBounds(lastValidLat, lastValidLng);
            }
          });

          function movePin(lat, lng, recenter) {
            if (isInsideBoundary(lat, lng)) {
              marker.setLatLng([lat, lng]);
              lastValidLat = lat;
              lastValidLng = lng;
              if (recenter) map.setView([lat, lng], 17, { animate: true });
              sendPin(lat, lng);
            } else {
              sendOutOfBounds(lastValidLat, lastValidLng);
            }
          }

          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
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

        {/* Loading overlay */}
        {!mapReady && !mapError && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={{ marginTop: 10, fontSize: 13, color: '#94A3B8' }}>{t('location_step.loading_map')}</Text>
          </View>
        )}

        {/* Error / retry overlay */}
        {mapError && (
          <View style={styles.mapOverlay}>
            <WifiOff size={44} color={THEME.primary} style={{ opacity: 0.85, marginBottom: 14 }} />
            <Text style={styles.errorTitle}>{t('location_step.map_error_title')}</Text>
            <Text style={styles.errorSubtitle}>{t('location_step.map_error_desc')}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: THEME.primary }]}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.retryButtonText}>{t('location_step.reload_map')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coordinates badge */}
        {mapReady && !mapError && (
          <Animated.View style={[styles.coordsBadge, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          }]}>
            <Navigation size={11} color={THEME.primary} />
            <Text style={[styles.coordsText, { color: THEME.primary }]}>
              {pinned.lat.toFixed(6)},  {pinned.lng.toFixed(6)}
            </Text>
            {locationMode === 'gps' && (
              <View style={[styles.modeBadge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.modeBadgeText, { color: '#16A34A' }]}>GPS</Text>
              </View>
            )}
            {locationMode === 'barangay' && (
              <View style={[styles.modeBadge, { backgroundColor: `${THEME.primary}20` }]}>
                <Text style={[styles.modeBadgeText, { color: THEME.primary }]}>BRY</Text>
              </View>
            )}
            {locationMode === 'pin' && (
              <View style={[styles.modeBadge, { backgroundColor: '#FEF9C3' }]}>
                <Text style={[styles.modeBadgeText, { color: '#A16207' }]}>PIN</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Terrain Toggle Button */}
        {mapReady && !mapError && (
          <TouchableOpacity
            style={[
              styles.terrainToggle,
              is3D && { backgroundColor: THEME.primary, borderColor: THEME.primary },
            ]}
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

        {/* Error banners */}
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

        {/* Cooldown notice */}
        {cooldownRemaining > 0 && (
          <View style={styles.cooldownRow}>
            <Timer size={13} color="#92400E" />
            <Text style={styles.cooldownText}>
              {t('location_step.gps_cooldown', { seconds: cooldownRemaining })}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            style={[
              styles.actionButton,
              { flex: 1, backgroundColor: `${THEME.primary}15`, borderColor: `${THEME.primary}40` },
              isGpsDisabled && styles.disabledButton,
            ]}
            activeOpacity={0.8}
            disabled={isGpsDisabled}
          >
            {gettingGps ? (
              <ActivityIndicator size="small" color={THEME.primary} />
            ) : cooldownRemaining > 0 ? (
              <Timer size={16} color={THEME.primary} style={{ opacity: 0.5 }} />
            ) : (
              <LocateFixed size={16} color={THEME.primary} />
            )}
            <Text style={[styles.actionButtonText, { color: isGpsDisabled ? `${THEME.primary}60` : THEME.primary }]}>
              {gettingGps ? t('location_step.gps_getting') : cooldownRemaining > 0 ? t('location_step.gps_wait', { seconds: cooldownRemaining }) : t('location_step.gps_button')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetToBarangay}
            style={[
              styles.actionButton,
              { flex: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
            ]}
            activeOpacity={0.8}
          >
            <MapPin size={16} color="#16A34A" />
            <Text style={[styles.actionButtonText, { color: '#16A34A' }]}>
              {t('location_step.barangay_pin')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>{t('location_step.or_hint')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          onPress={() => onConfirm(pinned.lat, pinned.lng)}
          style={[styles.confirmButton, { backgroundColor: THEME.primary, shadowColor: THEME.primary }, mapError && { opacity: 0.5 }]}
          activeOpacity={0.85}
          disabled={mapError}
        >
          <Check size={18} color="#ffffff" />
          <Text style={styles.confirmButtonText}>{t('location_step.confirm_location')}</Text>
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
  terrainToggle: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
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
  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});