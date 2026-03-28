import {
  View, Text, Animated, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronRight, ChevronDown, Clock, AlertCircle, RefreshCw, Megaphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Tag, Avatar, DateChip } from './ui';
import { MediaCarousel } from './MediaCarousel';
import { timeAgo, uploaderLabel } from '@/utils/home/home';
import { formatDate } from '@/constants/complaint/complaint';
import { useSettingsLogic } from '@/hooks/general/useSetting';
import { Announcement } from '@/types/general/home';
import { PAGE_SIZE } from '@/constants/home/home';
import { THEME } from '@/constants/theme';

export function AnnouncementCard({ item, index }: { item: Announcement; index: number }) {
  const router = useRouter();
  const { currentLanguage } = useSettingsLogic();
  const { t } = useTranslation();
  const name = uploaderLabel(item.uploader);

  const translateY = useRef(new Animated.Value(40)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 80, 300);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View
        className="bg-white rounded-2xl mb-3.5 overflow-hidden"
        style={{ borderWidth: 1, borderColor: '#E8EFFE', shadowColor: THEME.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 }}
      >
        {item.media.length > 0 && <MediaCarousel media={item.media} />}

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push(`/announcements/${item.id}`)}
        >
          <View className={`px-4 pb-4 ${item.media.length > 0 ? 'pt-3' : 'pt-4'}`}>
            <View className="flex-row items-center justify-between mb-2.5">
              <Tag label={t('announcements.tag')} />
              <View className="flex-row items-center gap-1">
                <Clock size={10} color="#94A3B8" />
                <Text className="text-slate-400 text-[10px] font-semibold">{timeAgo(item.created_at, currentLanguage)}</Text>
              </View>
            </View>

            <Text className="text-slate-900 text-[15px] font-extrabold leading-snug mb-2" numberOfLines={2}>{item.title}</Text>
            <Text className="text-slate-500 text-[13px] leading-5 mb-3" numberOfLines={3}>{item.content}</Text>

            <View className="flex-row flex-wrap gap-2 mb-3.5">
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
    </Animated.View>
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

export function AnnouncementsList({ data, isLoading, isError, onRetry }: {
  data?: Announcement[]; isLoading: boolean; isError: boolean; onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState onRetry={onRetry} />;
  if (!data?.length) return <EmptyState />;

  const shown     = data.slice(0, visible);
  const remaining = data.length - visible;

  return (
    <>
      {shown.map((item, i) => <AnnouncementCard key={item.id} item={item} index={i} />)}

      {remaining > 0 && (
        <TouchableOpacity
          onPress={() => setVisible(v => v + PAGE_SIZE)}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-slate-200 mb-4"
          style={{ shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
        >
          <ChevronDown size={16} color={THEME.primary} />
          <Text style={{ color: THEME.primary, fontSize: 14, fontWeight: '700' }}>
            {t('announcements.see_more')} ({remaining} {t('announcements.remaining')})
          </Text>
        </TouchableOpacity>
      )}

      {visible >= data.length && data.length > PAGE_SIZE && (
        <View className="items-center py-3 mb-2">
          <Text className="text-slate-300 text-xs font-semibold">{t('announcements.end_of_list')}</Text>
        </View>
      )}
    </>
  );
}