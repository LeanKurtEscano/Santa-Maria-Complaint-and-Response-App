import { useCallback, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { findBarangayAt, DetectedBarangay } from '@/utils/general/barangayMatcher';

const FIX_TIMEOUT_MS = 10000;
const MAX_ACCURACY_M = 100;
const CONFIRMATIONS = 2; // consecutive fixes needed to switch barangay

let permissionPrompted = false; // only ever prompt once per app session

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

/**
 * Optional enhancement: every failure path is swallowed and the hook just
 * returns null, so the screen behaves exactly as it did before.
 */
export function useCurrentBarangay(enabled: boolean): DetectedBarangay | null {
  const [detected, setDetected] = useState<DetectedBarangay | null>(null);
  const currentKeyRef = useRef<string | null>(null);
  const candidateRef = useRef<{ key: string | null; count: number }>({ key: null, count: 0 });

  const handleFix = useCallback((coords: Location.LocationObjectCoords) => {
    if (coords.accuracy != null && coords.accuracy > MAX_ACCURACY_M) return;

    const match = findBarangayAt(coords.latitude, coords.longitude);
    const key = match?.key ?? null;

    if (key === currentKeyRef.current) {
      candidateRef.current = { key, count: 0 };
      return; // unchanged: no state update, no re-render, no reorder
    }

    const prev = candidateRef.current;
    const count = prev.key === key ? prev.count + 1 : 1;
    candidateRef.current = { key, count };

    // First detection is accepted immediately; switching needs confirmation
    // so GPS jitter between the tiny poblacion barangays doesn't flip the list.
    if (currentKeyRef.current === null || count >= CONFIRMATIONS) {
      currentKeyRef.current = key;
      candidateRef.current = { key, count: 0 };
      setDetected(match);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      let cancelled = false;
      const subs: Location.LocationSubscription[] = [];

      (async () => {
        try {
          if (!(await Location.hasServicesEnabledAsync())) return;

          let perm = await Location.getForegroundPermissionsAsync();
          if (perm.status !== 'granted' && perm.canAskAgain && !permissionPrompted) {
            permissionPrompted = true;
            perm = await Location.requestForegroundPermissionsAsync();
          }
          if (cancelled || perm.status !== 'granted') return;

          const last = await Location.getLastKnownPositionAsync({
            maxAge: 60000,
            requiredAccuracy: MAX_ACCURACY_M,
          }).catch(() => null);
          if (!cancelled && last) handleFix(last.coords);

          try {
            const fix = await withTimeout(
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              FIX_TIMEOUT_MS
            );
            if (!cancelled) handleFix(fix.coords);
          } catch {
            // timeout / GPS failure: ignore, the watcher below may still succeed
          }

          if (cancelled) return;
          const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 15000 },
            (loc) => { if (!cancelled) handleFix(loc.coords); }
          );
          if (cancelled) sub.remove();
          else subs.push(sub);
        } catch {
          // silently fall back to current behaviour
        }
      })();

      // runs on blur AND unmount
      return () => {
        cancelled = true;
        subs.forEach((s) => s.remove());
      };
    }, [enabled, handleFix])
  );

  return detected;
}