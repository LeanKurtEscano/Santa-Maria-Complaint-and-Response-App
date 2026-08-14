import { create } from "zustand";
import EventSource from "react-native-sse";
import { getAccessToken, refreshAccessToken } from "@/utils/general/token";
import queryClient from "@/lib/api/queryClient";
import { SSEStatus } from "@/types/general/notification";

const LOG_TAG = "[SSE]";

// Module-level (not store state) so reconnect/backoff bookkeeping doesn't
// trigger re-renders on every retry tick — only `status` is observable.
let eventSource: any = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

interface SSEStoreState {
  status: SSEStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useSSEStore = create<SSEStoreState>((set, get) => ({
  status: "disconnected",

  connect: async () => {
    console.log(`${LOG_TAG} connect() — initializing`);
    set({ status: "connecting" });

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSource) {
      console.log(`${LOG_TAG} connect() — closing previous connection`);
      eventSource.close();
      eventSource = null;
    }

    const token = await getAccessToken();
    if (!token) {
      console.warn(`${LOG_TAG} connect() — no token, aborting`);
      set({ status: "disconnected" });
      return;
    }
    console.log(`${LOG_TAG} connect() — token retrieved ✓`);

    const baseURL = `${process.env.EXPO_PUBLIC_IP_URL}/api/v1/notifications`;
    const url = `${baseURL}/stream`;
    console.log(`${LOG_TAG} connect() — connecting to: ${url}`);

    const es = new EventSource(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const handleEvent = (eventType: string) => () => {
      console.log(`${LOG_TAG} event="${eventType}" received — invalidating query`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    es.addEventListener("info", handleEvent("info"));
    es.addEventListener("update", handleEvent("update"));
    es.addEventListener("success", handleEvent("success"));
    es.addEventListener("message", handleEvent("message"));
    es.addEventListener("complaint_resolved", handleEvent("complaint_resolved"));
    es.addEventListener("complaint_under_review", handleEvent("complaint_under_review"));
    es.addEventListener("complaint_update", handleEvent("complaint_update"));
    es.addEventListener("existing_incident", handleEvent("existing_incident"));

    es.onopen = () => {
      console.log(`${LOG_TAG} connect() — connection opened ✓`);
      retryCount = 0; // reset backoff after a clean connect
      set({ status: "connected" });
    };

    es.onerror = async (err: any) => {
      console.log(`${LOG_TAG} raw error:`, JSON.stringify(err), err);
      set({ status: "disconnected" });
      es.close();
      eventSource = null;

      // react-native-sse surfaces 401 inconsistently — always try a refresh first
      const newToken = await refreshAccessToken();

      if (!newToken) {
        console.warn(`${LOG_TAG} Refresh failed — forcing logout`);
        const { useCurrentUser } = await import("@/store/useCurrentUserStore");
        useCurrentUser.getState().clearUser();
        return;
      }

      // exponential backoff (capped at 15s) so a flaky network doesn't hammer the server
      retryCount += 1;
      const delay = Math.min(500 * 2 ** retryCount, 15_000);
      console.log(`${LOG_TAG} Token refreshed ✓ — reconnecting SSE in ${delay}ms`);
      reconnectTimer = setTimeout(() => get().connect(), delay);
    };

    eventSource = es;
    console.log(`${LOG_TAG} connect() — registered ✓`);
  },

  disconnect: () => {
    console.log(`${LOG_TAG} disconnect() — tearing down`);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    eventSource?.close();
    eventSource = null;
    retryCount = 0;
    set({ status: "disconnected" });
  },
}));