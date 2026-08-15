import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationApiClient } from "@/lib/client/notification";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useCurrentUser } from "@/store/useCurrentUserStore";

// Lightweight, always-mounted sync so unreadCount (and the bell badge)
// stays correct no matter which screen the user is on. Uses a queryKey
// under the "notifications" prefix so it gets swept up by the same
// invalidateQueries({ queryKey: ["notifications"] }) call the SSE store
// already fires on every event — no changes needed to useSSEStore.
export function useNotificationSync() {
  const { isAuthenticated } = useCurrentUser();
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const { data } = useQuery({
    queryKey: ["notifications", "sync"],
    queryFn: async () => {
      const res = await notificationApiClient.get("/", {
        params: { page: 1, page_size: 20 },
      });
      return res.data.data; // array of notifications
    },
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setNotifications(data);
  }, [data, setNotifications]);
}