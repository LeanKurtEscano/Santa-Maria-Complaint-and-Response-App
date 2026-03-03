import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Calendar, Hash, Radio, Tag, CheckCircle2, Circle,
} from 'lucide-react-native';
import { Notification } from '@/types/general/notification';
import { getNotificationMeta } from '../(tabs)/Notifications';
import { formatDate, formatTime } from '@/constants/complaint/complaint';

function MetaRow({ icon: Icon, label, value, accent }: {
  icon: any; label: string; value: string; accent: string;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        <Icon size={16} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 1, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 14, color: '#334155', fontWeight: '500' }}>{value}</Text>
      </View>
    </View>
  );
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();

  const notification: Notification | null = (() => {
    try {
      return data ? JSON.parse(decodeURIComponent(data as string)) : null;
    } catch {
      return null;
    }
  })();

  if (!notification) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#94A3B8' }}>Notification not found.</Text>
      </SafeAreaView>
    );
  }

  const meta = getNotificationMeta(notification?.notification_type ?? 'info');
  const IconComponent = meta.icon;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC',
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
            borderWidth: 1, borderColor: '#E2E8F0',
          }}
        >
          <ArrowLeft size={18} color="#334155" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A', flex: 1 }}>
          Notification Detail
        </Text>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
          backgroundColor: notification.is_read ? '#F1F5F9' : '#EFF6FF',
        }}>
          <Text style={{
            fontSize: 11, fontWeight: '600',
            color: notification.is_read ? '#64748B' : '#2563EB',
          }}>
            {notification.is_read ? 'READ' : 'UNREAD'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Hero card */}
        <View style={{
          borderRadius: 20, overflow: 'hidden', marginBottom: 16,
          backgroundColor: '#FFFFFF',
          shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
        }}>
          {/* Colored top strip */}
          <View style={{ height: 4, backgroundColor: meta.accent }} />

          <View style={{ padding: 20 }}>
            {/* Icon + badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 16,
                backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center',
              }}>
                <IconComponent size={24} color={meta.accent} />
              </View>
              <View>
                <View style={{
                  backgroundColor: meta.bg, borderRadius: 20,
                  paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: meta.accent, letterSpacing: 0.4 }}>
                    {meta.label.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {notification.is_read
                    ? <CheckCircle2 size={13} color="#94A3B8" />
                    : <Circle size={13} color="#2563EB" />
                  }
                  <Text style={{ fontSize: 12, color: notification.is_read ? '#94A3B8' : '#2563EB', fontWeight: '500' }}>
                    {notification.is_read ? 'Read' : 'Unread'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 20, fontWeight: '800', color: '#0F172A',
              letterSpacing: -0.4, lineHeight: 26, marginBottom: 10,
            }}>
              {notification.title}
            </Text>

            {/* Message body */}
            <View style={{
              backgroundColor: meta.lightBg, borderRadius: 12,
              padding: 14, borderLeftWidth: 3, borderLeftColor: meta.accent,
            }}>
              <Text style={{ fontSize: 15, color: '#334155', lineHeight: 22, fontWeight: '400' }}>
                {notification.message}
              </Text>
            </View>
          </View>
        </View>

        {/* Details card */}
        <View style={{
          borderRadius: 20, backgroundColor: '#FFFFFF', padding: 20,
          shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
        }}>
          <Text style={{
            fontSize: 13, fontWeight: '700', color: '#94A3B8',
            letterSpacing: 0.8, marginBottom: 4,
          }}>
            DETAILS
          </Text>

          <MetaRow icon={Calendar} label="Date" value={formatDate(notification.sent_at)} accent={meta.accent} />
          <MetaRow icon={Calendar} label="Time" value={formatTime(notification.sent_at)} accent={meta.accent} />
          <MetaRow icon={Hash} label="Notification ID" value={`#${notification.id}`} accent={meta.accent} />
          
        
          <View style={{ paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC',
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Tag size={16} color={meta.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 4, letterSpacing: 0.3 }}>
                  Status
                </Text>
                <View style={{ backgroundColor: meta.bg, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: meta.accent }}>
                    {(notification.notification_type ?? 'info').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}