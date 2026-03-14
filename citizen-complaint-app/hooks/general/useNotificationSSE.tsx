// hooks/general/useNotificationSSE.ts

import { useEffect, useRef, useCallback } from 'react';
import EventSource from 'react-native-sse';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { SSENotificationData } from '@/constants/general/notification';

export interface SSEEvent {
  event: string;
  data: SSENotificationData;
}

interface UseNotificationSSEOptions {
  onEvent?: (event: SSEEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  baseUrl?: string;
  token?: string;
  enabled?: boolean;
}

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

const SSE_EVENT_NAMES = [
  'notification',
  'new_complaint',
  'complaint_under_review',
  'complaint_update',
  'complaint_resolved',
  'incident_update',
  'new_incident_forwarded_to_lgu',
  'new_incident_forwarded_to_department',
  'info',
  'announcement',
] as const;

export function useNotificationSSE(options: UseNotificationSSEOptions = {}) {
  const { userData } = useCurrentUser();
  const { prependNotification } = useNotificationStore();
  const {
    baseUrl = process.env.EXPO_PUBLIC_API_URL,
    token,
    enabled = true,
  } = options;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const handleEvent = useCallback((eventName: string, data: SSENotificationData) => {
    // Auto-prepend to store — covers all event types
    prependNotification(data, data.notification_type ?? eventName ?? 'info', userData?.id);

    // Fire generic onEvent for any custom UI handling
    optionsRef.current.onEvent?.({ event: eventName, data });
  }, [prependNotification, userData?.id]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || !enabled || !token) return;
    disconnect();

    const es = new EventSource(`${baseUrl}/api/v1/notifications/stream`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    eventSourceRef.current = es;

    es.onopen = () => {
      reconnectAttemptsRef.current = 0;
      optionsRef.current.onConnected?.();
    };

    es.onerror = (e) => {
      optionsRef.current.onError?.(e);
      optionsRef.current.onDisconnected?.();
      es.close();
      eventSourceRef.current = null;

      if (!isUnmountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS * reconnectAttemptsRef.current);
      }
    };

    // Listen for all known event types
    SSE_EVENT_NAMES.forEach((eventName) => {
      es.addEventListener(eventName, (e: MessageEvent) => {
        try {
          handleEvent(eventName, JSON.parse(e.data));
        } catch (err) {
          console.error(`[SSE] Failed to parse event "${eventName}":`, err);
        }
      });
    });

    // Fallback for unnamed/generic messages
    es.onmessage = (e: MessageEvent) => {
      try {
        handleEvent('message', JSON.parse(e.data));
      } catch (err) {
        console.error('[SSE] Failed to parse message event:', err);
      }
    };
  }, [enabled, token, baseUrl, disconnect, handleEvent]);

  useEffect(() => {
    isUnmountedRef.current = false;
    if (enabled && token) connect();
    return () => {
      isUnmountedRef.current = true;
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  return { disconnect, reconnect: connect };
}