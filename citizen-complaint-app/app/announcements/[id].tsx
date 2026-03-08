// app/(tabs)/announcements/[id].tsx
// ─────────────────────────────────────────────────────────────────────────────
// Announcement Detail Screen
// Full content view with back navigation, media carousel, and animations.
// ─────────────────────────────────────────────────────────────────────────────

import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  ImageIcon,
  Video as VideoIcon,
  Play,
  Share2,
  Megaphone,
  User,
} from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { announcementApiClient } from '@/lib/client/announcement';
import { ImageViewer, VideoPlayer } from '@/components/media/MediaViewer';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/constants/complaint/complaint';
import { useSettingsLogic } from '@/hooks/general/useSetting';
import { UploaderInfo, MediaItem, Announcement } from '@/types/general/home';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { uploaderLabel } from '@/utils/home/home';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DETAIL_MEDIA_WIDTH = SCREEN_WIDTH - 40; // px-5 padding on both sides
const HEADER_HEIGHT = Platform.OS === 'ios' ? 96 : (StatusBar.currentHeight ?? 24) + 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string, lang: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const isTl = lang === 'tl';
  if (m < 1)  return isTl ? 'kararating lang'                  : 'just now';
  if (m < 60) return isTl ? `${m}m ang nakakaraan`             : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isTl ? `${h}h ang nakakaraan`             : `${h}h ago`;
  return        isTl ? `${Math.floor(h / 24)}d ang nakakaraan`  : `${Math.floor(h / 24)}d ago`;
}



function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-blue-100 items-center justify-center"
    >
      <Text
        style={{ fontSize: size * 0.38 }}
        className="text-blue-600 font-black"
      >
        {name[0]?.toUpperCase() ?? 'L'}
      </Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-blue-50 border border-blue-100 px-3 py-1">
      <Text className="text-blue-600 text-[10px] font-bold tracking-wider uppercase">
        {label}
      </Text>
    </View>
  );
}

// ─── Carousel Dots ────────────────────────────────────────────────────────────

function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <View className="flex-row justify-center items-center gap-1.5 mt-3">
      {[...Array(count)].map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === active ? '#2563EB' : '#CBD5E1',
          }}
        />
      ))}
    </View>
  );
}

// ─── Media Count Badges ───────────────────────────────────────────────────────

function MediaCountBadges({ media }: { media: MediaItem[] }) {
  const imgs = media.filter(m => m.media_type === 'image').length;
  const vids = media.filter(m => m.media_type === 'video').length;
  if (!imgs && !vids) return null;
  return (
    <View className="absolute top-3 right-3 flex-row gap-1.5">
      {imgs > 0 && (
        <View className="flex-row items-center gap-1 bg-black/50 rounded-full px-2 py-1">
          <ImageIcon size={9} color="#fff" />
          <Text className="text-white text-[10px] font-bold">{imgs}</Text>
        </View>
      )}
      {vids > 0 && (
        <View className="flex-row items-center gap-1 bg-black/50 rounded-full px-2 py-1">
          <VideoIcon size={9} color="#fff" />
          <Text className="text-white text-[10px] font-bold">{vids}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Image Slide ──────────────────────────────────────────────────────────────

function ImageSlide({ uri, onPress }: { uri: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92}>
      <Image
        source={{ uri }}
        style={{ width: DETAIL_MEDIA_WIDTH, height: 240, borderRadius: 16 }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

// ─── Video Slide ──────────────────────────────────────────────────────────────

function VideoSlide({ uri, tapLabel, onPress }: { uri: string; tapLabel: string; onPress: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    VideoThumbnails.getThumbnailAsync(uri, { time: 1000 })
      .then(({ uri: t }) => setThumb(t))
      .catch(() => {});
  }, [uri]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <View
        style={{ width: DETAIL_MEDIA_WIDTH, height: 240, borderRadius: 16, overflow: 'hidden' }}
        className="bg-slate-900 items-center justify-center"
      >
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: thumb ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.55)' },
          ]}
        />
        <View className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 items-center justify-center">
          <Play size={30} color="white" fill="white" />
        </View>
        <Text className="text-white/70 text-xs font-semibold mt-3">{tapLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail Media Carousel ────────────────────────────────────────────────────

function DetailMediaCarousel({ media }: { media: MediaItem[] }) {
  const { t } = useTranslation();
  const [active,       setActive]       = useState(0);
  const [imageUri,     setImageUri]     = useState('');
  const [videoUri,     setVideoUri]     = useState('');
  const [imageVisible, setImageVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);

  if (media.length === 0) return null;

  return (
    <>
      <View className="mb-6">
        <View>
          <FlatList
            data={media}
            keyExtractor={m => m.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={DETAIL_MEDIA_WIDTH + 12}
            decelerationRate="fast"
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            onScroll={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (DETAIL_MEDIA_WIDTH + 12));
              setActive(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) =>
              item.media_type === 'image' ? (
                <ImageSlide
                  uri={item.media_url}
                  onPress={() => { setImageUri(item.media_url); setImageVisible(true); }}
                />
              ) : (
                <VideoSlide
                  uri={item.media_url}
                  tapLabel={t('media.tap_to_watch')}
                  onPress={() => { setVideoUri(item.media_url); setVideoVisible(true); }}
                />
              )
            }
          />
          <MediaCountBadges media={media} />
        </View>
        <CarouselDots count={media.length} active={active} />
      </View>

      <ImageViewer visible={imageVisible} uri={imageUri} onClose={() => setImageVisible(false)} />
      <VideoPlayer  visible={videoVisible} uri={videoUri}  onClose={() => setVideoVisible(false)} />
    </>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any;
}) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: anim },
        style,
      ]}
    />
  );
}

