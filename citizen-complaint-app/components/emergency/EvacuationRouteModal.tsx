/**
 * EvacuationRouteModal
 *
 * Takes a whole GROUP of evacuation centers and lets the user switch which
 * center the route is drawn to (e.g. if the nearest one is full).
 *
 * Fullscreen modal that renders a Leaflet map (via WebView) showing:
 *  - User's saved location as a blue pulsing marker
 *  - EVERY evacuation center in the group as a numbered red marker
 *    (greyed out + "Full" ring if isFull is true)
 *  - The currently SELECTED center highlighted with a gold ring + star popup
 *  - The driving route to the selected center, fetched from OSRM
 *  - LIVE LOCATION: a button that requests device location permission,
 *    centers the map on the user's GPS position, and keeps the marker
 *    updated while active. Manual pan/zoom stops auto-follow so the user
 *    can still explore the map.
 *
 * Live location error handling:
 *  - Permission denied (can ask again / blocked -> Open Settings)
 *  - Device location services (GPS) turned off
 *  - First-fix timeout with last-known-position fallback
 *  - Any failure tears down watcher + map marker in one place
 *  - Mid-session signal loss detection
 *  - Banner auto-clears when returning from Settings
 *
 * If no saved user location is available, all centers are still pinned and
 * fit to the viewport, with a notice instead of a route.
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
  Linking,
  AppState,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { X, Building2, WifiOff, RefreshCw, LocateFixed } from 'lucide-react-native';
import { isValidCoordinate } from '@/hooks/general/useReverseGeocode';
import { EvacuationCenter } from '@/constants/emergency/evacuation';
import { THEME } from '@/constants/theme';
import { NAME_CORRECTIONS, displayName } from '@/utils/general/barangayNameError';

interface EvacuationRouteModalProps {
  visible: boolean;
  onClose: () => void;
  /** All evacuation centers to pin — e.g. every center in the chosen barangay. */
  centers: EvacuationCenter[];
  /** Label for the group, e.g. the barangay name. Optional. */
  areaLabel?: string;
  userLat?: number | null;
  userLng?: number | null;
  isAuthenticated?: boolean;
}

type MapCenter = { id: string | number; name: string; lat: number; lng: number; isFull?: boolean };

/** One row of the ranked-by-ETA list, posted back from the WebView. */
type RankedCenter = {
  id: string | number;
  name: string;
  durationSec: number | null;
  distanceM: number | null;
  isFull?: boolean;
};

type LiveState = 'off' | 'loading' | 'on';
type LiveError =
  | null
  | { kind: 'denied'; canAskAgain: boolean }
  | { kind: 'servicesOff' }
  | { kind: 'unavailable' };

const FIX_TIMEOUT_MS = 15_000;
const SIGNAL_LOST_MS = 30_000;
const PLAZA_LOCATION = { lat: 14.47001, lng: 121.42324 };

/** Rejects if the promise doesn't settle within `ms`. */
const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });

/** JSON that is safe to embed inside an inline <script>. */
const safeJson = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

