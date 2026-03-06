// components/MediaViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ImageViewer  — fullscreen image lightbox with pinch-to-zoom + double-tap
// VideoPlayer  — fullscreen video modal (expo-video) with controls + seek bar
//
// Install once:  npx expo install expo-video
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
} from 'react-native';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE VIEWER
// ═══════════════════════════════════════════════════════════════════════════════

interface ImageViewerProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function ImageViewer({ visible, uri, onClose }: ImageViewerProps) {
  const { t } = useTranslation();

  // Animated values
  const scale      = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity  = useRef(new Animated.Value(0)).current;

  // Mutable refs for gesture math (avoid stale closure in PanResponder)
  const scaleVal    = useRef(1);
  const lastScale   = useRef(1);
  const offsetX     = useRef(0);
  const offsetY     = useRef(0);
  const lastOffsetX = useRef(0);
  const lastOffsetY = useRef(0);
  const startDist   = useRef<number | null>(null);
  const lastTap     = useRef(0);

  const springReset = useCallback(() => {
    scaleVal.current    = 1;
    lastScale.current   = 1;
    offsetX.current     = 0;
    offsetY.current     = 0;
    lastOffsetX.current = 0;
    lastOffsetY.current = 0;
    Animated.parallel([
      Animated.spring(scale,      { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, [scale, translateX, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        lastOffsetX.current = offsetX.current;
        lastOffsetY.current = offsetY.current;
        lastScale.current   = scaleVal.current;
        startDist.current   = null;
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          // ── Pinch to zoom
          const dx   = touches[0].pageX - touches[1].pageX;
          const dy   = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (startDist.current === null) {
            startDist.current = dist;
          } else {
            const next = Math.max(1, Math.min(4, lastScale.current * (dist / startDist.current)));
            scaleVal.current = next;
            scale.setValue(next);
          }
        } else if (touches.length === 1 && scaleVal.current > 1) {
          // ── Pan while zoomed
          const nx = lastOffsetX.current + (evt.nativeEvent.pageX - (evt.nativeEvent as any).startX ?? 0);
          const ny = lastOffsetY.current + (evt.nativeEvent.pageY - (evt.nativeEvent as any).startY ?? 0);
          offsetX.current = nx;
          offsetY.current = ny;
          translateX.setValue(nx);
          translateY.setValue(ny);
        }
      },

      onPanResponderRelease: () => {
        startDist.current = null;

        // Double-tap zoom toggle
        const now = Date.now();
        if (now - lastTap.current < 280) {
          if (scaleVal.current > 1) {
            springReset();
          } else {
            scaleVal.current  = 2.5;
            lastScale.current = 2.5;
            Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
          }
        }
        lastTap.current = now;

        if (scaleVal.current < 1) springReset();
      },
    })
  ).current;

  // Fade-in when modal opens
  const handleShow = () => {
    springReset();
    Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const handleClose = () => {
    Animated.timing(bgOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      springReset();
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={handleShow}
      statusBarTranslucent
    >
      <StatusBar hidden />

      <Animated.View
        style={{ flex: 1, opacity: bgOpacity, backgroundColor: 'rgba(0,0,0,0.95)' }}
        className="items-center justify-center"
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={handleClose}
          activeOpacity={0.8}
          className="absolute top-12 right-5 z-50 w-10 h-10 rounded-full bg-white/10 border border-white/20 items-center justify-center"
        >
          <X size={20} color="white" />
        </TouchableOpacity>

        {/* Hint */}
        <Text className="absolute bottom-10 left-0 right-0 text-center text-white/30 text-xs font-medium">
          {t('media.zoom_hint')}
        </Text>

        {/* Zoomable image */}
        <Animated.View
          style={{
            transform: [{ scale }, { translateX }, { translateY }],
            width: SCREEN_W,
            height: SCREEN_H * 0.78,
          }}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri }}
            style={{ width: SCREEN_W, height: SCREEN_H * 0.78 }}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO PLAYER
// ═══════════════════════════════════════════════════════════════════════════════

interface VideoPlayerProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function VideoPlayer({ visible, uri, onClose }: VideoPlayerProps) {
  const { t } = useTranslation();

  const [muted,        setMuted]        = useState(false);
  const [progress,     setProgress]     = useState(0);   // 0–1
  const [position,     setPosition]     = useState(0);   // ms
  const [duration,     setDuration]     = useState(0);   // ms
  const [showControls, setShowControls] = useState(true);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackWidth = SCREEN_W - 40;

  // expo-video player instance — created once per uri
  const player = useVideoPlayer(uri ? { uri } : null, (p) => {
    p.loop      = true;
    p.muted     = muted;
    p.timeUpdateEventInterval = 0.25; // fire every 250ms
  });

  // Sync mute state
  React.useEffect(() => {
    if (player) player.muted = muted;
  }, [muted, player]);

  // Track playback position for seek bar
  React.useEffect(() => {
    if (!player) return;
    const sub = player.addListener('timeUpdate', (e) => {
      setPosition((e.currentTime ?? 0) * 1000);
      setDuration((e.duration     ?? 0) * 1000);
      setProgress(e.duration ? e.currentTime / e.duration : 0);
    });
    return () => sub.remove();
  }, [player]);

  const touchControls = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    touchControls();
    if (!player) return;
    player.playing ? player.pause() : player.play();
  };

  const handleSeek = (x: number) => {
    touchControls();
    if (!player || !duration) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    player.currentTime = (ratio * duration) / 1000;
    setProgress(ratio);
  };

  const handleClose = () => {
    player?.pause();
    setProgress(0);
    setPosition(0);
    setShowControls(true);
    onClose();
  };

  const isPlaying = player?.playing ?? false;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
    >
      <StatusBar hidden />
      <TouchableWithoutFeedback onPress={touchControls}>
        <View className="flex-1 bg-black items-center justify-center">

          {/* ── Video view ── */}
          {player && (
            <VideoView
              player={player}
              style={{ width: SCREEN_W, height: SCREEN_H * 0.5 }}
              contentFit="contain"
              nativeControls={false}
            />
          )}

          {/* ── Controls overlay ── */}
          {showControls && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="absolute inset-0 bg-black/25" />
              <TouchableOpacity
                onPress={handlePlayPause}
                activeOpacity={0.8}
                className="w-16 h-16 rounded-full bg-white/20 border border-white/30 items-center justify-center z-10"
              >
                {isPlaying
                  ? <Pause size={28} color="white" fill="white" />
                  : <Play  size={28} color="white" fill="white" />
                }
              </TouchableOpacity>
            </View>
          )}

          {/* ── Top bar: close + mute ── */}
          <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-12 pb-4">
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.8}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 items-center justify-center"
            >
              <X size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMuted(m => !m); touchControls(); }}
              activeOpacity={0.8}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 items-center justify-center"
            >
              {muted
                ? <VolumeX size={18} color="white" />
                : <Volume2 size={18} color="white" />
              }
            </TouchableOpacity>
          </View>

          {/* ── Bottom: timestamp + seek bar ── */}
          <View className="absolute bottom-0 left-0 right-0 px-5 pb-10">
            <View className="flex-row justify-between mb-2">
              <Text className="text-white/50 text-xs font-medium">{formatMs(position)}</Text>
              <Text className="text-white/50 text-xs font-medium">{formatMs(duration)}</Text>
            </View>
            <TouchableWithoutFeedback onPress={(e) => handleSeek(e.nativeEvent.locationX)}>
              <View
                className="h-1.5 bg-white/20 rounded-full overflow-hidden"
                style={{ width: trackWidth }}
              >
                <View
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}