function DetailSkeleton() {
  return (
    <View className="px-5 pt-4">
      <SkeletonBlock width="100%" height={240} borderRadius={16} style={{ marginBottom: 24 }} />
      <SkeletonBlock width={80} height={24} borderRadius={12} style={{ marginBottom: 16 }} />
      <SkeletonBlock width="90%" height={30} borderRadius={6} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="70%" height={30} borderRadius={6} style={{ marginBottom: 24 }} />
      <SkeletonBlock width="100%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="100%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="85%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="92%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="60%" height={16} borderRadius={4} style={{ marginBottom: 32 }} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DETAIL SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { currentLanguage } = useSettingsLogic();

  // Entrance animations
  const headerOpacity   = useRef(new Animated.Value(0)).current;
  const contentOpacity  = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(24)).current;

  const { data, isLoading, isError, refetch } = useQuery<Announcement>({
    queryKey: ['announcement', id],
    queryFn: async () => {
      const res = await announcementApiClient.get(`/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 350, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 450, delay: 100, useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0, damping: 16, stiffness: 120, delay: 100, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [data]);

  const name = data ? uploaderLabel(data.uploader) : '';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>

      {/* ── Sticky Header Bar ── */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          backgroundColor: '#2563EB',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#1D4ED8',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.22)',
            borderRadius: 14,
            paddingVertical: 8,
            paddingHorizontal: 14,
          }}
        >
          <ArrowLeft size={16} color="white" />
          <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>
            {t('common.back') ?? 'Back'}
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: 7,
            }}
          >
            <Megaphone size={16} color="white" />
          </View>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>
            {t('announcements.tag') ?? 'Announcement'}
          </Text>
        </View>

        {/* Share button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.22)',
            borderRadius: 14,
            padding: 9,
          }}
        >
          <Share2 size={16} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Content ── */}
      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          <DetailSkeleton />
        </ScrollView>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
            <Megaphone size={28} color="#E11D48" />
          </View>
          <Text className="text-slate-700 text-base font-bold text-center mb-2">
            {t('announcements.error_title')}
          </Text>
          <Text className="text-slate-400 text-[13px] text-center mb-6">
            {t('announcements.error_body')}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            activeOpacity={0.8}
            className="bg-blue-50 border border-blue-100 rounded-full px-6 py-3"
          >
            <Text className="text-blue-600 text-[13px] font-bold">{t('announcements.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : data ? (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}
        >
          <View className="px-5 pt-6">

            {/* Media */}
            {data.media.length > 0 && (
              <DetailMediaCarousel media={data.media} />
            )}

            {/* Tag + time */}
            <View className="flex-row items-center justify-between mb-4">
              <Tag label={t('announcements.tag')} />
              <View className="flex-row items-center gap-1.5">
                <Clock size={11} color="#94A3B8" />
                <Text className="text-slate-400 text-[11px] font-semibold">
                  {timeAgo(data.created_at, currentLanguage)}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              className="text-slate-900 text-[22px] font-black leading-tight mb-4"
              style={{ letterSpacing: -0.3 }}
            >
              {data.title}
            </Text>

            {/* Meta chips */}
            <View className="flex-row flex-wrap gap-2 mb-5">
              {/* Date */}
              <View className="flex-row items-center gap-1.5 bg-white border border-slate-100 rounded-xl px-3 py-2"
                style={{ shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}
              >
                <CalendarDays size={12} color="#2563EB" />
                <Text className="text-slate-600 text-[12px] font-semibold">
                  {formatDate(data.created_at)}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 mb-5" />

            {/* Full content */}
            <Text
              className="text-slate-700 text-[15px] leading-7"
              style={{ letterSpacing: 0.1 }}
            >
              {data.content}
            </Text>

            {/* Divider */}
            <View className="h-px bg-slate-100 mt-8 mb-6" />

            {/* Author card */}
            <View
              className="flex-row items-center gap-4 bg-white rounded-2xl p-4"
              style={{
                borderWidth: 1,
                borderColor: '#E8EFFE',
                shadowColor: '#1A56DB',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Avatar name={name} size={44} />
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  {t('announcements.posted_by') ?? 'Posted by'}
                </Text>
                <Text className="text-slate-800 text-[14px] font-bold" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-slate-400 text-[11px] font-medium" numberOfLines={1}>
                  {data.uploader.email}
                </Text>
              </View>
              <View
                className="rounded-xl p-2.5"
                style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }}
              >
                <User size={16} color="#2563EB" />
              </View>
            </View>

          </View>
        </Animated.ScrollView>
      ) : null}

    </SafeAreaView>
  );
}