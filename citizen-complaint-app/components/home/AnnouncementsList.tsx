import {
  View, Text, Animated, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, AlertCircle, RefreshCw, Megaphone, ImageOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Tag, Avatar, DateChip } from './ui';
import { MediaCarousel } from './MediaCarousel';
import { timeAgo, uploaderLabel } from '@/utils/home/home';
import { formatDate } from '@/constants/complaint/complaint';
import { useSettingsLogic } from '@/hooks/general/useSetting';
import { Announcement } from '@/types/general/home';
import { THEME } from '@/constants/theme';

const CARD_WIDTH = 320;
const CARD_GAP   = 16;
const CARD_STEP  = CARD_WIDTH + CARD_GAP;
const AUTO_SCROLL_INTERVAL = 2400;
const MEDIA_HEIGHT = 228; // match whatever height MediaCarousel renders at

// Fixed heights so every card is identical no matter the content length
const TITLE_LINES     = 2;
const TITLE_LINE_H    = 20; // px, matches leading-snug @ 16px
const TITLE_HEIGHT    = TITLE_LINES * TITLE_LINE_H;

const CONTENT_LINES   = 4;
const CONTENT_LINE_H  = 20; // px, matches leading-5
const CONTENT_HEIGHT  = CONTENT_LINES * CONTENT_LINE_H;

const SEE_MORE_HEIGHT = 18; // reserved even when not shown

function NoImagePlaceholder() {
  const { t } = useTranslation();
  return (
    <View
      style={{
        height: MEDIA_HEIGHT,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: '#EEF2FF',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ImageOff size={18} color="#94A3B8" />
      </View>
      <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>
        {t('announcements.no_image')}
      </Text>
    </View>
  );
}

export function AnnouncementCard({ item, index }: { item: Announcement; index: number }) {
  const router = useRouter();
  const { currentLanguage } = useSettingsLogic();
  const { t } = useTranslation();
  const name = uploaderLabel(item.uploader);
  const [isTruncated, setIsTruncated] = useState(false);

  const goToDetail = () => router.push(`/announcements/${item.id}`);

  return (
    <View
      style={{ width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E8EFFE', shadowColor: THEME.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 }}
    >
      {item.media.length > 0 ? <MediaCarousel media={item.media} /> : <NoImagePlaceholder />}

      <TouchableOpacity activeOpacity={0.75} onPress={goToDetail}>
        <View className="px-4 pb-4 pt-3">
          {/* Header row — same height regardless of tag/timestamp text */}
          <View className="flex-row items-center justify-between mb-2.5" style={{ height: 20 }}>
            <Tag label={t('announcements.tag')} />
            <View className="flex-row items-center gap-1">
              <Clock size={10} color="#94A3B8" />
              <Text className="text-slate-400 text-[10px] font-semibold">{timeAgo(item.created_at, currentLanguage)}</Text>
            </View>
          </View>

          {/* Title — fixed height, always reserves 2 lines */}
          <View style={{ height: TITLE_HEIGHT, marginBottom: 8 }}>
            <Text
              style={{ color: '#0F172A', fontSize: 16, fontWeight: '800', lineHeight: TITLE_LINE_H }}
              numberOfLines={TITLE_LINES}
            >
              {item.title}
            </Text>
          </View>

          {/* Content — fixed height, always reserves 4 lines */}
          <View style={{ height: CONTENT_HEIGHT }}>
            <Text
              style={{ color: '#64748B', fontSize: 13, lineHeight: CONTENT_LINE_H }}
              numberOfLines={CONTENT_LINES}
              onTextLayout={(e) => {
                if (e.nativeEvent.lines.length >= CONTENT_LINES && !isTruncated) {
                  setIsTruncated(true);
                }
              }}
            >
              {item.content}
            </Text>
          </View>

          {/* See more — space always reserved, text only visible when truncated */}
          <View style={{ height: SEE_MORE_HEIGHT, marginTop: 2, justifyContent: 'center' }}>
            {isTruncated && (
              <TouchableOpacity onPress={goToDetail} activeOpacity={0.7} hitSlop={{ top: 4, bottom: 4 }}>
                <Text style={{ color: THEME.primary, fontSize: 12, fontWeight: '700' }}>
                  {t('announcements.see_more')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2 mb-3.5">
            <DateChip date={formatDate(item.created_at)} />
          </View>

          <View className="h-px bg-slate-100 mb-3" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1 mr-3">
              <Avatar name={name} />
              <Text className="text-slate-500 text-[11px] font-semibold flex-1" numberOfLines={1}>{name}</Text>
            </View>
            <View
              className="flex-row items-center gap-1 rounded-xl px-3 py-2"
              style={{ backgroundColor: THEME.primaryMuted }}
            >
              <Text style={{ color: THEME.primary, fontSize: 12, fontWeight: '700' }}>{t('announcements.read_more')}</Text>
              <ChevronRight size={12} color={THEME.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function LoadingState() {
  const { t } = useTranslation();
  return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color={THEME.primary} />
      <Text className="text-slate-400 text-[13px] font-semibold mt-3">{t('announcements.loading')}</Text>
    </View>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <View className="items-center py-12">
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: THEME.primaryMuted }}
      >
        <Megaphone size={28} color={THEME.primary} />
      </View>
      <Text className="text-slate-700 text-[15px] font-bold mb-1">{t('announcements.empty_title')}</Text>
      <Text className="text-slate-400 text-[13px] text-center">{t('announcements.empty_body')}</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center py-12">
      <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-3">
        <AlertCircle size={28} color="#E11D48" />
      </View>
      <Text className="text-slate-700 text-[15px] font-bold mb-1">{t('announcements.error_title')}</Text>
      <Text className="text-slate-400 text-[13px] text-center mb-4">{t('announcements.error_body')}</Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        className="flex-row items-center gap-2 rounded-full px-4 py-2.5"
        style={{ backgroundColor: THEME.primaryMuted, borderWidth: 1, borderColor: THEME.primary + '33' }}
      >
        <RefreshCw size={13} color={THEME.primary} />
        <Text style={{ color: THEME.primary, fontSize: 13, fontWeight: '700' }}>{t('announcements.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? THEME.primary : '#CBD5E1' }} />
      ))}
    </View>
  );
}

export function AnnouncementsList({ data, isLoading, isError, onRetry }: {
  data?: Announcement[]; isLoading: boolean; isError: boolean; onRetry: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef  = useRef<any>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = useRef(0);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!data || data.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!flatListRef.current) return;
      const next = (currentIndex.current + 1) % data.length;
      flatListRef.current.scrollToIndex({ index: next, animated: true });
      currentIndex.current = next;
      setActiveIndex(next);
    }, AUTO_SCROLL_INTERVAL);
  }, [data]);

  useEffect(() => {
    startAutoScroll();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [data?.length, startAutoScroll]);

  const onScrollBeginDrag   = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const onMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_STEP);
    currentIndex.current = index;
    setActiveIndex(index);
    startAutoScroll();
  };

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState onRetry={onRetry} />;
  if (!data?.length) return <EmptyState />;

  return (
    <View style={{ marginBottom: 12 }}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item: Announcement) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_STEP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP, paddingBottom: 4 }}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        renderItem={({ item, index }: { item: Announcement; index: number }) => (
          <AnnouncementCard item={item} index={index} />
        )}
        getItemLayout={(_: any, index: number) => ({ length: CARD_STEP, offset: CARD_STEP * index, index })}
      />
      {data.length > 1 && <DotIndicator count={data.length} active={activeIndex} />}
    </View>
  );
}