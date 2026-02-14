import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MapPin, Navigation, X, Check } from 'lucide-react-native';

interface LocationPickerProps {
  visible: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (latitude: number, longitude: number) => void;
  onCancel: () => void;
  title?: string;
}

/**
 * Reusable map-based location picker component using WebView and OpenStreetMap
 * No Google Maps API key required!
 * 
 * @example
 * <LocationPicker
 *   visible={showMap}
 *   initialLatitude={userLat}
 *   initialLongitude={userLng}
 *   onConfirm={(lat, lng) => handleLocationSelected(lat, lng)}
 *   onCancel={() => setShowMap(false)}
 * />
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  initialLatitude,
  initialLongitude,
  onConfirm,
  onCancel,
  title = 'Pin Your Location',
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLatitude || 14.5995, // Default to Manila
    longitude: initialLongitude || 120.9842,
  });

  useEffect(() => {
    if (visible) {
      if (initialLatitude && initialLongitude) {
        setSelectedLocation({
          latitude: initialLatitude,
          longitude: initialLongitude,
        });
      } else {
        // Try to get current location when modal opens
        getCurrentLocation();
      }
    }
  }, [visible, initialLatitude, initialLongitude]);

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setSelectedLocation(newLocation);
        
        // Update map to current location
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            updateMapCenter(${newLocation.latitude}, ${newLocation.longitude});
            true;
          `);
        }
      }
      setGettingLocation(false);
    } catch (error) {
      console.error('Error getting current location:', error);
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
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedLocation.latitude, selectedLocation.longitude);
  };

  // HTML content with Leaflet.js (OpenStreetMap)
  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          #map {
            height: 100%;
            width: 100%;
          }
          .leaflet-control-attribution {
            font-size: 10px !important;
          }
          .custom-marker {
            background: none !important;
            border: none !important;
          }
          .custom-marker svg {
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map
          const map = L.map('map', {
            zoomControl: true,
            attributionControl: true
          }).setView([${selectedLocation.latitude}, ${selectedLocation.longitude}], 15);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          // Create custom blue pin marker icon
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: \`
              <svg width="40" height="45" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <!-- Drop shadow -->
                <ellipse cx="20" cy="48" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
                <!-- Pin body -->
                <path d="M20 0C11.716 0 5 6.716 5 15c0 8.284 15 35 15 35s15-26.716 15-35C35 6.716 28.284 0 20 0z" 
                      fill="#2563EB" 
                      stroke="#1E40AF" 
                      stroke-width="1.5"/>
                <!-- White inner circle -->
                <circle cx="20" cy="15" r="6" fill="white"/>
                <!-- Blue inner dot -->
                <circle cx="20" cy="15" r="3" fill="#2563EB"/>
                <!-- Shine effect -->
                <path d="M15 8C15 8 17 6 20 6C23 6 25 8 25 8" 
                      stroke="rgba(255,255,255,0.4)" 
                      stroke-width="2" 
                      fill="none" 
                      stroke-linecap="round"/>
              </svg>
            \`,
            iconSize: [40, 50],
            iconAnchor: [20, 50],
            popupAnchor: [0, -50]
          });

          // Add draggable marker
          let marker = L.marker([${selectedLocation.latitude}, ${selectedLocation.longitude}], {
            draggable: true,
            icon: customIcon
          }).addTo(map);

          // Handle marker drag
          marker.on('dragend', function(e) {
            const position = marker.getLatLng();
            sendLocationToApp(position.lat, position.lng);
          });

          // Handle map click
          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendLocationToApp(e.latlng.lat, e.latlng.lng);
          });

          // Send location to React Native
          function sendLocationToApp(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              latitude: lat,
              longitude: lng
            }));
          }

          // Function to update map center (called from React Native)
          function updateMapCenter(lat, lng) {
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
            sendLocationToApp(lat, lng);
          }

          // Notify React Native that map is loaded
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapLoaded'
          }));

          // Send initial location
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
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Tap on the map or drag the pin to select your location
          </Text>
        </View>

        {/* Map WebView */}
        <View style={styles.mapContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
          
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHTML }}
            style={styles.webview}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />

          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            activeOpacity={0.8}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Navigation size={24} color="#2563EB" />
            )}
          </TouchableOpacity>

          {/* Coordinates Display */}
          <View style={styles.coordinatesCard}>
            <Text style={styles.coordinatesLabel}>Selected Location:</Text>
            <Text style={styles.coordinatesText}>
              Lat: {selectedLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinatesText}>
              Lng: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* Footer with Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelButton}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleConfirm}
            style={styles.confirmButton}
            activeOpacity={0.8}
          >
            <Check size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
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
    backgroundColor: '#2563EB',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  coordinatesCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coordinatesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});