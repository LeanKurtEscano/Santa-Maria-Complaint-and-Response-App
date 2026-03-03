// hooks/useNotificationSSE.ts
import { useEffect, useRef, useCallback } from 'react';
import { useCurrentUser } from '@/store/useCurrentUserStore';

import EventSource from 'react-native-sse';
interface SSENotificationData {
  complaint_id?: number;
  title?: string;
  message?: string;
  description?: string;
  location_details?: string;
  barangay_id?: number;
  category_id?: number;
  status?: string;
  created_at?: string;
  resolved_at?: string | null;
  [key: string]: any;
}

interface SSEEvent {
  event: string;
  data: SSENotificationData;
}

interface UseNotificationSSEOptions {
  onEvent?: (event: SSEEvent) => void;
  onNewComplaint?: (data: SSENotificationData) => void;
  onComplaintUnderReview?: (data: SSENotificationData) => void;
  onComplaintUpdate?: (data: SSENotificationData) => void;
  onComplaintResolved?: (data: SSENotificationData) => void;
  onNewIncidentForwardedToLgu?: (data: SSENotificationData) => void;
  onNewIncidentForwardedToDepartment?: (data: SSENotificationData) => void;
  onInfo?: (data: SSENotificationData) => void;
  onAnnouncement?: (data: SSENotificationData) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  baseUrl?: string;
  token?: string;
  enabled?: boolean;
}

const EVENT_HANDLERS: Record<string, keyof UseNotificationSSEOptions> = {
  new_complaint:                      'onNewComplaint',
  complaint_under_review:             'onComplaintUnderReview',
  complaint_update:                   'onComplaintUpdate',
  complaint_resolved:                 'onComplaintResolved',
  new_incident_forwarded_to_lgu:      'onNewIncidentForwardedToLgu',
  new_incident_forwarded_to_department: 'onNewIncidentForwardedToDepartment',
  info:                               'onInfo',
  announcement:                       'onAnnouncement',
};

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useNotificationSSE(options: UseNotificationSSEOptions = {}) {
  const {
    onEvent,
    onConnected,
    onDisconnected,
    onError,
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
    const sseEvent: SSEEvent = { event: eventName, data };

    // Fire the generic onEvent handler
    optionsRef.current.onEvent?.(sseEvent);

    // Fire the specific typed handler
    const handlerKey = EVENT_HANDLERS[eventName];
    if (handlerKey) {
      const handler = optionsRef.current[handlerKey] as ((data: SSENotificationData) => void) | undefined;
      handler?.(data);
    }
  }, []);

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

    const url = `${baseUrl}/api/v1/notifications/stream`;

    // EventSource doesn't support custom headers natively,
  
    const fullUrl = `${url}?token=${encodeURIComponent(token)}`;

    const es = new EventSource(fullUrl);
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

      // Auto-reconnect with backoff
      if (!isUnmountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    // Listen for each known event type explicitly
    Object.keys(EVENT_HANDLERS).forEach((eventName) => {
      es.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const data: SSENotificationData = JSON.parse(e.data);
          handleEvent(eventName, data);
        } catch (err) {
          console.error(`[SSE] Failed to parse event "${eventName}":`, err);
        }
      });
    });

    // Fallback: catch any generic "message" events
    es.onmessage = (e: MessageEvent) => {
      try {
        const data: SSENotificationData = JSON.parse(e.data);
        handleEvent('message', data);
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