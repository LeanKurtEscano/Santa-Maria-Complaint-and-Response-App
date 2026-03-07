// components/home/UpcomingEventsStrip.tsx
import { View, Text, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { useRef, useEffect } from 'react';
import { CalendarDays, ChevronRight, MapPin, ArrowRight } from 'lucide-react-native';
import { UPCOMING_EVENTS } from '@/constants/home/home';

export function UpcomingEventsStrip() {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 450, delay: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 14, stiffness: 110, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} className="mb-5">
      {/* Header */}
      <View className="px-5 mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="rounded-xl p-2 bg-blue-50 border border-blue-100">
            <CalendarDays size={16} color="#2563EB" />
          </View>
          <Text className="text-slate-900 text-base font-extrabold">Upcoming Events</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} className="flex-row items-center gap-0.5">
          <Text className="text-[13px] font-bold text-blue-600">See All</Text>
          <ChevronRight size={13} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        {UPCOMING_EVENTS.map((event) => (
          <TouchableOpacity
            key={event.id}
            activeOpacity={0.82}
            style={{
              width: 170, backgroundColor: 'white',
              borderRadius: 18, borderWidth: 1, borderColor: '#E8EFFE',
              shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
              overflow: 'hidden',
            }}
          >
            <View style={{ height: 4, backgroundColor: event.color, opacity: 0.7 }} />
            <View style={{ padding: 14 }}>
              {/* Date + icon row */}
              <View className="flex-row items-center gap-2 mb-3">
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: event.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: event.color, fontSize: 14, fontWeight: '900' }}>{event.date.split(' ')[1]}</Text>
                  <Text style={{ color: event.color, fontSize: 9, fontWeight: '700', opacity: 0.7 }}>{event.date.split(' ')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: event.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <event.Icon size={18} color={event.color} />
                </View>
              </View>

              <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '800', lineHeight: 18 }} numberOfLines={2}>{event.title}</Text>
              <View className="flex-row items-center gap-1 mt-2">
                <MapPin size={10} color="#94A3B8" />
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{event.location}</Text>
              </View>

              {/* Footer */}
              <View className="flex-row items-center justify-between mt-3 pt-2.5" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                <Text style={{ color: event.color, fontSize: 10, fontWeight: '700' }}>{event.day}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: event.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: event.color, fontSize: 10, fontWeight: '800' }}>Details</Text>
                  <ArrowRight size={9} color={event.color} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}