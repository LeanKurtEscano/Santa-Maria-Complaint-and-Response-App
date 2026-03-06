// app/(tabs)/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen — 100% NativeWind, real API, paginated list,
//              tappable image lightbox + video player modal, EN/TL i18n.
// ─────────────────────────────────────────────────────────────────────────────

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  FileText,
  Phone,
  MessageSquarePlus,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  CheckCircle,
  Circle,
  Sparkles,
  Play,
  ImageIcon,
  Video as VideoIcon,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  ChevronDown,
  Megaphone,
  Languages,
} from 'lucide-react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { announcementApiClient } from '@/lib/client/announcement';
import { ImageViewer,VideoPlayer } from '@/components/media/MediaViewer';
import { useTranslation } from 'react-i18next';
import ChatbotFAB from '@/components/buttons/Chatbotfab';
import ChatbotModal from '@/components/modals/Chatbot';

// ─── Config ───────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// card mx-5 (20px each side) + inner px-4 (16px each side) = 72px total
const SLIDE_WIDTH = SCREEN_WIDTH - 72;
const PAGE_SIZE   = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: number;
  announcement_id: number;
  media_url: string;
  media_type: 'image' | 'video';
}

interface UploaderInfo {
  id: number;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  uploader_id: number;
  uploader: UploaderInfo;
  created_at: string;
  updated_at: string;
  media: MediaItem[];
}

// ─── Static complaint stats data ──────────────────────────────────────────────

