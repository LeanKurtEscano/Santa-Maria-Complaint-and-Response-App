// app/events.tsx — All Events Screen
import {
  View, Text, FlatList, TouchableOpacity,
  Image, ActivityIndicator, TextInput, Animated, StatusBar,
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CalendarDays, MapPin, Clock, Search, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react-native';
import { eventApiClient } from '@/lib/client/event';
import ErrorScreen from '@/screen/general/ErrorScreen';
import { getEventErrorType } from '@/utils/event/eventError';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
interface EventMedia { id: number; media_url: string; media_type: string; uploaded_at: string; }
interface EventData  { id: number; event_name: string; description?: string; date: string; location?: string; media: EventMedia[]; }

const ACCENTS = [
  { color: THEME.primary, dark: THEME.primaryDark, text: '#BFDBFE' },
  { color: '#0E7490', dark: '#164E63', text: '#A5F3FC' },
  { color: '#6D28D9', dark: '#3B0764', text: '#DDD6FE' },
  { color: '#047857', dark: '#064E3B', text: '#A7F3D0' },
];

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return {
    monthShort: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day:        d.getDate(),
    weekday:    d.toLocaleString('en-US', { weekday: 'long' }),
    time:       d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

function getThumbnail(media: EventMedia[]) {
  if (!media?.length) return null;
  return (media.find((m) => m.media_type.startsWith('image')) ?? media[0]).media_url;
}

// ── Card WITH media ───────────────────────────────────────────────────────────
function MediaEventCard({ event, onPress }: { event: EventData; onPress: () => void }) {
  const { monthShort, day, time } = formatDate(event.date);
  const thumbnail = getThumbnail(event.media)!;
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }} className="mx-4 mb-3">
      <TouchableOpacity
        activeOpacity={1} onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.982, useNativeDriver: true, damping: 20, stiffness: 300 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 300 }).start()}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 }}
      >
        <View className="w-full h-[170px]">
          <Image source={{ uri: thumbnail }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute bottom-0 left-0 right-0 h-20" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <View className="absolute bottom-3 left-3 flex-row items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 }}>
            <CalendarDays size={11} color={THEME.primary} />
            <Text style={{ color: THEME.primary, fontSize: 11, fontWeight: '700' }}>{monthShort} {day}</Text>
          </View>
          <View className="absolute bottom-3 right-3 flex-row items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Clock size={10} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{time}</Text>
          </View>
        </View>
        <View className="px-4 pt-3 pb-3.5">
          <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 4 }} numberOfLines={2}>
            {event.event_name}
          </Text>
          {event.description ? (
            <Text style={{ color: '#475569', fontSize: 12, lineHeight: 17, marginBottom: 8 }} numberOfLines={2}>
              {event.description}
            </Text>
          ) : null}
          <View className="flex-row items-center justify-between mt-1">
            {event.location ? (
              <View className="flex-row items-center gap-1.5 flex-1 mr-3">
                <MapPin size={11} color="#475569" />
                <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500', flex: 1 }} numberOfLines={1}>{event.location}</Text>
              </View>
            ) : <View className="flex-1" />}
            <View className="flex-row items-center gap-1">
              <Text style={{ color: THEME.primary, fontSize: 11, fontWeight: '600' }}>View details</Text>
              <ChevronRight size={12} color={THEME.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Card WITHOUT media ────────────────────────────────────────────────────────
function AnnouncementEventCard({ event, index, onPress }: { event: EventData; index: number; onPress: () => void }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const { monthShort, day, weekday, time } = formatDate(event.date);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }} className="mx-4 mb-3">
      <TouchableOpacity
        activeOpacity={1} onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.982, useNativeDriver: true, damping: 20, stiffness: 300 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 300 }).start()}
        className="rounded-2xl overflow-hidden"
        style={{ shadowColor: accent.dark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}
      >
        <View style={{ backgroundColor: accent.dark, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
          <View className="flex-row items-center justify-between mb-2.5">
            <View style={{ backgroundColor: accent.color, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{weekday} · {monthShort} {day}</Text>
            </View>
            <View className="flex-row items-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>View</Text>
              <ArrowRight size={9} color="#fff" />
            </View>
          </View>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 22 }} numberOfLines={2}>{event.event_name}</Text>
        </View>
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}>
          {event.description ? (
            <Text style={{ color: '#475569', fontSize: 12, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>{event.description}</Text>
          ) : null}
          <View className="flex-row items-center gap-3">
            {event.location && (
              <View className="flex-row items-center gap-1.5 flex-1">
                <MapPin size={10} color="#475569" />
                <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500', flex: 1 }} numberOfLines={1}>{event.location}</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1.5">
              <Clock size={10} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500' }}>{time}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EventRow({ event, index, onPress }: { event: EventData; index: number; onPress: () => void }) {
  return getThumbnail(event.media)
    ? <MediaEventCard     event={event} onPress={onPress} />
    : <AnnouncementEventCard event={event} index={index} onPress={onPress} />;
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const router = useRouter();
  const [query, setQuery]     = useState('');
  const [focused, setFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {t} = useTranslation();

  const { data: events = [], isLoading, isError, error, refetch, isFetching } = useQuery<EventData[]>({
    queryKey: ['events'],
    queryFn:  async () => {
      const res = await eventApiClient.get('/');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const filtered = query
    ? events.filter((e) => e.event_name.toLowerCase().includes(query.toLowerCase()) || e.location?.toLowerCase().includes(query.toLowerCase()))
    : events;

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isLoading]);

  const { type: errorType, message: errorMessage } = getEventErrorType(error);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#F1F5F9', opacity: fadeAnim }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 }}>
        <View className="flex-row items-center px-4 pt-14 pb-3 gap-3">
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={18} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>{t('viewAllEvents.title')}</Text>
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>{t('viewAllEvents.subtitle')}</Text>
          </View>
          {!isLoading && !isError && (
            <View style={{ backgroundColor: THEME.primaryDark, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{filtered.length}</Text>
            </View>
          )}
          {/* Subtle refetch spinner when background-refreshing */}
          {isFetching && !isLoading && (
            <ActivityIndicator size="small" color={THEME.primary} />
          )}
        </View>

        {/* Search — only show when data loaded */}
        {!isError && (
          <View className="px-4 pb-3">
            <View
              className="flex-row items-center rounded-xl px-3 gap-2.5"
              style={{ backgroundColor: focused ? '#fff' : '#F8FAFC', borderWidth: 1.5, borderColor: focused ? THEME.primary : '#E2E8F0' }}
            >
              <Search size={15} color={focused ? THEME.primary : '#94A3B8'} />
              <TextInput
                style={{ flex: 1, paddingVertical: 11, fontSize: 13, color: '#0F172A' }}
                placeholder={t('viewAllEvents.searchPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={THEME.primary} size="large" />
          <Text style={{ color: '#64748B', fontSize: 13 }}>{t('viewAllEvents.loading')}</Text>
        </View>
      ) : isError ? (
        <ErrorScreen
          type={errorType}
          message={errorMessage}
          onRetry={refetch}
          retryLoading={isFetching}
          fullScreen={false}
          secondaryAction={{ label: 'Go Back', onPress: () => router.back() }}
        />
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={24} color="#64748B" />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '600' }}>
              {query ? t('viewAllEvents.noResults') : t('viewAllEvents.noEventsYet')}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              {query ? t('viewAllEvents.noResultsMessage', { query }) : t('viewAllEvents.noEventsMessage')}
            </Text>
          </View>
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} style={{ backgroundColor: THEME.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{t('viewAllEvents.clearSearch')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
          renderItem={({ item, index }) => (
            <EventRow event={item} index={index} onPress={() => router.push(`/event/${item.id}`)} />
          )}
          ListHeaderComponent={
            <Text style={{ paddingHorizontal: 16, marginBottom: 12, color: '#64748B', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
              {t('viewAllEvents.forQuery', { query: query })}
            </Text>
          }
        />
      )}
    </Animated.View>
  );
}