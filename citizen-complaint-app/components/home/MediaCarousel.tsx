// components/home/MediaCarousel.tsx
import { View, Text, Animated, TouchableOpacity, FlatList, Image, Dimensions, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Play, ImageIcon, Video as VideoIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ImageViewer, VideoPlayer } from '@/components/media/MediaViewer';
import { MediaItem } from '@/types/general/home';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_INNER_WIDTH = SCREEN_WIDTH - 40 - 32;

function ImageSlide({ uri, onPress }: { uri: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri }} style={{ width: CARD_INNER_WIDTH, height: 210, borderRadius: 12 }} resizeMode="cover" />
    </TouchableOpacity>
  );
}

function VideoSlide({ uri, tapLabel, onPress }: { uri: string; tapLabel: string; onPress: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    VideoThumbnails.getThumbnailAsync(uri, { time: 1000 })
      .then(({ uri: t }) => setThumb(t))
      .catch(() => {});
  }, [uri]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <View style={{ width: CARD_INNER_WIDTH, height: 210, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        {thumb && <Image source={{ uri: thumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: thumb ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.55)' }]} />
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.20)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={26} color="white" fill="white" />
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 12 }}>{tapLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MediaCountBadges({ media }: { media: MediaItem[] }) {
  const imgs = media.filter(m => m.media_type === 'image').length;
  const vids = media.filter(m => m.media_type === 'video').length;
  if (!imgs && !vids) return null;
  return (
    <View style={{ position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 6 }}>
      {imgs > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
          <ImageIcon size={9} color="#fff" />
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{imgs}</Text>
        </View>
      )}
      {vids > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
          <VideoIcon size={9} color="#fff" />
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{vids}</Text>
        </View>
      )}
    </View>
  );
}

function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
      {[...Array(count)].map((_, i) => (
        <View key={i} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? '#2563EB' : '#CBD5E1' }} />
      ))}
    </View>
  );
}

export function MediaCarousel({ media }: { media: MediaItem[] }) {
  const { t } = useTranslation();
  const [active, setActive]             = useState(0);
  const [imageUri, setImageUri]         = useState('');
  const [videoUri, setVideoUri]         = useState('');
  const [imageVisible, setImageVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);

  if (!media.length) return null;

  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <View>
          <FlatList
            data={media}
            keyExtractor={m => m.id.toString()}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_INNER_WIDTH + 10}
            decelerationRate="fast"
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            onScroll={e => setActive(Math.round(e.nativeEvent.contentOffset.x / (CARD_INNER_WIDTH + 10)))}
            scrollEventThrottle={16}
            renderItem={({ item }) =>
              item.media_type === 'image'
                ? <ImageSlide uri={item.media_url} onPress={() => { setImageUri(item.media_url); setImageVisible(true); }} />
                : <VideoSlide uri={item.media_url} tapLabel={t('media.tap_to_watch')} onPress={() => { setVideoUri(item.media_url); setVideoVisible(true); }} />
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