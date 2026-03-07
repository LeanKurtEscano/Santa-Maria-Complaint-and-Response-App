// components/MediaViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ImageViewer  — fullscreen image lightbox with pinch-to-zoom + double-tap zoom
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
const IMAGE_H = SCREEN_H * 0.78;

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE VIEWER
// ═══════════════════════════════════════════════════════════════════════════════

interface ImageViewerProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

const DOUBLE_TAP_DELAY = 300;  // ms
const ZOOM_SCALE       = 2.5;  // zoom level on double tap
const MIN_SCALE        = 0.65; // hard floor during pinch (rubber-band feel)
const SNAP_BACK_BELOW  = 1.0;  // spring back to 1× if released below this

export function ImageViewer({ visible, uri, onClose }: ImageViewerProps) {
  const { t } = useTranslation();

  // Animated values
  const scale      = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity  = useRef(new Animated.Value(0)).current;

  // Current committed values (updated after each gesture ends)
  const currentScale = useRef(1);
  const currentX     = useRef(0);
  const currentY     = useRef(0);

  // Per-gesture tracking
  const initialDist  = useRef<number | null>(null);
  const scaleAtStart = useRef(1);
  const panStartX    = useRef(0);
  const panStartY    = useRef(0);
  const xAtStart     = useRef(0);
  const yAtStart     = useRef(0);

  // Double-tap tracking
  const lastTapTime  = useRef(0);
  const lastTapX     = useRef(0);
  const lastTapY     = useRef(0);

  const clampOffset = (x: number, y: number, s: number) => {
    const maxX = Math.max(0, (SCREEN_W * (s - 1)) / 2);
    const maxY = Math.max(0, (IMAGE_H  * (s - 1)) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const animateTo = useCallback(
    (toScale: number, toX: number, toY: number) => {
      currentScale.current = toScale;
      currentX.current     = toX;
      currentY.current     = toY;
      Animated.parallel([
        Animated.spring(scale,      { toValue: toScale, useNativeDriver: true, bounciness: 2 }),
        Animated.spring(translateX, { toValue: toX,     useNativeDriver: true, bounciness: 2 }),
        Animated.spring(translateY, { toValue: toY,     useNativeDriver: true, bounciness: 2 }),
      ]).start();
    },
    [scale, translateX, translateY]
  );

  const resetAll = useCallback(() => {
    animateTo(1, 0, 0);
  }, [animateTo]);

  // Double-tap: zoom into the tapped point, or reset if already zoomed
  const handleDoubleTap = useCallback(
    (tapX: number, tapY: number) => {
      if (currentScale.current > 1) {
        animateTo(1, 0, 0);
      } else {
        // tapX/tapY are locationX/Y — coords within the Animated.View (SCREEN_W x IMAGE_H).
        // Clamp strictly inside the image so a tap outside never pans off-screen.
        const clampedTapX = Math.max(0, Math.min(SCREEN_W, tapX));
        const clampedTapY = Math.max(0, Math.min(IMAGE_H,  tapY));

        // Translate the tapped point to the view center.
        // Multiply by (ZOOM_SCALE - 1) not ZOOM_SCALE — this is the delta the
        // transform needs to shift, not the final absolute position.
        const offsetX = (SCREEN_W / 2 - clampedTapX) * (ZOOM_SCALE - 1);
        const offsetY = (IMAGE_H  / 2 - clampedTapY) * (ZOOM_SCALE - 1);
        const clamped = clampOffset(offsetX, offsetY, ZOOM_SCALE);
        animateTo(ZOOM_SCALE, clamped.x, clamped.y);
      }
    },
    [animateTo, clampOffset]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, gs) =>
        // Only claim move if the user is actually dragging (avoids eating taps)
        Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,

      onPanResponderGrant: (evt) => {
        scaleAtStart.current = currentScale.current;
        xAtStart.current     = currentX.current;
        yAtStart.current     = currentY.current;
        initialDist.current  = null;

        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          panStartX.current = touches[0].pageX;
          panStartY.current = touches[0].pageY;
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          // ── Pinch zoom ────────────────────────────────────────────────────
          const dx   = touches[0].pageX - touches[1].pageX;
          const dy   = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (initialDist.current === null) {
            initialDist.current  = dist;
            scaleAtStart.current = currentScale.current;
          }

          const ratio    = dist / initialDist.current;
          const raw      = scaleAtStart.current * ratio;

          // Rubber-band resistance below 1×: compress the scale so it never
          // reaches MIN_SCALE, giving a springy "you can't go further" feel
          let next: number;
          if (raw < 1) {
            // resistance curve: each unit below 1 costs progressively more
            const overshoot = 1 - raw;
            const dampened  = overshoot / (1 + overshoot * 3);
            next = Math.max(MIN_SCALE, 1 - dampened);
          } else {
            next = Math.min(5, raw);
          }

          currentScale.current = next;
          scale.setValue(next);

          // When shrinking below 1× keep translation at 0 (image is centered)
          if (next <= 1) {
            currentX.current = 0;
            currentY.current = 0;
            translateX.setValue(0);
            translateY.setValue(0);
          } else {
            const clamped = clampOffset(currentX.current, currentY.current, next);
            currentX.current = clamped.x;
            currentY.current = clamped.y;
            translateX.setValue(clamped.x);
            translateY.setValue(clamped.y);
          }

        } else if (touches.length === 1 && currentScale.current > 1) {
          // ── Pan while zoomed ──────────────────────────────────────────────
          const dx = touches[0].pageX - panStartX.current;
          const dy = touches[0].pageY - panStartY.current;

          const clamped = clampOffset(
            xAtStart.current + dx,
            yAtStart.current + dy,
            currentScale.current,
          );
          currentX.current = clamped.x;
          currentY.current = clamped.y;
          translateX.setValue(clamped.x);
          translateY.setValue(clamped.y);
        }
      },

      onPanResponderRelease: (evt, gs) => {
        initialDist.current = null;

        // Spring back to 1× if pinched below threshold
        if (currentScale.current < SNAP_BACK_BELOW) {
          animateTo(1, 0, 0);
          return;
        }

        // ── Double-tap detection ──────────────────────────────────────────
        // Only fire if the gesture was a tap (no real movement)
        const isTap = Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8;
        if (isTap) {
          const now  = Date.now();
          // locationX/Y = coords relative to the Animated.View (the image container)
          // This ensures the tap point maps correctly to image-space, not screen-space.
          const tapX = evt.nativeEvent.locationX;
          const tapY = evt.nativeEvent.locationY;

          if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            // Double tap!
            handleDoubleTap(tapX, tapY);
            lastTapTime.current = 0; // reset so a 3rd tap doesn't re-trigger
          } else {
            lastTapTime.current = now;
            lastTapX.current    = tapX;
            lastTapY.current    = tapY;
          }
        }
      },

      onPanResponderTerminate: () => {
        initialDist.current = null;
      },
    })
  ).current;

  const handleShow = () => {
    resetAll();
    Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const handleClose = () => {
    Animated.timing(bgOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      resetAll();
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
            height: IMAGE_H,
          }}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri }}
            style={{ width: SCREEN_W, height: IMAGE_H }}
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
  const [progress,     setProgress]     = useState(0);
  const [position,     setPosition]     = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [showControls, setShowControls] = useState(true);

  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackWidth = SCREEN_W - 40;

  const player = useVideoPlayer(uri ? { uri } : null, (p) => {
    p.loop                    = true;
    p.muted                   = muted;
    p.timeUpdateEventInterval = 0.25;
  });

  React.useEffect(() => {
    if (player) player.muted = muted;
  }, [muted, player]);

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
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <StatusBar hidden />
      <TouchableWithoutFeedback onPress={touchControls}>
        <View className="flex-1 bg-black items-center justify-center">

          {player && (
            <VideoView
              player={player}
              style={{ width: SCREEN_W, height: SCREEN_H * 0.5 }}
              contentFit="contain"
              nativeControls={false}
            />
          )}

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