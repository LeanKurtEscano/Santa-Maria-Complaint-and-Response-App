// store/useNotificationStore.ts

import { create } from 'zustand';
import { Notification } from '@/types/general/notification';
import { SSENotificationData } from '@/constants/general/notification';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  prependNotification: (data: SSENotificationData, type: string, userId?: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  

  setNotifications: (notifications) =>
  set((state) => {
    // Real DB notifications take priority over SSE-prepended ones
    const merged = [
      ...notifications,
      ...state.notifications.filter(
        n => !notifications.some(db => db.complaint_id === n.complaint_id && db.notification_type === n.notification_type)
      ),
    ];
    return {
      notifications: merged,
      unreadCount: merged.filter(n => !n.is_read).length,
    };
  }),
  prependNotification: (data, type, userId) => {
    const incoming: Notification = {
      id: Date.now(),
      title: data.title ?? type.replace(/_/g, ' '),
      message: data.message ?? data.description ?? '',
      user_id: userId,
      complaint_id: data.complaint_id ?? null,
      channel: 'sse',
      notification_type: type,
      sent_at: new Date().toISOString(),
      is_read: false,
    };
    set(state => ({
      notifications: [incoming, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) =>
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
}));