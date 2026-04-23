import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Navigation, X, Check, RefreshCw, WifiOff, Layers, Timer, AlertCircle } from 'lucide-react-native';
import { THEME } from '@/constants/theme';

interface LocationPickerProps {
  visible: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (latitude: number, longitude: number) => void;
  onCancel: () => void;
  title?: string;
}

const GPS_COOLDOWN_SECONDS = 30;

type GpsErrorType = 'permission_denied' | 'position_unavailable' | 'timeout' | 'unknown';

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

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  initialLatitude,
  initialLongitude,
  onConfirm,
  onCancel,
  title = 'Pin Your Location',
}) => {
  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLatitude ? parseFloat(initialLatitude.toString()) : 14.5995,
    longitude: initialLongitude ? parseFloat(initialLongitude.toString()) : 120.9842,
  });

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  // ── Reset state when modal opens ──
  useEffect(() => {
    if (visible) {
      setConfirming(false);
      setMapError(false);
      setLoading(true);
      setGpsError(null);
      setIsSatellite(false);

      if (initialLatitude && initialLongitude) {
        setSelectedLocation({
          latitude: parseFloat(initialLatitude.toString()),
          longitude: parseFloat(initialLongitude.toString()),
        });
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, initialLatitude, initialLongitude]);

  // ── Load timeout ──
  useEffect(() => {
    if (loading && !mapError) {
      loadTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setMapError(true);
      }, 10_000);
    } else {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  }, [loading, mapError]);

  // ── Sync satellite toggle to map ──
  useEffect(() => {
    if (!loading && !mapError) {
      webViewRef.current?.injectJavaScript(`setTileLayer(${isSatellite}); true;`);
    }
  }, [isSatellite, loading, mapError]);

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
    setLoading(true);
    setWebViewKey((k) => k + 1);
  }, []);

  const handleWebViewError = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    setLoading(false);
    setMapError(true);
  }, []);

  const getCurrentLocation = async () => {
    if (cooldownRemaining > 0 || gettingLocation) return;

    setGpsError(null);
    setGettingLocation(true);

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

      const newLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setSelectedLocation(newLocation);
      webViewRef.current?.injectJavaScript(
        `updateMapCenter(${newLocation.latitude}, ${newLocation.longitude}); true;`
      );

      startCooldown();
    } catch (error) {
      const errType = classifyLocationError(error);
      setGpsError(getGpsErrorMessage(errType));
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setSelectedLocation({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        });
      } else if (data.type === 'mapLoaded') {
        setLoading(false);
        setMapError(false);
      }
    } catch (_) {}
  };

  const handleConfirm = () => {
    setConfirming(true);
    onConfirm(selectedLocation.latitude, selectedLocation.longitude);
  };

  const isGpsDisabled = gettingLocation || cooldownRemaining > 0;
  const pinColor = THEME.primary;

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
          .custom-marker { background: none !important; border: none !important; }

          /* Attribution — required by ToS but styled to be minimal */
          .leaflet-control-attribution {
            font-size: 8px !important;
            background: rgba(255,255,255,0.55) !important;
            padding: 1px 4px !important;
            line-height: 1.2 !important;
            backdrop-filter: blur(2px);
          }
          .leaflet-control-attribution a { color: #666 !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // minZoom 10 = broad view; maxZoom 18 = avoids "Map data not available"
          const map = L.map('map', {
            zoomControl: true,
            minZoom: 10,
            maxZoom: 18,
          }).setView([${selectedLocation.latitude}, ${selectedLocation.longitude}], 15);

          // ── Satellite tile: ESRI World Imagery ──
          const satelliteTile = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { attribution: '© Esri, Maxar, Earthstar Geographics', maxZoom: 18 }
          );

          // ── Satellite labels overlay ──
          const labelsOverlay = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            { maxZoom: 18, opacity: 0.9 }
          );

          // ── Standard OSM ──
          const standardTile = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            { attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>', maxZoom: 18 }
          );

          // Start with standard
          standardTile.addTo(map);

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

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: \`
              <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
                <ellipse cx="20" cy="48" rx="8" ry="3" fill="rgba(0,0,0,0.18)"/>
                <path d="M20 0C11.716 0 5 6.716 5 15c0 8.284 15 33 15 33s15-24.716 15-33C35 6.716 28.284 0 20 0z"
                      fill="${pinColor}" stroke="white" stroke-width="1.5"/>
                <circle cx="20" cy="15" r="6" fill="white"/>
                <circle cx="20" cy="15" r="3" fill="${pinColor}"/>
              </svg>
            \`,
            iconSize: [40, 50],
            iconAnchor: [20, 50],
          });

          let marker = L.marker([${selectedLocation.latitude}, ${selectedLocation.longitude}], {
            draggable: true,
            icon: customIcon,
          }).addTo(map);

          function sendLocationToApp(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              latitude: lat,
              longitude: lng,
            }));
          }

          marker.on('dragend', function() {
            const p = marker.getLatLng();
            sendLocationToApp(p.lat, p.lng);
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendLocationToApp(e.latlng.lat, e.latlng.lng);
          });

          function updateMapCenter(lat, lng) {
            map.setView([lat, lng], 15, { animate: true });
            marker.setLatLng([lat, lng]);
            sendLocationToApp(lat, lng);
          }

          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapLoaded' }));
          sendLocationToApp(${selectedLocation.latitude}, ${selectedLocation.longitude});
        </script>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton} activeOpacity={0.7}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Tap on the map or drag the pin to select your location
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>

          {/* Loading overlay */}
          {loading && !mapError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={THEME.primary} />
              <Text style={styles.loadingText}>Loading map…</Text>
            </View>
          )}

          {/* Error overlay */}
          {mapError && (
            <View style={styles.errorOverlay}>
              <WifiOff size={48} color={THEME.primary} style={{ opacity: 0.85, marginBottom: 16 }} />
              <Text style={styles.errorTitle}>Map failed to load</Text>
              <Text style={styles.errorSubtitle}>
                Check your internet connection and try again.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Reload Map</Text>
              </TouchableOpacity>
            </View>
          )}

          <WebView
            key={webViewKey}
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHTML }}
            style={styles.webview}
            onMessage={handleMessage}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
          />

          {/* Coordinates badge */}
          {!loading && !mapError && (
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsLabel}>Selected Location</Text>
              <Text style={[styles.coordsText, { color: THEME.primary }]}>
                {selectedLocation.latitude.toFixed(6)},  {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Satellite toggle */}
          {!loading && !mapError && (
            <TouchableOpacity
              style={[styles.satelliteToggle, isSatellite && { backgroundColor: THEME.primary, borderColor: THEME.primary }]}
              onPress={() => setIsSatellite((v) => !v)}
              activeOpacity={0.85}
            >
              <Layers size={16} color={isSatellite ? '#fff' : THEME.primary} />
              <Text style={[styles.satelliteToggleText, { color: isSatellite ? '#fff' : THEME.primary }]}>
                {isSatellite ? 'Satellite' : 'Standard'}
              </Text>
            </TouchableOpacity>
          )}

          {/* GPS button */}
          {!mapError && (
            <TouchableOpacity
              style={[styles.currentLocationButton, isGpsDisabled && { opacity: 0.55 }]}
              onPress={getCurrentLocation}
              activeOpacity={0.8}
              disabled={isGpsDisabled}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color={THEME.primary} />
              ) : cooldownRemaining > 0 ? (
                <Timer size={22} color={THEME.primary} />
              ) : (
                <Navigation size={22} color={THEME.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom panel — errors + cooldown + footer */}
        <View style={styles.bottomPanel}>

          {/* GPS error banner */}
          {gpsError && (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color="#DC2626" />
              <Text style={styles.errorRowText}>{gpsError}</Text>
              <TouchableOpacity onPress={() => setGpsError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 14, color: '#DC2626', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cooldown notice */}
          {cooldownRemaining > 0 && (
            <View style={styles.cooldownRow}>
              <Timer size={13} color="#92400E" />
              <Text style={styles.cooldownText}>
                GPS available again in {cooldownRemaining}s
              </Text>
            </View>
          )}

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelButton}
              activeOpacity={0.8}
              disabled={confirming}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmButton, (confirming || mapError) && { opacity: 0.6 }]}
              activeOpacity={0.8}
              disabled={confirming || mapError}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check size={20} color="#fff" />
              )}
              <Text style={styles.confirmButtonText}>
                {confirming ? 'Confirming…' : 'Confirm Location'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: THEME.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  closeButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  coordsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  coordsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  satelliteToggle: {
    position: 'absolute',
    bottom: 90,
    right: 14,
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
  satelliteToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 14,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomPanel: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorRowText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 17,
  },
  cooldownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cooldownText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});