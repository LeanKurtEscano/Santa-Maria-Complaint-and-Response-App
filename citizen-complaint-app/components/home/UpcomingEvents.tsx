// components/home/UpcomingEventsStrip.tsx
import { View, Text, Animated, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, MapPin, ArrowRight, Clock, RefreshCw, WifiOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { eventApiClient } from '@/lib/client/event';

const CARD_WIDTH = 260;
const CARD_GAP   = 14;
const CARD_STEP  = CARD_WIDTH + CARD_GAP;
const AUTO_SCROLL_INTERVAL = 1800;

interface EventMedia { id: number; media_url: string; media_type: string; uploaded_at: string; }
interface EventData  { id: number; event_name: string; description?: string; date: string; location?: string; media: EventMedia[]; }

function formatEventDate(isoDate: string) {
  const d = new Date(isoDate);
  return {
    month:   d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day:     d.getDate(),
    weekday: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
    time:    d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

function getThumbnail(media: EventMedia[]): string | null {
  if (!media?.length) return null;
  return (media.find((m) => m.media_type.startsWith('image')) ?? media[0]).media_url;
}

const ACCENTS = [
  { color: '#1D4ED8', dark: '#1E3A8A', text: '#DBEAFE' },
  { color: '#0E7490', dark: '#164E63', text: '#CFFAFE' },
  { color: '#6D28D9', dark: '#3B0764', text: '#EDE9FE' },
  { color: '#047857', dark: '#064E3B', text: '#D1FAE5' },
];

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, index, onPress }: { event: EventData; index: number; onPress: () => void }) {
  const accent    = ACCENTS[index % ACCENTS.length];
  const { month, day, weekday, time } = formatEventDate(event.date);
  const thumbnail = getThumbnail(event.media);
  const hasMedia  = !!thumbnail;
  const scale     = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, damping: 15, stiffness: 200 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 12, stiffness: 180 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_WIDTH }}>
      <TouchableOpacity
        activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 6 }}
      >
        {/* Top — fixed 150px */}
        <View style={{ width: '100%', height: 150, backgroundColor: accent.dark }}>
          {hasMedia ? (
            <>
              <Image source={{ uri: thumbnail! }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.50)' }} />
              <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 46, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
                <Text style={{ color: accent.color, fontSize: 20, fontWeight: '900', lineHeight: 22 }}>{day}</Text>
                <Text style={{ color: accent.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>{month}</Text>
              </View>
              <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: accent.color, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{weekday}</Text>
              </View>
            </>
          ) : (
            <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14 }}>
              {/* Date badge — accent color bg, white text, same square shape as image cards */}
              <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: accent.color, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 46 }}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 22 }}>{day}</Text>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>{month}</Text>
              </View>
              {/* Weekday pill bottom-right */}
              <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{weekday}</Text>
              </View>
              {/* Title + description to the right of the badge */}
              <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 62, paddingRight: 8, paddingTop: 4, paddingBottom: 4 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 20 }} numberOfLines={3}>
                  {event.event_name}
                </Text>
                {event.description ? (
                  <Text style={{ color: accent.text, fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 4, opacity: 0.85 }} numberOfLines={2}>
                    {event.description}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </View>

        {/* Body — fixed 100px */}
        <View style={{ height: 100, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, justifyContent: 'space-between', backgroundColor: '#fff' }}>
          <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '700', lineHeight: 18, opacity: hasMedia ? 1 : 0 }} numberOfLines={1}>
            {event.event_name}
          </Text>
          <View style={{ gap: 4 }}>
            {event.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} color="#475569" />
                <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500', flex: 1 }} numberOfLines={1}>{event.location}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={11} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500' }}>{time}</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>COMMUNITY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: accent.color, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Details</Text>
              <ArrowRight size={10} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Dot indicator ─────────────────────────────────────────────────────────────
function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? '#1D4ED8' : '#CBD5E1' }} />
      ))}
    </View>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function StripError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ height: 120, marginHorizontal: 20, borderRadius: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <WifiOff size={22} color="#EF4444" />
      <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600' }}>Failed to load events</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 }}
      >
        <RefreshCw size={12} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main strip ────────────────────────────────────────────────────────────────
export function UpcomingEventsStrip( {data:events, isLoading, isError, refetch}: {data?: EventData[]; isLoading: boolean; isError: boolean; refetch: () => void} ) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollX      = useRef(new Animated.Value(0)).current;
  const flatListRef  = useRef<any>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = useRef(0);
  const opacity      = useRef(new Animated.Value(0)).current;
  const translateY   = useRef(new Animated.Value(20)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 450, delay: 150, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 14, stiffness: 110, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!flatListRef.current || events.length === 0) return;
      const next = (currentIndex.current + 1) % events.length;
      flatListRef.current.scrollToIndex({ index: next, animated: true });
      currentIndex.current = next;
      setActiveIndex(next);
    }, AUTO_SCROLL_INTERVAL);
  }, [events.length]);

  useEffect(() => {
    if (events.length > 1) startAutoScroll();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [events.length, startAutoScroll]);

  const onScrollBeginDrag   = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const onMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_STEP);
    currentIndex.current = index;
    setActiveIndex(index);
    startAutoScroll();
  };

  return (
    <Animated.View style={{ marginBottom: 20, opacity, transform: [{ translateY }] }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ backgroundColor: '#1E3A8A', borderRadius: 12, padding: 8 }}>
            <CalendarDays size={16} color="#fff" />
          </View>
          <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '800' }}>Upcoming Events</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/event/events')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4ED8' }}>See All</Text>
          <ChevronRight size={13} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* States */}
      {isLoading ? (
        <View style={{ height: 260, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ActivityIndicator color="#1D4ED8" />
          <Text style={{ color: '#64748B', fontSize: 13 }}>Loading events…</Text>
        </View>
      ) : isError ? (
        <StripError onRetry={refetch} />
      ) : events.length === 0 ? (
        <View style={{ height: 110, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
            No upcoming events right now.{'\n'}Check back soon!
          </Text>
        </View>
      ) : (
        <>
          <Animated.FlatList
            ref={flatListRef}
            data={events}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_STEP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
            onScrollBeginDrag={onScrollBeginDrag}
            onMomentumScrollEnd={onMomentumScrollEnd}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <EventCard event={item} index={index} onPress={() => router.push(`/event/${item.id}`)} />
            )}
            getItemLayout={(_, index) => ({ length: CARD_STEP, offset: CARD_STEP * index, index })}
          />
          {events.length > 1 && <DotIndicator count={events.length} active={activeIndex} />}
        </>
      )}
    </Animated.View>
  );
}