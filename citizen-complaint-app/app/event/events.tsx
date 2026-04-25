// app/events.tsx — All Events Screen
import {
  View, Text, FlatList, TouchableOpacity,
  Image, ActivityIndicator, TextInput, Animated, StatusBar,
} from 'react-native';
import { useRef, useEffect, useState, useMemo } from 'react';
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

const PAGE_SIZE = 10;

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

// ── Pagination Bar ────────────────────────────────────────────────────────────
function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build visible page numbers with ellipsis logic
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
      gap: 6,
    }}>
      {/* Prev */}
      <TouchableOpacity
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: currentPage === 1 ? '#F1F5F9' : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: currentPage === 1 ? '#E2E8F0' : '#CBD5E1',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: currentPage === 1 ? 0 : 0.06,
          shadowRadius: 3,
          elevation: currentPage === 1 ? 0 : 2,
        }}
      >
        <ChevronLeft size={16} color={currentPage === 1 ? '#CBD5E1' : '#475569'} />
      </TouchableOpacity>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === '...' ? (
          <View key={`ellipsis-${i}`} style={{ width: 28, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '500' }}>···</Text>
          </View>
        ) : (
          <TouchableOpacity
            key={page}
            onPress={() => onPageChange(page as number)}
            style={{
              minWidth: 36,
              height: 36,
              paddingHorizontal: 6,
              borderRadius: 10,
              backgroundColor: currentPage === page ? THEME.primary : '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: currentPage === page ? THEME.primary : '#E2E8F0',
              shadowColor: currentPage === page ? THEME.primary : '#0F172A',
              shadowOffset: { width: 0, height: currentPage === page ? 2 : 1 },
              shadowOpacity: currentPage === page ? 0.3 : 0.06,
              shadowRadius: currentPage === page ? 6 : 3,
              elevation: currentPage === page ? 4 : 1,
            }}
          >
            <Text style={{
              color: currentPage === page ? '#fff' : '#475569',
              fontSize: 13,
              fontWeight: currentPage === page ? '700' : '500',
            }}>
              {page}
            </Text>
          </TouchableOpacity>
        )
      )}

      {/* Next */}
      <TouchableOpacity
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: currentPage === totalPages ? '#F1F5F9' : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: currentPage === totalPages ? '#E2E8F0' : '#CBD5E1',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: currentPage === totalPages ? 0 : 0.06,
          shadowRadius: 3,
          elevation: currentPage === totalPages ? 0 : 2,
        }}
      >
        <ChevronRight size={16} color={currentPage === totalPages ? '#CBD5E1' : '#475569'} />
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const router = useRouter();
  const [query, setQuery]       = useState('');
  const [focused, setFocused]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listRef  = useRef<FlatList>(null);
  const { t } = useTranslation();

  const { data: events = [], isLoading, isError, error, refetch, isFetching } = useQuery<EventData[]>({
    queryKey: ['events'],
    queryFn:  async () => {
      const res = await eventApiClient.get('/');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const filtered = useMemo(
    () => query
      ? events.filter((e) =>
          e.event_name.toLowerCase().includes(query.toLowerCase()) ||
          e.location?.toLowerCase().includes(query.toLowerCase()))
      : events,
    [events, query],
  );

  // Reset to page 1 whenever the search query changes
  useEffect(() => { setCurrentPage(1); }, [query]);

  const usePagination = filtered.length >= PAGE_SIZE;
  const totalPages    = usePagination ? Math.ceil(filtered.length / PAGE_SIZE) : 1;

  const paginatedData = useMemo(
    () => usePagination
      ? filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
      : filtered,
    [filtered, currentPage, usePagination],
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

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

        {/* Pagination summary pill — shown when pagination is active */}
        {!isLoading && !isError && usePagination && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 10, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '500' }}>
                Page {currentPage} of {totalPages}
              </Text>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '500' }}>
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} events
              </Text>
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
          ref={listRef}
          data={paginatedData}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          renderItem={({ item, index }) => (
            <EventRow
              event={item}
              index={index}
              onPress={() => router.push(`/event/${item.id}`)}
            />
          )}
          
          ListFooterComponent={
            usePagination ? (
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            ) : (
              <View style={{ height: 32 }} />
            )
          }
        />
      )}
    </Animated.View>
  );
}