import { View, Text, Animated, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText, Phone, ClipboardList, CalendarDays, Megaphone,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSettingsLogic } from '@/hooks/general/useSetting';
import { announcementApiClient } from '@/lib/client/announcement';
import { Announcement } from '@/types/general/home';
import { StickyMiniHeader, HeroHeader, BottomCTA } from '@/components/home/HeroHeader';
import { QuickAction } from '@/components/home/QuickAction';
import { GreetingBanner } from '@/components/home/GreetingBanner';
import { UpcomingEventsStrip } from '@/components/home/UpcomingEvents';
import { FeaturedServicesGrid } from '@/components/home/FeaturedServices';
import { AnnouncementsList } from '@/components/home/AnnouncementsList';
import { SectionHeader } from '@/components/home/ui';
import ChatbotFAB from '@/components/buttons/Chatbotfab';
import ChatbotModal from '@/components/modals/Chatbot';
import { FeedbackCard } from '@/components/home/FeedbackCard';
import { complaintApiClient } from '@/lib/client/complaint';
import { MyStats } from '@/types/general/home';
import { eventApiClient } from '@/lib/client/event';
import { EventData } from '@/types/general/home';
import ErrorScreen from '@/screen/general/ErrorScreen';
import { handleApiError } from '@/utils/general/errorHandler';
import { ActivityIndicator } from 'react-native';
import { OrdinanceCard } from '@/components/home/OrdinanceCard';

const HEADER_SCROLL_DISTANCE = 80;

export default function HomeScreen() {
  const router = useRouter();
  const { changeLanguage, currentLanguage } = useSettingsLogic();
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => (await announcementApiClient.get('/')).data,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats,
  } = useQuery<MyStats>({
    queryKey: ['my-stats'],
    queryFn: async () => (await complaintApiClient.get('/my-stats')).data,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const {
    data: events = [],
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
    refetch: refetchEvents,
  } = useQuery<EventData[]>({
    queryKey: ['events'],
    queryFn: async () => (await eventApiClient.get('/')).data,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // ── Derived states ────────────────────────────────────────────────────────
  const isAnyLoading = isLoading || isLoadingStats || isLoadingEvents;
  const isAnyError   = isError   || isErrorStats   || isErrorEvents;

  const refetchAll = () => {
    refetch();
    refetchStats();
    refetchEvents();
  };

 
  if (isAnyLoading) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
      <ActivityIndicator size="large" color="#10B981" />
    </SafeAreaView>
  );
}

  if (isAnyError) {
    const appError = handleApiError(new Error(t('home.errors.loadFailed')));
    return (
      <ErrorScreen
        type={appError.type}
        title={t('home.errors.screenTitle')}
        onRetry={refetchAll}
      />
    );
  }

  // ── Animations ────────────────────────────────────────────────────────────
  const cardMarginTop = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [-24, -12],
    extrapolate: 'clamp',
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>

      <StickyMiniHeader
        scrollY={scrollY}
        title={t('header.city')}
        currentLanguage={currentLanguage}
        onBell={() => router.push('/(tabs)/Notifications')}
        onChangeLanguage={() => changeLanguage(currentLanguage === 'en' ? 'tl' : 'en')}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchAll}          // 👈 refresh all at once
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      >
        <HeroHeader
          data={stats}
          isLoading={isLoadingStats}
          isError={isErrorStats}
          refetch={refetchStats}
          scrollY={scrollY}
          cityTitle={t('header.city')}
          municipality={t('header.municipality')}
          location={t('header.location')}
          currentLanguage={currentLanguage}
          onChangeLanguage={() => changeLanguage(currentLanguage === 'en' ? 'tl' : 'en')}
          onBell={() => router.push('/(tabs)/Notifications')}
        />

        {/* ── Quick access card ── */}
        <Animated.View
          className="bg-white mx-5 rounded-3xl p-5"
          style={{
            marginTop: cardMarginTop,
            borderWidth: 1, borderColor: '#E2E8F0',
            shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.10, shadowRadius: 20, elevation: 8,
          }}
        >
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t('quick.heading')}
          </Text>
          <View className="flex-row justify-between">
            <QuickAction
              Icon={ClipboardList}
              label={t('quick.complaints')}
              onPress={() => router.push('/complaints/UserComplaints')}
              delay={60}
            />
            <QuickAction Icon={CalendarDays} label={t('quick.events')} onPress={() => router.push('/event/events')} delay={120} />
            <QuickAction
              Icon={Phone}
              label={t('emergency.title')}
              onPress={() => router.push('/(tabs)/Emergency')}
              delay={180}
            />
          </View>
        </Animated.View>

        {/* ── Greeting banner ── */}
        <View className="mt-5">
          <GreetingBanner />
        </View>

        {/* ── Upcoming events ── */}
        <UpcomingEventsStrip data={events} isLoading={false} isError={false} refetch={refetchEvents} />

        {/* ── Featured complaint services ── */}
        <FeaturedServicesGrid />

        {/* ── Announcements ── */}
        <View className="px-5 mt-2">
          <SectionHeader
            Icon={Megaphone}
            title={t('announcements.heading')}
            actionLabel={t('announcements.all')}
            onAction={() => {}}
          />
          <AnnouncementsList
            data={data}
            isLoading={false}
            isError={false}
            onRetry={refetch}
          />
        </View>
        <OrdinanceCard/>

        <FeedbackCard />

      </Animated.ScrollView>

      <ChatbotFAB onPress={() => setChatOpen(true)} />
      <ChatbotModal visible={chatOpen} onClose={() => setChatOpen(false)} />

      <BottomCTA
        onPress={() => router.push('/(tabs)/Complaints')}
        label={t('cta.submit_complaint')}
      />

    </SafeAreaView>
  );
}