const STAT_ITEMS = [
  { tKey: 'stats.submitted',   value: 24, Icon: ClipboardList, dot: '#93C5FD' },
  { tKey: 'stats.in_progress', value: 11, Icon: Circle,        dot: '#FCD34D' },
  { tKey: 'stats.resolved',    value: 13, Icon: CheckCircle,   dot: '#6EE7B7' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fil-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function timeAgo(iso: string, lang: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const isTl = lang === 'tl';
  if (m < 1)   return isTl ? 'kararating lang'            : 'just now';
  if (m < 60)  return isTl ? `${m}m ang nakakaraan`       : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return isTl ? `${h}h ang nakakaraan`       : `${h}h ago`;
  return         isTl ? `${Math.floor(h/24)}d ang nakakaraan` : `${Math.floor(h/24)}d ago`;
}

function uploaderLabel(u: UploaderInfo) {
  if (u.first_name || u.last_name)
    return [u.first_name, u.last_name].filter(Boolean).join(' ');
  return u.email.split('@')[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════════════════════

function Tag({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-blue-50 border border-blue-100 px-3 py-1">
      <Text className="text-blue-600 text-[10px] font-bold tracking-wider uppercase">
        {label}
      </Text>
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <View className="w-7 h-7 rounded-full bg-blue-100 items-center justify-center">
      <Text className="text-blue-600 text-[11px] font-bold">
        {name[0]?.toUpperCase() ?? 'L'}
      </Text>
    </View>
  );
}

function DateChip({ date }: { date: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
      <CalendarDays size={10} color="#94A3B8" />
      <Text className="text-slate-400 text-[11px] font-semibold">{date}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA SLIDE — tappable, opens viewer/player
// ═══════════════════════════════════════════════════════════════════════════════

function ImageSlide({
  uri,
  onPress,
}: {
  uri: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92}>
      <Image
        source={{ uri }}
        style={{ width: SLIDE_WIDTH, height: 190, borderRadius: 12 }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

function VideoSlide({
  tapLabel,
  onPress,
}: {
  tapLabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <View
        style={{ width: SLIDE_WIDTH, height: 190, borderRadius: 12 }}
        className="bg-slate-900 items-center justify-center overflow-hidden"
      >
        {[...Array(7)].map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute', left: 0, right: 0,
              top: i * 28, height: 1,
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          />
        ))}
        <View className="w-14 h-14 rounded-full bg-white/10 border border-white/20 items-center justify-center">
          <Play size={24} color="white" fill="white" />
        </View>
        <Text className="text-white/40 text-xs font-semibold mt-3">{tapLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA CAROUSEL
// ═══════════════════════════════════════════════════════════════════════════════

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

function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <View className="flex-row justify-center items-center gap-1.5 mt-2.5">
      {[...Array(count)].map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? '#2563EB' : '#CBD5E1',
          }}
        />
      ))}
    </View>
  );
}

function MediaCarousel({ media }: { media: MediaItem[] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);

  // State for viewer modals
  const [imageUri,      setImageUri]      = useState('');
  const [videoUri,      setVideoUri]      = useState('');
  const [imageVisible,  setImageVisible]  = useState(false);
  const [videoVisible,  setVideoVisible]  = useState(false);

  if (media.length === 0) return null;

  return (
    <>
      <View className="px-4 pt-4 pb-1">
        <View>
          <FlatList
            data={media}
            keyExtractor={m => m.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SLIDE_WIDTH + 10}
            decelerationRate="fast"
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            onScroll={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SLIDE_WIDTH + 10));
              setActive(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) =>
              item.media_type === 'image' ? (
                <ImageSlide
                  uri={item.media_url}
                  onPress={() => {
                    setImageUri(item.media_url);
                    setImageVisible(true);
                  }}
                />
              ) : (
                <VideoSlide
                  tapLabel={t('media.tap_to_watch')}
                  onPress={() => {
                    setVideoUri(item.media_url);
                    setVideoVisible(true);
                  }}
                />
              )
            }
          />
          <MediaCountBadges media={media} />
        </View>
        <CarouselDots count={media.length} active={active} />
      </View>

      {/* Image lightbox */}
      <ImageViewer
        visible={imageVisible}
        uri={imageUri}
        onClose={() => setImageVisible(false)}
      />

      {/* Video player */}
      <VideoPlayer
        visible={videoVisible}
        uri={videoUri}
        onClose={() => setVideoVisible(false)}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function AnnouncementCard({ item }: { item: Announcement }) {
  const { t, language } = useTranslation();
  const hasMedia = item.media.length > 0;
  const name = uploaderLabel(item.uploader);

  return (
    <View
      className="bg-white rounded-2xl mb-3.5 overflow-hidden"
      style={{
        borderWidth: 1,
        borderColor: '#E8EFFE',
        shadowColor: '#1A56DB',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Media carousel */}
      {hasMedia && <MediaCarousel media={item.media} />}

      {/* Body */}
      <View className={`px-4 pb-4 ${hasMedia ? 'pt-3' : 'pt-4'}`}>

        {/* Tag + time */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Tag label={t('announcements.tag')} />
          <View className="flex-row items-center gap-1">
            <Clock size={10} color="#94A3B8" />
            <Text className="text-slate-400 text-[10px] font-semibold">
              {timeAgo(item.created_at, language)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          className="text-slate-900 text-[15px] font-extrabold leading-snug mb-2"
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Content */}
        <Text
          className="text-slate-500 text-[13px] leading-5 mb-3"
          numberOfLines={3}
        >
          {item.content}
        </Text>

        {/* Date chip */}
        <View className="flex-row flex-wrap gap-2 mb-3.5">
          <DateChip date={formatDate(item.created_at)} />
        </View>

        {/* Divider */}
        <View className="h-px bg-slate-100 mb-3" />

        {/* Footer: uploader + read CTA */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-3">
            <Avatar name={name} />
            <Text className="text-slate-500 text-[11px] font-semibold flex-1" numberOfLines={1}>
              {name}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            className="flex-row items-center gap-1 bg-blue-50 rounded-xl px-3 py-2"
          >
            <Text className="text-blue-600 text-[12px] font-bold">
              {t('announcements.read_more')}
            </Text>
            <ChevronRight size={12} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTION
// ═══════════════════════════════════════════════════════════════════════════════

function QuickAction({ Icon, label, onPress }: { Icon: any; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} className="items-center flex-1">
      <View className="w-[54px] h-[54px] rounded-2xl mb-2 bg-blue-50 border border-blue-100 items-center justify-center">
        <Icon size={22} color="#2563EB" />
      </View>
      <Text className="text-slate-700 text-[11px] font-bold text-center leading-[15px]">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ label, value, Icon, dot }: { label: string; value: number; Icon: any; dot: string }) {
  return (
    <View
      className="flex-1 rounded-2xl py-3.5 px-2 items-center"
      style={{
        backgroundColor: 'rgba(255,255,255,0.11)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
      }}
    >
      <Icon size={15} color={dot} />
      <Text className="text-white text-2xl font-black mt-1.5">{value}</Text>
      <Text className="text-blue-200 text-[10px] font-semibold text-center mt-0.5 leading-[14px]">
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeader({
  Icon, title, actionLabel, onAction,
}: {
  Icon: any; title: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-2.5">
        <View className="rounded-xl p-2 bg-blue-50 border border-blue-100">
          <Icon size={16} color="#2563EB" />
        </View>
        <Text className="text-slate-900 text-base font-extrabold">{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} className="flex-row items-center gap-0.5">
          <Text className="text-[13px] font-bold text-blue-600">{actionLabel}</Text>
          <ChevronRight size={13} color="#2563EB" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingState() {
  const { t } = useTranslation();
  return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-slate-400 text-[13px] font-semibold mt-3">
        {t('announcements.loading')}
      </Text>
    </View>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <View className="items-center py-12">
      <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-3">
        <Megaphone size={28} color="#2563EB" />
      </View>
      <Text className="text-slate-700 text-[15px] font-bold mb-1">
        {t('announcements.empty_title')}
      </Text>
      <Text className="text-slate-400 text-[13px] text-center">
        {t('announcements.empty_body')}
      </Text>
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
      <Text className="text-slate-700 text-[15px] font-bold mb-1">
        {t('announcements.error_title')}
      </Text>
      <Text className="text-slate-400 text-[13px] text-center mb-4">
        {t('announcements.error_body')}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        className="flex-row items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2.5"
      >
        <RefreshCw size={13} color="#2563EB" />
        <Text className="text-[13px] font-bold text-blue-600">{t('announcements.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGINATED ANNOUNCEMENTS LIST
// ═══════════════════════════════════════════════════════════════════════════════

function AnnouncementsList({
  data, isLoading, isError, onRetry,
}: {
  data?: Announcement[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState />;

  const shown     = data.slice(0, visible);
  const remaining = data.length - visible;

  return (
    <>
      {shown.map(item => (
        <AnnouncementCard key={item.id} item={item} />
      ))}

      {/* See more button */}
      {remaining > 0 && (
        <TouchableOpacity
          onPress={() => setVisible(v => v + PAGE_SIZE)}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-slate-200 mb-4"
          style={{
            shadowColor: '#94A3B8',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <ChevronDown size={16} color="#2563EB" />
          <Text className="text-blue-600 text-[14px] font-bold">
            {t('announcements.see_more')} ({remaining} {t('announcements.remaining')})
          </Text>
        </TouchableOpacity>
      )}

      {/* End of list */}
      {visible >= data.length && data.length > PAGE_SIZE && (
        <View className="items-center py-3 mb-2">
          <Text className="text-slate-300 text-xs font-semibold">
            {t('announcements.end_of_list')}
          </Text>
        </View>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomeScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } =
    useQuery<Announcement[]>({
      queryKey: ['announcements'],
      queryFn: async () => {
        const res = await announcementApiClient.get('/');
        return res.data;
      },
    });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >

        {/* ─────────────────────── HEADER ─────────────────────────────── */}
        <View className="px-5 pt-5 pb-14 bg-blue-600 overflow-hidden">
          {/* Decorative blobs */}
          <View style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ position: 'absolute', bottom: 0, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          <View style={{ position: 'absolute', top: 60, right: 70, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          {/* Top row: title + lang toggle + bell */}
          <View className="flex-row items-start justify-between mb-7">
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Sparkles size={10} color="#93C5FD" />
                <Text className="text-blue-200 text-[11px] font-bold tracking-widest uppercase">
                  {t('header.municipality')}
                </Text>
              </View>
              <Text className="text-white text-[30px] font-black leading-8">
                {t('header.city')}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <MapPin size={11} color="#93C5FD" />
                <Text className="text-blue-200 text-[12px] font-medium">
                  {t('header.location')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mt-1">
              {/* Language toggle */}
              <TouchableOpacity
                onPress={() => setLanguage(language === 'en' ? 'tl' : 'en')}
                activeOpacity={0.8}
                className="rounded-2xl px-3 py-2.5 flex-row items-center gap-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Languages size={14} color="white" />
                <Text className="text-white text-[12px] font-bold">
                  {language === 'en' ? 'EN' : 'TL'}
                </Text>
              </TouchableOpacity>

              {/* Bell */}
              <TouchableOpacity
                activeOpacity={0.8}
                className="rounded-2xl p-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Bell size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Complaint stats */}
          <Text className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-3">
            {t('stats.heading')}
          </Text>
          <View className="flex-row gap-2.5">
            {STAT_ITEMS.map(s => (
              <StatCard
                key={s.tKey}
                label={t(s.tKey)}
                value={s.value}
                Icon={s.Icon}
                dot={s.dot}
              />
            ))}
          </View>
        </View>

        {/* ─────────────── FLOATING QUICK ACCESS CARD ─────────────────── */}
        <View
          className="bg-white mx-5 rounded-3xl p-5"
          style={{
            marginTop: -24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.10,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t('quick.heading')}
          </Text>
          <View className="flex-row justify-between">
            <QuickAction Icon={FileText}     label={t('quick.services')} />
            <QuickAction
              Icon={ClipboardList}
              label={t('quick.complaints')}
              onPress={() => router.push('/(tabs)/Complaints')}
            />
            <QuickAction Icon={CalendarDays} label={t('quick.events')} />
            <QuickAction Icon={Phone}        label={t('quick.hotlines')} />
          </View>
        </View>

        {/* ─────────────────────── ANNOUNCEMENTS ──────────────────────── */}
        <View className="px-5 mt-6">
          <SectionHeader
            Icon={Megaphone}
            title={t('announcements.heading')}
            actionLabel={t('announcements.all')}
            onAction={() => {}}
          />
          <AnnouncementsList
            data={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </View>

      </ScrollView>

      {/* Chatbot */}
      <ChatbotFAB onPress={() => setChatOpen(true)} />
      <ChatbotModal visible={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ─────────────────────── BOTTOM CTA ─────────────────────────── */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white border-t border-slate-100">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Complaints')}
          activeOpacity={0.88}
          className="flex-row items-center justify-center gap-2.5 py-4 rounded-2xl bg-blue-600"
          style={{
            shadowColor: '#1D4ED8',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 10,
          }}
        >
          <MessageSquarePlus size={20} color="white" />
          <Text className="text-white text-[15px] font-extrabold">
            {t('cta.submit_complaint')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}