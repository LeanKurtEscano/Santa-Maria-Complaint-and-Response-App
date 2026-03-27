
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
const HEADER_SCROLL_DISTANCE = 80;

export default function HomeScreen() {
  const router = useRouter();
  const { changeLanguage, currentLanguage } = useSettingsLogic();
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data, isLoading, isError, refetch, isRefetching } =
    useQuery<Announcement[]>({
      queryKey: ['announcements'],
      queryFn: async () => (await announcementApiClient.get('/')).data,
    });

  const cardMarginTop = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [-24, -12],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["bottom"]} >

      <StickyMiniHeader scrollY={scrollY} title={t('header.city')} currentLanguage={currentLanguage} onChangeLanguage={() => changeLanguage(currentLanguage === 'en' ? 'tl' : 'en')} />

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
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" colors={['#2563EB']} />
        }
      >

        {/* ── Hero ── */}
        <HeroHeader
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
            <QuickAction Icon={CalendarDays}  label={t('quick.events')}   onPress={() => router.push("/event/events")}  delay={120} />
            <QuickAction Icon={Phone}
  label={t('emergency.title')}   // uses the new "emergency.title" key → "Emergency"
  onPress={() => router.push('/(tabs)/Emergency')}
  delay={180} />
          </View>
        </Animated.View>

        {/* ── Greeting banner ── */}
        <View className="mt-5">
          <GreetingBanner />
        </View>

        {/* ── Upcoming events ── */}
        <UpcomingEventsStrip />

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
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </View>

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