import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Navigation, LocateFixed, AlertCircle, Check } from 'lucide-react-native';
import { StepDots } from './StepDots';

interface LocationStepProps {
  barangayName: string;
  barangayLat: number;
  barangayLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onBack: () => void;
}

export function LocationStep({ barangayName, barangayLat, barangayLng, onConfirm, onBack }: LocationStepProps) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  // Start pinned at barangay location by default
  const [pinned, setPinned] = useState<{ lat: number; lng: number }>({
    lat: barangayLat,
    lng: barangayLng,
  });
  const [locationMode, setLocationMode] = useState<'barangay' | 'gps' | 'pin'>('barangay');
  const [gettingGps, setGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const cardAnim = useRef(new Animated.Value(1)).current; // start visible

  const handleResetToBarangay = () => {
    setGpsError(null);
    setPinned({ lat: barangayLat, lng: barangayLng });
    setLocationMode('barangay');
    webViewRef.current?.injectJavaScript(
      `movePin(${barangayLat}, ${barangayLng}, true); true;`
    );
  };

  const handleUseCurrentLocation = async () => {
    setGpsError(null);
    setGettingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Location permission denied. Please enable it in Settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setPinned({ lat: latitude, lng: longitude });
      setLocationMode('gps');
      webViewRef.current?.injectJavaScript(`movePin(${latitude}, ${longitude}, true); true;`);
    } catch {
      setGpsError('Could not get your location. Please try again.');
    } finally {
      setGettingGps(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') setMapReady(true);
      else if (data.type === 'pinMoved') {
        setPinned({ lat: data.lat, lng: data.lng });
        setLocationMode('pin');
        setGpsError(null);
      }
    } catch {}
  };

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
          .leaflet-control-attribution { font-size: 9px !important; }
          .pin-icon { background: none !important; border: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: true })
            .setView([${barangayLat}, ${barangayLng}], 16);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          const pinIcon = L.divIcon({
            className: 'pin-icon',
            html: \`<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="18" cy="42" rx="7" ry="2.5" fill="rgba(0,0,0,0.18)"/>
              <path d="M18 0C10.268 0 4 6.268 4 14c0 7.732 14 30 14 30S32 21.732 32 14C32 6.268 25.732 0 18 0z"
                    fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
              <circle cx="18" cy="14" r="5.5" fill="white"/>
              <circle cx="18" cy="14" r="2.8" fill="#2563EB"/>
            </svg>\`,
            iconSize: [36, 44],
            iconAnchor: [18, 44],
          });

          function sendPin(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pinMoved', lat, lng }));
          }

          // Place pin at barangay location immediately on load
          let marker = L.marker([${barangayLat}, ${barangayLng}], { draggable: true, icon: pinIcon }).addTo(map);
          marker.on('dragend', function() {
            const p = marker.getLatLng();
            sendPin(p.lat, p.lng);
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendPin(e.latlng.lat, e.latlng.lng);
          });

          function movePin(lat, lng, recenter) {
            marker.setLatLng([lat, lng]);
            if (recenter) map.setView([lat, lng], 17, { animate: true });
            sendPin(lat, lng);
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1E40AF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Where did this happen?</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{barangayName}</Text>
        </View>
        <StepDots current={3} />
      </View>

      {/* Instruction strip */}
      <View style={styles.strip}>
        <MapPin size={13} color="#4B5563" />
        <Text style={styles.stripText}>Tap the map to place a pin, or use your current location</Text>
      </View>

      {/* Map */}
      <View style={{ flex: 1, position: 'relative' }}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHTML }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
        />

        {/* Loading overlay */}
        {!mapReady && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ marginTop: 10, fontSize: 13, color: '#94A3B8' }}>Loading map…</Text>
          </View>
        )}

        {/* Coordinates badge — always visible since pin is always placed */}
        <Animated.View style={[styles.coordsBadge, {
          opacity: cardAnim,
          transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        }]}>
          <Navigation size={11} color="#2563EB" />
          <Text style={styles.coordsText}>
            {pinned.lat.toFixed(6)},  {pinned.lng.toFixed(6)}
          </Text>
          {locationMode === 'gps' && (
            <View style={styles.gpsBadge}>
              <Text style={styles.gpsBadgeText}>GPS</Text>
            </View>
          )}
          {locationMode === 'barangay' && (
            <View style={[styles.gpsBadge, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.gpsBadgeText, { color: '#2563EB' }]}>BRY</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>

        {gpsError && (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color="#DC2626" />
            <Text style={styles.errorText}>{gpsError}</Text>
          </View>
        )}

        {/* Top row: GPS + Reset buttons side by side */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Use Current Location */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            style={[styles.gpsButton, { flex: 1 }, gettingGps && { opacity: 0.6 }]}
            activeOpacity={0.8}
            disabled={gettingGps}
          >
            {gettingGps
              ? <ActivityIndicator size="small" color="#2563EB" />
              : <LocateFixed size={16} color="#2563EB" />
            }
            <Text style={[styles.gpsButtonText, { fontSize: 12 }]}>
              {gettingGps ? 'Getting…' : 'My Location'}
            </Text>
          </TouchableOpacity>

          {/* Reset to Barangay */}
          <TouchableOpacity
            onPress={handleResetToBarangay}
            style={[styles.gpsButton, { flex: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}
            activeOpacity={0.8}
            disabled={locationMode === 'barangay'}
          >
            <MapPin size={16} color="#16A34A" />
            <Text style={[styles.gpsButtonText, { fontSize: 12, color: '#16A34A' }]}>
              Barangay Pin
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or tap / drag pin on map</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Confirm — always enabled since a pin is always placed */}
        <TouchableOpacity
          onPress={() => onConfirm(pinned.lat, pinned.lng)}
          style={styles.confirmButton}
          activeOpacity={0.85}
        >
          <Check size={18} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  stripText: { fontSize: 12, color: '#4B5563', flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  coordsBadge: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  coordsText: { flex: 1, fontSize: 11, color: '#1E40AF', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600' },
  gpsBadge: { backgroundColor: '#DCFCE7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gpsBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  bottomPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  errorText: { flex: 1, fontSize: 12, color: '#DC2626' },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 13, borderWidth: 1.5, borderColor: '#BFDBFE' },
  gpsButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 15, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});