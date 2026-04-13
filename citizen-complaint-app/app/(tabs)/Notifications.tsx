import { notificationApiClient } from "@/lib/client/notification";
import { getAccessToken } from "@/utils/general/token";
import { useNotificationStore } from "@/store/useNotificationStore";
import { Notification } from "@/types/general/notification";
import { TYPE_CONFIG } from "@/constants/general/notification";
import { useEffect, useRef, useCallback, useState } from "react";
import { SSEStatus } from "@/types/general/notification";
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
import { useTranslation } from "react-i18next";
import { formatTime } from "@/utils/date/date";
import { refreshAccessToken } from "@/utils/general/token";
import { THEME } from "@/constants/theme";

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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isNew || hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isNew]);

  const handlePress = () => {
    if (item.complaint_id) {
      if (!item.is_read) onMarkRead(item.id);
      router.push(`/complaints/${item.complaint_id}`);
    }
  };

  const message = t(config.messageKey, { title: item.title });
  const [isTruncatable, setIsTruncatable] = useState(false);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {!isTruncatable && (
        <Text
          style={{ position: "absolute", opacity: 0, fontSize: 13, lineHeight: 18 }}
          onTextLayout={(e) => {
            if (e.nativeEvent.lines.length > 1) {
              setIsTruncatable(true);
            }
          }}
        >
          {message}
        </Text>
      )}

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={item.complaint_id ? 0.7 : 1}
        className="flex-row items-start rounded-2xl p-4 mb-3 gap-3"
        style={[
          item.is_read
            ? { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#f1f5f9" }
            : { backgroundColor: `${THEME.primary}0f`, borderWidth: 1, borderColor: `${THEME.primary}30` },
          Platform.OS === "ios"
            ? {
                shadowColor: "#94A3B8",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
              }
            : isNew ? undefined : { elevation: 2 },
        ]}
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
                {t(config.labelKey)}
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400 font-medium">
              {formatTime(item.sent_at)}
            </Text>
          </View>

          {/* Title */}
          <Text
            className="text-sm font-semibold leading-5"
            style={{ color: item.is_read ? "#64748b" : "#0f172a" }}
          >
            {t(config.titleKey)}
          </Text>

          {/* Message — expandable */}
          <Text
            className="text-[13px] text-slate-500 leading-[18px]"
            numberOfLines={expanded ? undefined : 2}
          >
            {message}
          </Text>

          {/* View more / View less toggle */}
          {isTruncatable && (
            <TouchableOpacity
              onPress={() => setExpanded((prev) => !prev)}
              activeOpacity={0.6}
              className="self-start mt-0.5"
            >
              <Text className="text-[12px] font-semibold" style={{ color: THEME.primary }}>
                {expanded ? "View less" : "View more"}
              </Text>
            </TouchableOpacity>
          )}

          {!item.is_read && (
            <View className="flex-row justify-end mt-1.5">
              <TouchableOpacity
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white"
                style={{ borderWidth: 1, borderColor: `${THEME.primary}40` }}
                onPress={() => onMarkRead(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark" size={11} color={THEME.primary} />
                <Text className="text-[11px] font-semibold" style={{ color: THEME.primary }}>
                  Mark as read
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center pt-20 gap-3">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${THEME.primary}15` }}
      >
        <Ionicons name="notifications-off-outline" size={38} color={`${THEME.primary}99`} />
      </View>
      <Text className="text-lg font-bold text-slate-900">
        {t("notifications.emptyTitle")}
      </Text>
      <Text className="text-sm text-slate-400 text-center px-10 leading-5">
        {t("notifications.emptySubtitle")}
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Notifications = () => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const LOG_TAG = "[Notifications]";
  const { setNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();

  const [markingAll, setMarkingAll] = useState(false);
  const [sseStatus, setSseStatus] = useState<SSEStatus>("connecting");
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const prevIdsRef = useRef<Set<number>>(new Set());
  const eventSourceRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchNotificationsApi = async (): Promise<Notification[]> => {
    console.log(`${LOG_TAG} fetchNotificationsApi() — calling GET /`);
    const res = await notificationApiClient.get("/");
    console.log(
      `${LOG_TAG} fetchNotificationsApi() — received ${res.data?.length ?? 0} notifications`
    );
    return res.data;
  };

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotificationsApi,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
    notifyOnChangeProps: ["data", "error"],
  });


  console.log(notifications)

  // ── Sync query data → zustand store + detect new IDs for animation ───────

  useEffect(() => {
    if (!notifications.length) return;

    console.log(
      `${LOG_TAG} query sync — ${notifications.length} notifications, updating store`
    );
    setNotifications(notifications);

    const incoming = new Set(notifications.map((n) => n.id));

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
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [sseStatus]);

  // ── SSE ──────────────────────────────────────────────────────────────────

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
    const url = `${baseURL}/stream`;
    console.log(`${LOG_TAG} connectSSE() — connecting to: ${url}`);

    const es = new EventSource(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const handleEvent = (eventType: string) => () => {
      console.log(
        `${LOG_TAG} SSE event="${eventType}" received — invalidating query`
      );
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
      console.log(`${LOG_TAG} connectSSE() — connection opened ✓`);
      setSseStatus("connected");
    };

    es.onerror = async (err: any) => {
     
      setSseStatus("disconnected");
      es.close();
      eventSourceRef.current = null;

      const is401 = err?.status === 401 || err?.xhrStatus === 401;

      if (is401) {
        console.log(`${LOG_TAG} SSE 401 — attempting token refresh...`);
        const newToken = await refreshAccessToken();

        if (!newToken) {
          console.warn(`${LOG_TAG} Refresh failed — forcing logout`);
          const { useCurrentUser } = await import('@/store/useCurrentUserStore');
          useCurrentUser.getState().clearUser();
          return;
        }

        console.log(`${LOG_TAG} Token refreshed ✓ — reconnecting SSE`);
        setTimeout(connectSSE, 500);
      } else {
        console.log(`${LOG_TAG} connectSSE() — retrying in 5s...`);
        setTimeout(connectSSE, 5000);
      }
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

  const handleMarkRead = useCallback(async (id: number) => {
    console.log(`${LOG_TAG} handleMarkRead() — id=${id}`);
    try {
      markAsRead(id);
      await notificationApiClient.post(`/${id}/read`);
      console.log(`${LOG_TAG} handleMarkRead() — API success for id=${id}`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
    
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }, [markAsRead, queryClient]);

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
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
     
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Pull to refresh ──────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    console.log(`${LOG_TAG} onRefresh() — triggered`);
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  // ── Render item ──────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: Notification }) => (
    <NotificationCard
      item={item}
      onMarkRead={handleMarkRead}
      isNew={newIds.has(item.id)}
    />
  ), [handleMarkRead, newIds]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* ── Header ── */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">
              Notifications
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            {unreadCount > 0 && (
              <View
                className="rounded-full min-w-[24px] h-6 items-center justify-center px-1.5"
                style={{ backgroundColor: THEME.primary }}
              >
                <Text className="text-xs font-bold" style={{ color: "#ffffff" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border"
              style={
                unreadCount === 0
                  ? { borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }
                  : { borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}15` }
              }
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              activeOpacity={0.7}
            >
              {markingAll ? (
                <ActivityIndicator size="small" color={THEME.primary} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={unreadCount === 0 ? "#CBD5E1" : THEME.primary}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: unreadCount === 0 ? "#CBD5E1" : THEME.primary }}
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
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text className="text-sm text-slate-400 font-medium">
            Loading notifications…
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={[
            { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
            notifications.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
        />
      )}
    </View>
  );
};

export default Notifications;