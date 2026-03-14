import { notificationApiClient } from "@/lib/client/notification";
import { getAccessToken } from "@/utils/general/token";
import { useNotificationStore, NotificationType } from "@/store/useNotificationStore";
import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EventSource from "react-native-sse";
import { useRouter } from "expo-router";
// ─── Constants ────────────────────────────────────────────────────────────────

const LOG_TAG = "[Notifications]";
const QUERY_KEY = ["notifications"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  complaint_id?: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  channel: string;
  is_read: boolean;
  sent_at: string;
}

type SSEStatus = "connecting" | "connected" | "disconnected";

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    badgeClass: string;
    badgeTextClass: string;
    iconBgClass: string;
    dotClass: string;
  }
> = {
  info: {
    icon: "information-circle",
    iconColor: "#3B82F6",
    badgeClass: "bg-blue-50 border border-blue-100",
    badgeTextClass: "text-blue-500",
    iconBgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
  },
  update: {
    icon: "refresh-circle",
    iconColor: "#0EA5E9",
    badgeClass: "bg-sky-50 border border-sky-100",
    badgeTextClass: "text-sky-500",
    iconBgClass: "bg-sky-50",
    dotClass: "bg-sky-500",
  },
  success: {
    icon: "checkmark-circle",
    iconColor: "#10B981",
    badgeClass: "bg-emerald-50 border border-emerald-100",
    badgeTextClass: "text-emerald-500",
    iconBgClass: "bg-emerald-50",
    dotClass: "bg-emerald-500",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (sentAt: string): string => {
  const date = new Date(sentAt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fetchNotificationsApi = async (): Promise<Notification[]> => {
  console.log(`${LOG_TAG} fetchNotificationsApi() — calling GET /`);
  const res = await notificationApiClient.get("/");
  console.log(
    `${LOG_TAG} fetchNotificationsApi() — received ${res.data?.length ?? 0} notifications`
  );
  return res.data;
};

// ─── Notification Card ────────────────────────────────────────────────────────

const NotificationCard = React.memo(({
  item,
  onMarkRead,
  isNew,
}: {
  item: Notification;
  onMarkRead: (id: number) => void;
  isNew: boolean;
}) => {
  const hasAnimated = useRef(false);
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const config = TYPE_CONFIG[item.notification_type] ?? TYPE_CONFIG.info;
  const router = useRouter();

  useEffect(() => {
    if (!isNew || hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [isNew]);

  const handlePress = () => {
    if (item.complaint_id) {
      if (!item.is_read) onMarkRead(item.id);
      router.push(`/complaints/${item.complaint_id}`);
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={item.complaint_id ? 0.7 : 1}
        className={`flex-row items-start rounded-2xl p-4 mb-3 gap-3 ${
          item.is_read
            ? "bg-white border border-slate-100"
            : "bg-blue-50/60 border border-blue-100"
        }`}
        style={
          Platform.OS === "ios"
            ? {
                shadowColor: "#94A3B8",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
              }
            : { elevation: 2 }
        }
      >
        {/* Unread dot */}
        {!item.is_read && (
          <View
            className={`absolute top-4 left-2 w-1.5 h-1.5 rounded-full ${config.dotClass}`}
          />
        )}

        {/* Icon bubble */}
        <View
          className={`w-11 h-11 rounded-xl items-center justify-center shrink-0 ${config.iconBgClass}`}
        >
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

        {/* Body */}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between mb-0.5">
            <View className={`px-2 py-0.5 rounded-full ${config.badgeClass}`}>
              <Text
                className={`text-[10px] font-bold uppercase tracking-wider ${config.badgeTextClass}`}
              >
                {item.notification_type}
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400 font-medium">
              {formatTime(item.sent_at)}
            </Text>
          </View>

          <Text
            className={`text-sm font-semibold leading-5 ${
              item.is_read ? "text-slate-500" : "text-slate-900"
            }`}
          >
            {item.title}
          </Text>

          <Text
            className="text-[13px] text-slate-500 leading-[18px]"
            numberOfLines={2}
          >
            {item.message}
          </Text>

          {!item.is_read && (
            <TouchableOpacity
              className="self-start flex-row items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full bg-white border border-blue-200"
              onPress={() => onMarkRead(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={11} color="#3B82F6" />
              <Text className="text-[11px] text-blue-500 font-semibold">
                Mark as read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <View className="flex-1 items-center justify-center pt-20 gap-3">
    <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-2">
      <Ionicons name="notifications-off-outline" size={38} color="#93C5FD" />
    </View>
    <Text className="text-lg font-bold text-slate-900">All caught up!</Text>
    <Text className="text-sm text-slate-400 text-center px-10 leading-5">
      No notifications yet. We'll let you know when something happens.
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Notifications = () => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { setNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();

  const [markingAll, setMarkingAll] = useState(false);
  const [sseStatus, setSseStatus] = useState<SSEStatus>("connecting");
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const prevIdsRef = useRef<Set<number>>(new Set());
  const eventSourceRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── useQuery — single source of truth ───────────────────────────────────

  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchNotificationsApi,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  // Sync query data → zustand store + detect newly arrived IDs for animation
  useEffect(() => {
    if (!notifications.length) return;

    console.log(
      `${LOG_TAG} query sync — ${notifications.length} notifications, updating store`
    );
    setNotifications(notifications);

    const incoming = new Set(notifications.map((n) => n.id));

    // ✅ Fix: skip animation on the very first fetch (prevIds is empty)
    // Only animate IDs that arrive after the initial load
    if (prevIdsRef.current.size > 0) {
      const arrived = notifications
        .filter((n) => !prevIdsRef.current.has(n.id))
        .map((n) => n.id);

      if (arrived.length > 0) {
        console.log(`${LOG_TAG} newly arrived notifications:`, arrived);
        setNewIds(new Set(arrived));
        setTimeout(() => setNewIds(new Set()), 600);
      }
    }

    prevIdsRef.current = incoming;
  }, [notifications]);

  // ── Pulse animation ──────────────────────────────────────────────────────

  useEffect(() => {
    if (sseStatus !== "connected") {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [sseStatus]);

  // ── SSE — only triggers refetch, never writes fake data ──────────────────

  const connectSSE = useCallback(async () => {
    console.log(`${LOG_TAG} connectSSE() — initializing`);
    setSseStatus("connecting");

    if (eventSourceRef.current) {
      console.log(`${LOG_TAG} connectSSE() — closing previous connection`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const token = await getAccessToken();
    if (!token) {
      console.warn(`${LOG_TAG} connectSSE() — no token, aborting`);
      setSseStatus("disconnected");
      return;
    }
    console.log(`${LOG_TAG} connectSSE() — token retrieved ✓`);

    const baseURL = `${process.env.EXPO_PUBLIC_IP_URL}/api/v1/notifications`;
    const url = `${baseURL}/stream?token=${encodeURIComponent(token)}`;
    console.log(`${LOG_TAG} connectSSE() — connecting to: ${url}`);

    // ✅ Fix: instantiate EventSource before using it
    const es = new EventSource(url);

    const handleEvent = (eventType: string) => () => {
      console.log(
        `${LOG_TAG} SSE event="${eventType}" received — invalidating query to refetch real data`
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };

    es.addEventListener("info", handleEvent("info"));
    es.addEventListener("update", handleEvent("update"));
    es.addEventListener("success", handleEvent("success"));
    es.addEventListener("message", handleEvent("message"));

    es.onopen = () => {
      console.log(`${LOG_TAG} connectSSE() — connection opened ✓`);
      setSseStatus("connected");
    };

    es.onerror = (err: any) => {
      console.error(`${LOG_TAG} connectSSE() — error:`, err);
      setSseStatus("disconnected");
      es.close();
      console.log(`${LOG_TAG} connectSSE() — retrying in 5s...`);
      setTimeout(connectSSE, 5000);
    };

    eventSourceRef.current = es;
    console.log(`${LOG_TAG} connectSSE() — registered ✓`);
  }, [queryClient]);

  useEffect(() => {
    console.log(`${LOG_TAG} mount`);
    connectSSE();
    return () => {
      console.log(`${LOG_TAG} unmount — closing SSE`);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  // ── Mark single as read ──────────────────────────────────────────────────

  const handleMarkRead = async (id: number) => {
    console.log(`${LOG_TAG} handleMarkRead() — id=${id}`);
    try {
      markAsRead(id);
      await notificationApiClient.post(`/${id}/read`);
      console.log(`${LOG_TAG} handleMarkRead() — API success for id=${id}`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      console.error(`${LOG_TAG} handleMarkRead() — API error for id=${id}:`, err);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  };

  // ── Mark all as read ─────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      console.log(`${LOG_TAG} handleMarkAllRead() — skipped (unreadCount=0)`);
      return;
    }
    console.log(`${LOG_TAG} handleMarkAllRead() — unreadCount=${unreadCount}`);
    setMarkingAll(true);
    try {
      markAllAsRead();
      await notificationApiClient.post("/read-all");
      console.log(`${LOG_TAG} handleMarkAllRead() — API success`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      console.error(`${LOG_TAG} handleMarkAllRead() — API error:`, err);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Pull to refresh ──────────────────────────────────────────────────────

  const onRefresh = () => {
    console.log(`${LOG_TAG} onRefresh() — triggered`);
    refetch();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* ── Header ── */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center justify-between">
          {/* Left */}
          <View className="gap-1">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">
              Notifications
            </Text>
          </View>

          {/* Right */}
          <View className="flex-row items-center gap-2.5">
            {unreadCount > 0 && (
              <View className="bg-blue-500 rounded-full min-w-[24px] h-6 items-center justify-center px-1.5">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
                unreadCount === 0
                  ? "border-slate-200 bg-slate-50"
                  : "border-blue-200 bg-blue-50"
              }`}
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              activeOpacity={0.7}
            >
              {markingAll ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={unreadCount === 0 ? "#CBD5E1" : "#3B82F6"}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      unreadCount === 0 ? "text-slate-300" : "text-blue-500"
                    }`}
                  >
                    Mark all read
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-sm text-slate-400 font-medium">
            Loading notifications…
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={useCallback(({ item }: { item: Notification }) => (
            <NotificationCard
              item={item}
              onMarkRead={handleMarkRead}
              isNew={newIds.has(item.id)}
            />
          ), [handleMarkRead, newIds])}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={[
            { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
            notifications.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        />
      )}
    </View>
  );
};

export default Notifications;