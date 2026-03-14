import { View, Text, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  Bell, CheckCheck, ChevronRight, FileText,
  RefreshCw, Megaphone, Info, Building2, ShieldCheck,
} from 'lucide-react-native';
import { notificationApiClient } from '@/lib/client/notification';
import { useNotificationSSE } from '@/hooks/general/useNotificationSSE';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAccessToken } from '@/utils/general/token';
import { Notification } from '@/types/general/notification';

export function getNotificationMeta(type: string) {
  switch (type) {
    case 'new_complaint':
      return { icon: FileText, accent: '#2563EB', bg: '#EFF6FF', lightBg: '#F8FBFF', badge: 'New Complaint', label: 'New Complaint' };
    case 'complaint_under_review':
      return { icon: ShieldCheck, accent: '#7C3AED', bg: '#F5F3FF', lightBg: '#FDFCFF', badge: 'Under Review', label: 'Under Review' };
    case 'complaint_update':
    case 'update':
      return { icon: RefreshCw, accent: '#0891B2', bg: '#ECFEFF', lightBg: '#F8FEFF', badge: 'Update', label: 'Complaint Update' };
    case 'complaint_resolved':
    case 'success':
      return { icon: CheckCheck, accent: '#16A34A', bg: '#F0FDF4', lightBg: '#F8FFF9', badge: 'Resolved', label: 'Complaint Resolved' };
    case 'new_incident_forwarded_to_lgu':
      return { icon: Building2, accent: '#DC2626', bg: '#FEF2F2', lightBg: '#FFFAFA', badge: 'Forwarded to LGU', label: 'Forwarded to LGU' };
    case 'new_incident_forwarded_to_department':
      return { icon: Megaphone, accent: '#EA580C', bg: '#FFF7ED', lightBg: '#FFFCF8', badge: 'Forwarded to Dept.', label: 'Forwarded to Department' };
    case 'incident_update':
      return { icon: Building2, accent: '#DC2626', bg: '#FEF2F2', lightBg: '#FFFAFA', badge: 'Incident Update', label: 'Incident Update' };
    case 'info':
    default:
      return { icon: Info, accent: '#059669', bg: '#ECFDF5', lightBg: '#F8FFFC', badge: 'Info', label: 'Info' };
  }
}

function timeAgo(dateStr: string): string {
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  if (isNaN(diff)) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationItem({ item, onPress }: { item: Notification; onPress: () => void }) {
  const meta = getNotificationMeta(item.notification_type);
  const IconComponent = meta.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: item.is_read ? 0.04 : 0.1, shadowRadius: 8,
        elevation: item.is_read ? 1 : 3,
        borderWidth: item.is_read ? 1 : 0, borderColor: '#F1F5F9',
      }}
    >
      {!item.is_read && (
        <View style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          backgroundColor: meta.accent, borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
        }} />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingLeft: item.is_read ? 16 : 20 }}>
        <View style={{
          width: 42, height: 42, borderRadius: 12, backgroundColor: meta.bg,
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <IconComponent size={18} color={meta.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ backgroundColor: meta.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: meta.accent, letterSpacing: 0.4 }}>
                {meta.badge.toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>{timeAgo(item.sent_at)}</Text>
          </View>
          <Text style={{
            fontSize: 14, lineHeight: 20, marginBottom: 3,
            fontWeight: item.is_read ? '500' : '700',
            color: item.is_read ? '#475569' : '#0F172A',
          }}>
            {item.title}
          </Text>
          <Text numberOfLines={2} style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>
            {item.message}
          </Text>
        </View>

        <ChevronRight size={16} color="#CBD5E1" style={{ marginLeft: 8, marginTop: 10 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const token = getAccessToken();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApiClient.get('/');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  useNotificationSSE({ token });

  const handleMarkAllRead = async () => {
    try {
      await notificationApiClient.post('/read-all');
      markAllAsRead();
    } catch (e) { console.error(e); }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApiClient.post(`/${id}/read`);
      markAsRead(id);
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={{
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} color="#2563EB" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>
              Notifications
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EFF6FF' }}
            >
              <CheckCheck size={15} color="#2563EB" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563EB' }}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {unreadCount > 0 && (
          <View style={{
            marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EFF6FF',
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' }} />
            <Text style={{ fontSize: 13, color: '#1D4ED8', fontWeight: '600' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={28} color="#2563EB" />
          </View>
          <Text style={{ marginTop: 12, color: '#94A3B8', fontWeight: '500' }}>Loading notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, flexGrow: 1 }}
          alwaysBounceVertical
          bounces
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bell size={36} color="#CBD5E1" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 }}>All caught up!</Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 }}>
                You have no notifications right now. Check back later.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => {
                if (!item.is_read) handleMarkRead(item.id);
                router.push({ pathname: '/notifications/[id]', params: { id: item.id, data: JSON.stringify(item) } });
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}