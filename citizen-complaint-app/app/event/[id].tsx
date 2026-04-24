// app/event/[id].tsx — Event Detail Screen
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, StatusBar,
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, MapPin, Clock, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';
import { eventApiClient } from '@/lib/client/event';
import ErrorScreen from '@/screen/general/ErrorScreen';
import { getEventErrorType } from '@/utils/event/eventError';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
const { width: SW } = Dimensions.get('window');

interface EventMedia { id: number; media_url: string; media_type: string; uploaded_at: string; }
interface EventData  { id: number; event_name: string; description?: string; date: string; location?: string; media: EventMedia[]; }

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return {
    monthShort: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day:        d.getDate(),
    weekday:    d.toLocaleString('en-US', { weekday: 'long' }),
    time:       d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    full:       d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    year:       d.getFullYear(),
  };
}

// ── Shared nav bar ────────────────────────────────────────────────────────────
function NavBar({ onBack, title, rightSlot }: { onBack: () => void; title: string; rightSlot?: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
      <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color="#1E293B" />
      </TouchableOpacity>
      <Text style={{ flex: 1, color: '#0F172A', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={1}>
        {title}
      </Text>
      {rightSlot}
    </View>
  );
}

// ── Media gallery ─────────────────────────────────────────────────────────────
function MediaGallery({ media }: { media: EventMedia[] }) {
  const [active, setActive] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!media.length) return null;

  return (
    <View style={{ height: 260 }}>
      <Animated.ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / SW))}
        scrollEventThrottle={16}
      >
        {media.map((m) => (
          <Image key={m.id} source={{ uri: m.media_url }} style={{ width: SW, height: 260 }} resizeMode="cover" />
        ))}
      </Animated.ScrollView>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      {media.length > 1 && (
        <>
          <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {media.map((_, i) => (
              <View key={i} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? '#fff' : 'rgba(255,255,255,0.45)' }} />
            ))}
          </View>
          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ImageIcon size={10} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{active + 1} / {media.length}</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: THEME.primary + '1A', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color={THEME.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{label}</Text>
        <Text style={{ color: '#1E293B', fontSize: 14, fontWeight: '600', lineHeight: 20 }}>{value}</Text>
      </View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EventDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const { data: event, isLoading, isError, error, refetch, isFetching } = useQuery<EventData>({
    queryKey: ['event', id],
    queryFn:  async () => {
      const res = await eventApiClient.get(`/${id}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  useEffect(() => {
    if (!isLoading && !isError && event) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [isLoading, isError, event]);

  const { type: errorType, message: errorMessage } = getEventErrorType(error);

  // ── Loading ──
  if (isLoading) return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <NavBar onBack={() => router.back()} title={t('eventDetails.title')} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={THEME.primary} size="large" />
        <Text style={{ color: '#64748B', fontSize: 13 }}>{t('eventDetails.loading')}</Text>
      </View>
    </View>
  );

  // ── Error ──
  if (isError || !event) return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <NavBar onBack={() => router.back()} title={t('eventDetails.title')} />
      <ErrorScreen
        type={errorType}
        message={errorMessage}
        onRetry={refetch}
        retryLoading={isFetching}
        fullScreen={false}
        secondaryAction={{ label: t('eventDetails.goBack'), onPress: () => router.back() }}
      />
    </View>
  );

  // ── Success ──
  const { monthShort, day, weekday, time, full, year } = formatDate(event.date);
  const hasMedia = event.media.length > 0;

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#fff', opacity: fadeAnim }}>
      <StatusBar barStyle="dark-content" />
      <NavBar onBack={() => router.back()} title={t('eventDetails.title')} />

      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* Media gallery */}
        {hasMedia && <MediaGallery media={event.media} />}

        {/* Hero block */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ backgroundColor: THEME.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{weekday}, {monthShort} {day}, {year}</Text>
            </View>
          </View>
          <Text style={{ color: '#0F172A', fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 8 }}>
            {event.event_name}
          </Text>
          {event.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color={THEME.primary} />
              <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>{event.location}</Text>
            </View>
          )}
        </View>

        {/* Info section */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginTop: 8 }}>
          <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 16, paddingBottom: 4 }}>
            {t('eventDetails.info.title')}
          </Text>
          <DetailRow icon={CalendarDays} label={t('eventDetails.info.date')}     value={full} />
          <DetailRow icon={Clock}        label={t('eventDetails.info.time')}     value={time} />
          {event.location && <DetailRow icon={MapPin} label={t('eventDetails.info.location')} value={event.location} />}
        </View>

        {/* About */}
        {event.description && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 24, marginTop: 8 }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 16, paddingBottom: 12 }}>
              {t('eventDetails.about')}
            </Text>
            <Text style={{ color: '#334155', fontSize: 14, lineHeight: 23 }}>
              {event.description}
            </Text>
          </View>
        )}

        {/* No media placeholder */}
        {!hasMedia && (
          <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 8, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 }}>
            <CalendarDays size={28} color="#CBD5E1" />
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500' }}>{t('eventDetails.media.noPhotos')}</Text>
          </View>
        )}

        {/* Media count chip */}
        {hasMedia && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 40, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <ImageIcon size={14} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>
                {event.media.length} {event.media.length === 1 ? 'photo' : 'photos'} attached
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </Animated.View>
  );
}