/**
 * MapDisplay — a read-only map pin component.
 *
 * SWAPPING MAP PROVIDERS
 * ──────────────────────
 * The component is built around a `MapProvider` interface. To switch from
 * Leaflet (default) to Google Maps, Mapbox, or anything else:
 *
 *   1. Create a new provider that implements `MapProvider`:
 *        export const GoogleMapsProvider: MapProvider = { ... }
 *
 *   2. Pass it as the `provider` prop:
 *        <MapDisplay ... provider={GoogleMapsProvider} />
 *
 *   3. Delete or keep the old provider — nothing else needs to change.
 *
 * The built-in LeafletProvider renders via a WebView so it works on both
 * iOS and Android with no native setup required.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// ─── Provider Interface ───────────────────────────────────────────────────────
// Any map engine must satisfy this contract.

export interface MapDisplayProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
}

export interface MapProvider {
  /** Renders the map given the standard props. */
  render: (props: MapDisplayProps) => React.ReactElement;
}

// ─── Leaflet Provider (default) ───────────────────────────────────────────────

export const LeafletProvider: MapProvider = {
  render: ({ latitude, longitude, zoom = 15, height = 200 }) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; width: 100%; overflow: hidden; background: #e5e7eb; }
            #map { height: 100%; width: 100%; }
            .leaflet-control-zoom { display: none; }
            .leaflet-control-attribution { font-size: 9px !important; }
            .custom-marker { background: none !important; border: none !important; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map', {
              zoomControl: false,
              attributionControl: true,
              dragging: false,
              touchZoom: false,
              doubleClickZoom: false,
              scrollWheelZoom: false,
              boxZoom: false,
              keyboard: false,
            }).setView([${latitude}, ${longitude}], ${zoom});

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap',
              maxZoom: 19,
            }).addTo(map);

            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: \`
                <svg width="36" height="42" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="20" cy="48" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
                  <path d="M20 0C11.716 0 5 6.716 5 15c0 8.284 15 35 15 35s15-26.716 15-35C35 6.716 28.284 0 20 0z"
                        fill="#2563EB" stroke="#1E40AF" stroke-width="1.5"/>
                  <circle cx="20" cy="15" r="6" fill="white"/>
                  <circle cx="20" cy="15" r="3" fill="#2563EB"/>
                </svg>
              \`,
              iconSize: [36, 42],
              iconAnchor: [18, 42],
            });

            L.marker([${latitude}, ${longitude}], { icon: customIcon }).addTo(map);
          </script>
        </body>
      </html>
    `;

    return (
      <WebView
        source={{ html }}
        style={{ height, width: '100%' }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        pointerEvents="none"
      />
    );
  },
};

// ─── MapDisplay Component ─────────────────────────────────────────────────────
// Thin wrapper — all it does is delegate to the provider.

interface Props extends MapDisplayProps {
  provider?: MapProvider;
}

export const MapDisplay: React.FC<Props> = ({
  latitude,
  longitude,
  zoom = 15,
  height = 200,
  provider = LeafletProvider,
}) => {
  return (
    <View style={[styles.container, { height }]}>
      {provider.render({ latitude, longitude, zoom, height })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
});