// ── Build the self-contained HTML page ───────────────────────────────────────
function buildMapHtml(
  centers: MapCenter[],
  startLat: number | null,
  startLng: number | null,
): string {
  const hasUser =
    startLat !== null &&
    startLng !== null &&
    isValidCoordinate(startLat, startLng);

  const firstCenter = centers[0];
  const viewLat = hasUser ? startLat! : firstCenter.lat;
  const viewLng = hasUser ? startLng! : firstCenter.lng;

  const centersJson = safeJson(
    centers.map((c) => ({
      id: c.id,
      name: c.name, // JSON handles quote escaping; no manual replace
      lat: c.lat,
      lng: c.lng,
      isFull: !!c.isFull,
    })),
  );

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
    window.userMarker = L.marker([${startLat}, ${startLng}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');
  `
    : '';

  // Live location code. Lives outside routingJs so it works even when there
  // is no saved profile location.
  const liveLocationJs = `
    let liveMarker = null, liveCircle = null;
    let following = false, programmatic = false;

    const liveIcon = L.divIcon({
      className: '',
      html: \`<div style="
        width:20px;height:20px;border-radius:50%;
        background:#2563EB;border:3px solid #fff;
        box-shadow:0 0 0 4px rgba(37,99,235,0.3);
        animation: pulse 1.8s ease-in-out infinite;
      "></div>\`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    function programmaticMove(fn) {
      programmatic = true;
      fn();
      setTimeout(function () { programmatic = false; }, 800);
    }

    // Any manual pan/zoom stops auto-follow so the user can explore freely.
    map.on('dragstart', function () { following = false; });
    map.on('zoomstart', function () { if (!programmatic) following = false; });

    window.setLiveLocation = function (lat, lng, acc, recenter) {
      const ll = [lat, lng];
      if (!liveMarker) {
        liveMarker = L.marker(ll, { icon: liveIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup('<b>Your Location</b>');
        if (window.userMarker) map.removeLayer(window.userMarker); // avoid two "you" dots
      } else {
        liveMarker.setLatLng(ll);
      }
      if (acc != null) {
        if (!liveCircle) {
          liveCircle = L.circle(ll, {
            radius: acc, color: '#2563EB', weight: 1, fillColor: '#2563EB', fillOpacity: 0.1,
          }).addTo(map);
        } else {
          liveCircle.setLatLng(ll);
          liveCircle.setRadius(acc);
        }
      }
      if (recenter) {
        following = true;
        programmaticMove(function () { map.setView(ll, Math.max(map.getZoom(), 16)); });
      } else if (following) {
        programmaticMove(function () { map.panTo(ll); });
      }
    };

    window.clearLiveLocation = function () {
      if (liveMarker) { map.removeLayer(liveMarker); liveMarker = null; }
      if (liveCircle) { map.removeLayer(liveCircle); liveCircle = null; }
      following = false;
      if (window.userMarker) window.userMarker.addTo(map);
    };
  `;

  const routingJs = hasUser
    ? `
    const statusEl = document.getElementById('status');
    statusEl.style.display = 'flex';

    let currentRouteLine = null;
    let selectedId = null;

    function normalIcon(i, isFull) {
      return L.divIcon({
        className: '',
        html: \`<div style="
          width:22px;height:22px;border-radius:50%;
          background:\${isFull ? '#94A3B8' : '#DC2626'};border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:11px;font-weight:800;
        ">\${i + 1}</div>\`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
    }

    function selectedIcon() {
      return L.divIcon({
        className: '',
        html: \`<div style="
          width:26px;height:26px;border-radius:50%;
          background:#DC2626;border:3px solid #FBBF24;
          box-shadow:0 2px 10px rgba(220,38,38,0.6);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:13px;font-weight:800;
        ">★</div>\`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    function showNoRoute() {
      const el = document.getElementById('noRoute');
      if (el) el.style.display = 'flex';
    }

    window.routeStart = { lat: ${startLat}, lng: ${startLng} };
    window.routeInFlight = false;
    window.routeStartPending = false;

    function setRouteStart(lat, lng) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      window.routeStart = { lat: lat, lng: lng };
      if (selectedId !== null) {
        if (window.routeInFlight) {
          window.routeStartPending = true;
        } else {
          window.selectCenter(selectedId);
        }
      }
    }
    window.setRouteStart = setRouteStart;

    // Draws/redraws the route to a given center id. Exposed on window so
    // RN can call it via injectJavaScript when the user taps a different
    // center in the picker strip.
    window.selectCenter = function(id) {
      const center = centers.find(c => c.id === id);
      if (!center) return;
      selectedId = id;

      const el = document.getElementById('noRoute');
      if (el) el.style.display = 'none';

      // Re-style all markers: normal for everyone, gold star for selected
      centers.forEach((c, i) => {
        destMarkers[c.id].setIcon(c.id === id ? selectedIcon() : normalIcon(i, c.isFull));
      });
      destMarkers[id].bindPopup(
        '<b>' + esc(center.name) + '</b>' + (center.isFull ? '<br>⚠️ Reported full' : '<br>⭐ Selected route')
      ).openPopup();

      // Let RN know the selection changed (so the picker strip below the
      // map highlights the same center), whether the tap came from a
      // marker on the map or from the native strip itself.
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'selected', id: id })
      );

      if (currentRouteLine) { map.removeLayer(currentRouteLine); currentRouteLine = null; }

      const chip = document.getElementById('routeChip');
      chip.style.display = 'none';
      statusEl.style.display = 'flex';

      const routeUrl =
          'https://router.project-osrm.org/route/v1/driving/' +
          window.routeStart.lng + ',' + window.routeStart.lat + ';' + center.lng + ',' + center.lat +
          '?overview=full&geometries=geojson';

        if (window.routeInFlight) return;
        window.routeInFlight = true;
        return fetch(routeUrl).then(r => r.json()).then(routeData => {
          if (!routeData.routes || routeData.routes.length === 0) { showNoRoute(); return; }

        const route = routeData.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        currentRouteLine = L.polyline(coords, {
          color: '#DC2626',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        map.fitBounds(currentRouteLine.getBounds(), { padding: [56, 56] });

        const km = (route.distance / 1000).toFixed(1);
        const mins = Math.round(route.duration / 60);
        chip.textContent = (center.isFull ? '⚠️ ' : '★ ') + center.name + ' · ' + km + ' km · ~' + mins + ' min';
        chip.style.display = 'block';
      }).catch(() => {
        showNoRoute();
      }).finally(() => {
        window.routeInFlight = false;
        statusEl.style.display = 'none';
        if (window.routeStartPending) {
          window.routeStartPending = false;
          window.selectCenter(selectedId);
        }
      });
    };

    const tableUrl =
      'https://router.project-osrm.org/table/v1/driving/' +
      '${startLng},${startLat};' + centers.map(c => c.lng + ',' + c.lat).join(';') +
      '?sources=0&annotations=distance,duration';

    fetch(tableUrl)
      .then(r => r.json())
      .then(tableData => {
        const durations = tableData.durations && tableData.durations[0]
          ? tableData.durations[0].slice(1)
          : null;
        const distances = tableData.distances && tableData.distances[0]
          ? tableData.distances[0].slice(1)
          : null;
        const scoreArr = durations || distances;

        // Build full ranked list and send it back to RN so it can render
        // the native picker strip.
        const ranked = centers
          .map((c, i) => ({
            id: c.id,
            name: c.name,
            durationSec: durations ? durations[i] : null,
            distanceM: distances ? distances[i] : null,
            isFull: c.isFull,
          }))
          .filter(r => r.durationSec != null || r.distanceM != null)
          .sort((a, b) => (a.durationSec ?? a.distanceM) - (b.durationSec ?? b.distanceM));

        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'ranked', ranked })
        );

        if (!scoreArr) { statusEl.style.display = 'none'; showNoRoute(); return; }

        // Default selection: best center that ISN'T reported full, falling
        // back to the overall best if every center is full.
        let bestIdx = -1, bestVal = Infinity;
        scoreArr.forEach((v, i) => {
          if (v != null && !centers[i].isFull && v < bestVal) { bestVal = v; bestIdx = i; }
        });
        if (bestIdx === -1) {
          scoreArr.forEach((v, i) => {
            if (v != null && v < bestVal) { bestVal = v; bestIdx = i; }
          });
        }
        if (bestIdx === -1) { statusEl.style.display = 'none'; showNoRoute(); return; }

        window.selectCenter(centers[bestIdx].id);
      })
      .catch(() => {
        statusEl.style.display = 'none';
        showNoRoute();
      });
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
      max-width: 90vw;
      overflow: hidden;
      text-overflow: ellipsis;
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
    <span style="color:#475569;font-weight:600;">Finding best evacuation center…</span>
  </div>

  <div id="routeChip" class="overlay"></div>

  <div id="noRoute" class="overlay">⚠️ Route unavailable — navigate manually</div>
  <div id="noUser"  class="overlay">📍 Enable location to see the best route</div>

  <script>
    const map = L.map('map', { zoomControl: true }).setView([${viewLat}, ${viewLng}], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const centers = ${centersJson};

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    const destMarkers = {};
    const bounds = [];

    centers.forEach((c, i) => {
      const icon = L.divIcon({
        className: '',
        html: \`<div style="
          width:22px;height:22px;border-radius:50%;
          background:\${c.isFull ? '#94A3B8' : '#DC2626'};border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:11px;font-weight:800;
        ">\${i + 1}</div>\`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .bindPopup('<b>' + esc(c.name) + '</b>' + (c.isFull ? '<br>⚠️ Reported full' : ''));

      // Tapping the circle itself reroutes to that center (same effect as
      // tapping its chip in the native picker strip below the map).
      marker.on('click', () => {
        if (window.selectCenter) window.selectCenter(c.id);
      });
      destMarkers[c.id] = marker;
      bounds.push([c.lat, c.lng]);
    });

    ${userMarkerJs}

    ${liveLocationJs}

    if (${hasUser}) { bounds.push([${startLat}, ${startLng}]); }
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [56, 56] });
    }

    ${routingJs}

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
  centers,
  areaLabel,
  userLat,
  userLng,
  isAuthenticated = false,
}) => {
  const { t } = useTranslation();

  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [ranked, setRanked] = useState<RankedCenter[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ── Live Location state ────────────────────────────────────────────────────
  const [liveState, setLiveState] = useState<LiveState>('off');
  const [liveError, setLiveError] = useState<LiveError>(null);
  const [signalLost, setSignalLost] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const sessionRef = useRef(0); // invalidates stale async results after stop/close
  const lastFixRef = useRef<{ lat: number; lng: number; acc: number | null } | null>(null);
  const lastFixAtRef = useRef(0);

  const validCenters: MapCenter[] = useMemo(
    () =>
      (centers ?? [])
        .filter((c) => isValidCoordinate(c.latitude, c.longitude))
        .map((c) => ({
          id: c.id,
          name: displayName(c.name),
          lat: c.latitude,
          lng: c.longitude,
          // Adjust this to whatever field your EvacuationCenter type actually
          // exposes for occupancy, e.g. c.status === 'full' or a capacity check.
          isFull: (c as any).isFull ?? false,
        })),
    [centers],
  );

  const centersKey = validCenters.map((c) => `${c.id}:${c.lat},${c.lng}:${c.isFull ? 1 : 0}`).join('|');
  const hasAuthenticatedCoordinates =
    userLat != null &&
    userLng != null &&
    isValidCoordinate(userLat, userLng);
  const routeStart = isAuthenticated
    ? {
        lat: hasAuthenticatedCoordinates ? userLat : null,
        lng: hasAuthenticatedCoordinates ? userLng : null,
      }
    : PLAZA_LOCATION;

  const html = useMemo(
    () =>
      validCenters.length > 0
        ? buildMapHtml(validCenters, routeStart.lat, routeStart.lng)
        : '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centersKey, routeStart.lat, routeStart.lng, webViewKey],
  );

  // Reset state whenever the modal opens or is retried
  useEffect(() => {
    if (visible) {
      setMapError(false);
      setMapLoading(true);
      setRanked([]);
      setSelectedId(null);
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

  // ── Live Location logic ────────────────────────────────────────────────────
  const pushFix = useCallback(
    (lat: number, lng: number, acc: number | null, recenter: boolean) => {
      lastFixRef.current = { lat, lng, acc };
      lastFixAtRef.current = Date.now();
      setSignalLost(false);
      webViewRef.current?.injectJavaScript(
        `window.setLiveLocation && window.setLiveLocation(${lat}, ${lng}, ${acc ?? 'null'}, ${recenter}); true;`,
      );
    },
    [],
  );

  /** Single teardown path: used by stop, by every failure, and on close. */
  const teardownLive = useCallback(() => {
    sessionRef.current += 1; // invalidate any in-flight async work
    watchRef.current?.remove();
    watchRef.current = null;
    lastFixRef.current = null;
    lastFixAtRef.current = 0;
    setSignalLost(false);
    webViewRef.current?.injectJavaScript(
      'window.clearLiveLocation && window.clearLiveLocation(); true;',
    );
  }, []);

  const stopLive = useCallback(() => {
    teardownLive();
    setLiveState('off');
  }, [teardownLive]);

  const startLive = useCallback(async () => {
    const session = ++sessionRef.current;
    const stale = () => session !== sessionRef.current;

    setLiveError(null);
    setSignalLost(false);
    setLiveState('loading');

    try {
      // 1. Permission
      const perm = await Location.requestForegroundPermissionsAsync();
      if (stale()) return;
      if (perm.status !== 'granted') {
        setLiveState('off');
        setLiveError({ kind: 'denied', canAskAgain: perm.canAskAgain });
        return;
      }

      // 2. Device location services (GPS toggle)
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (stale()) return;
      if (!servicesOn) {
        setLiveState('off');
        setLiveError({ kind: 'servicesOff' });
        return;
      }

      // 3. First fix, with timeout and last-known fallback
      let pos: Location.LocationObject | null = null;
      try {
        pos = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          FIX_TIMEOUT_MS,
        );
      } catch {
        pos = await Location.getLastKnownPositionAsync().catch(() => null);
      }
      if (stale()) return;
      if (!pos) throw new Error('no fix');

      const { latitude, longitude, accuracy } = pos.coords;
      if (!isValidCoordinate(latitude, longitude)) throw new Error('invalid coordinate');

      pushFix(latitude, longitude, accuracy ?? null, true);
      webViewRef.current?.injectJavaScript(
        `window.setRouteStart && window.setRouteStart(${latitude}, ${longitude}); true;`,
      );
      setLiveState('on');

      // 4. Continuous updates
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 },
        (p) => {
          if (stale()) return;
          const { latitude: la, longitude: lo, accuracy: ac } = p.coords;
          if (isValidCoordinate(la, lo)) pushFix(la, lo, ac ?? null, false);
        },
      );
      if (stale()) {
        sub.remove();
        return;
      }
      watchRef.current = sub;
    } catch {
      if (stale()) return;
      teardownLive(); // removes watcher AND the orphaned map marker
      setLiveState('off');
      setLiveError({ kind: 'unavailable' });
    }
  }, [pushFix, teardownLive]);

  const handleLivePress = useCallback(() => {
    if (liveState === 'off') startLive();
    else if (liveState === 'on') stopLive();
  }, [liveState, startLive, stopLive]);

  // Mid-session signal-loss detector
  useEffect(() => {
    if (liveState !== 'on') return;
    const id = setInterval(() => {
      if (lastFixAtRef.current && Date.now() - lastFixAtRef.current > SIGNAL_LOST_MS) {
        setSignalLost(true);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [liveState]);

  // Clear stale banners when the user returns from Settings
  useEffect(() => {
    if (!liveError || liveError.kind === 'unavailable') return;
    const sub = AppState.addEventListener('change', async (s) => {
      if (s !== 'active') return;
      try {
        if (liveError.kind === 'denied') {
          const p = await Location.getForegroundPermissionsAsync();
          if (p.granted) setLiveError(null);
        } else if (liveError.kind === 'servicesOff') {
          if (await Location.hasServicesEnabledAsync()) setLiveError(null);
        }
      } catch {
        /* ignore — banner stays until dismissed */
      }
    });
    return () => sub.remove();
  }, [liveError]);

  // Stop tracking when the modal closes; clean up on unmount.
  useEffect(() => {
    if (!visible) {
      stopLive();
      setLiveError(null);
    }
  }, [visible, stopLive]);

  useEffect(
    () => () => {
      sessionRef.current += 1;
      watchRef.current?.remove();
    },
    [],
  );

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapLoaded') {
          setMapLoading(false);
          setMapError(false);
          // Restore the live marker if the WebView was remounted (Retry)
          const f = lastFixRef.current;
          if (f) pushFix(f.lat, f.lng, f.acc, true);
        }
        if (data.type === 'ranked' && Array.isArray(data.ranked)) {
          setRanked(data.ranked);
          // The WebView picks its own default (best non-full center) and
          // calls selectCenter internally — mirror that choice here so the
          // native picker strip highlights the right chip. Fall back to the
          // first ranked entry if something's off.
          const firstNonFull = data.ranked.find((r: RankedCenter) => !r.isFull);
          setSelectedId((firstNonFull ?? data.ranked[0])?.id ?? null);
        }
        if (
          data.type === 'selected' &&
          (typeof data.id === 'string' || typeof data.id === 'number')
        ) {
          // Fired whenever the WebView's selection changes — including a tap
          // on a marker circle on the map itself — so the native picker
          // strip's highlighted chip stays in sync.
          setSelectedId(data.id);
        }
      } catch (_) {}
    },
    [pushFix],
  );

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

  const headerTitle =
    areaLabel ??
    t('emergency.evacuation.centersCount', {
      count: centers?.length ?? 0,
      defaultValue: `${centers?.length ?? 0} Evacuation Centers`,
    });

  const needsSettings = liveError?.kind === 'denied' && !liveError.canAskAgain;

  const banner = (() => {
    if (!liveError) return null;
    if (liveError.kind === 'denied') {
      return {
        title: t('emergency.evacuation.routeModal.live.deniedTitle', {
          defaultValue: 'Location permission needed',
        }),
        body: liveError.canAskAgain
          ? t('emergency.evacuation.routeModal.live.deniedBody', {
              defaultValue:
                'Location permission is required to use Live Location. Allow it to see your position on the map.',
            })
          : t('emergency.evacuation.routeModal.live.deniedBodySettings', {
              defaultValue:
                'Location permission is blocked. Open your device Settings and allow location access to use Live Location.',
            }),
        action: needsSettings ? 'settings' : 'retry',
      } as const;
    }
    if (liveError.kind === 'servicesOff') {
      return {
        title: t('emergency.evacuation.routeModal.live.servicesOffTitle', {
          defaultValue: 'Location is turned off',
        }),
        body: t('emergency.evacuation.routeModal.live.servicesOffBody', {
          defaultValue: 'Turn on GPS / Location in your device settings, then try again.',
        }),
        action: 'settings',
      } as const;
    }
    return {
      title: t('emergency.evacuation.routeModal.live.unavailableTitle', {
        defaultValue: 'Location unavailable',
      }),
      body: t('emergency.evacuation.routeModal.live.unavailableBody', {
        defaultValue: "We couldn't get your location. Make sure GPS is on and try again.",
      }),
      action: 'retry',
    } as const;
  })();

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
            {headerTitle}
          </Text>
          {centers?.length > 1 && (
            <Text className="text-[11px] text-slate-400" numberOfLines={1}>
              {t('emergency.evacuation.centersCount', {
                count: centers.length,
                defaultValue: `${centers.length} centers pinned`,
              })}
            </Text>
          )}
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
      <View className="bg-white px-4 py-2 flex-row items-center gap-x-4 border-b border-slate-100 flex-wrap">
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
          <View
            className="w-3 h-3 rounded-full bg-red-600"
            style={{ borderWidth: 2, borderColor: '#FBBF24' }}
          />
          <Text className="text-[11px] text-slate-500 font-medium">
            {t('emergency.evacuation.routeModal.legendBest', { defaultValue: 'Selected route' })}
          </Text>
        </View>
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-3 h-3 rounded-full bg-slate-400" />
          <Text className="text-[11px] text-slate-500 font-medium">
            {t('emergency.evacuation.routeModal.legendFull', { defaultValue: 'Reported full' })}
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

        {/* ── Live Location: permission/error banner + button ── */}
        {!mapLoading && !mapError && (
          <>
            {banner && (
              <View style={styles.liveBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveBannerTitle}>{banner.title}</Text>
                  <Text style={styles.liveBannerBody}>{banner.body}</Text>
                  <TouchableOpacity
                    style={styles.liveBannerAction}
                    onPress={() =>
                      banner.action === 'settings' ? Linking.openSettings() : startLive()
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.liveBannerActionText}>
                      {banner.action === 'settings'
                        ? t('emergency.evacuation.routeModal.live.openSettings', {
                            defaultValue: 'Open Settings',
                          })
                        : t('emergency.evacuation.routeModal.live.tryAgain', {
                            defaultValue: 'Try Again',
                          })}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setLiveError(null)} hitSlop={12}>
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.liveButton, liveState === 'on' && styles.liveButtonOn]}
              onPress={handleLivePress}
              disabled={liveState === 'loading'}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ busy: liveState === 'loading', selected: liveState === 'on' }}
            >
              {liveState === 'loading' ? (
                <ActivityIndicator size="small" color={THEME.primary} />
              ) : (
                <LocateFixed size={18} color={liveState === 'on' ? '#fff' : THEME.primary} />
              )}
              <Text style={[styles.liveButtonText, liveState === 'on' && styles.liveButtonTextOn]}>
                {liveState === 'loading'
                  ? t('emergency.evacuation.routeModal.live.loading', {
                      defaultValue: 'Locating…',
                    })
                  : liveState === 'on' && signalLost
                  ? t('emergency.evacuation.routeModal.live.signalLost', {
                      defaultValue: 'Searching for signal…',
                    })
                  : liveState === 'on'
                  ? t('emergency.evacuation.routeModal.live.on', {
                      defaultValue: 'Live Location On',
                    })
                  : t('emergency.evacuation.routeModal.live.off', {
                      defaultValue: 'Live Location',
                    })}
              </Text>
            </TouchableOpacity>
          </>
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

  // ── Live Location ──
  liveButton: {
    position: 'absolute',
    right: 16,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: THEME.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  liveButtonOn: {
    backgroundColor: THEME.primary,
  },
  liveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.primary,
  },
  liveButtonTextOn: {
    color: '#fff',
  },
  liveBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  liveBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  liveBannerBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  liveBannerAction: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: THEME.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  liveBannerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});