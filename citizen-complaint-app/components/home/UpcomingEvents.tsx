// components/home/UpcomingEventsStrip.tsx
import { View, Text, Animated, TouchableOpacity, ScrollView, Image } from 'react-native';
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

      {/* Section header */}
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
      >
        {UPCOMING_EVENTS.map((event) => (
          <TouchableOpacity
            key={event.id}
            activeOpacity={0.82}
            style={{
              width: 200,
              backgroundColor: 'white',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E8EFFE',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.09,
              shadowRadius: 12,
              elevation: 4,
              overflow: 'hidden',
            }}
          >
            {/* Full-width image */}
            <View style={{ width: '100%', height: 110, position: 'relative' }}>
              <Image
                source={{ uri: event.image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {/* Dark gradient overlay */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  background: 'transparent',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                }}
              />
              {/* Date badge overlaid on image */}
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  alignItems: 'center',
                  minWidth: 44,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text style={{ color: event.color, fontSize: 16, fontWeight: '900', lineHeight: 18 }}>
                  {event.date.split(' ')[1]}
                </Text>
                <Text style={{ color: event.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                  {event.date.split(' ')[0].toUpperCase()}
                </Text>
              </View>

              {/* Category pill overlaid on image bottom */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 10,
                  backgroundColor: event.color,
                  borderRadius: 20,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>
                  {event.day}
                </Text>
              </View>
            </View>

            {/* Card body */}
            <View style={{ padding: 12 }}>
              <Text
                style={{ color: '#0F172A', fontSize: 13, fontWeight: '800', lineHeight: 18, marginBottom: 5 }}
                numberOfLines={2}
              >
                {event.title}
              </Text>

              {/* Location row */}
              <View className="flex-row items-center gap-1 mb-3">
                <MapPin size={10} color="#94A3B8" />
                <Text
                  style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', flex: 1 }}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </View>

              {/* Footer CTA */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                  paddingTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-1.5">
                  <event.Icon size={12} color={event.color} />
                  <Text style={{ color: event.color, fontSize: 10, fontWeight: '700' }}>
                    Community
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: event.bg,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
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