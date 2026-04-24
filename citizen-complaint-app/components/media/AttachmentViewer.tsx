// components/general/AttachmentViewer.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { X, Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { ViewerState } from '@/hooks/general/useAttachmentViewer';

const { width: SCREEN_W } = Dimensions.get('window');

interface AttachmentViewerProps {
  viewer: ViewerState;
  onClose: () => void;
}

export function AttachmentViewer({ viewer, onClose }: AttachmentViewerProps) {
  const isVisible = viewer.type === 'image' || viewer.type === 'video';
  const attachment = isVisible ? viewer.attachment : null;

  const handleShare = useCallback(async () => {
    if (!attachment) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(attachment.uri, { dialogTitle: attachment.name });
      }
    } catch (err) {
      console.warn('Share error', err);
    }
  }, [attachment]);

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {attachment?.name ?? ''}
          </Text>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Share2 size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ── Media area — takes all remaining space ── */}
        <View style={styles.mediaArea}>
          {viewer.type === 'image' && <ImageViewer uri={viewer.attachment.uri} />}
          {viewer.type === 'video' && <VideoViewer uri={viewer.attachment.uri} />}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {attachment?.size != null && (
            <Text style={styles.footerSize}>{formatSize(attachment.size)}</Text>
          )}
          <Text style={styles.footerHint}>Tap × to close</Text>
        </View>

      </View>
    </Modal>
  );
}

// ─── Image Viewer ─────────────────────────────────────────────────────────────
function ImageViewer({ uri }: { uri: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.mediaInner}>
      {/* Loading spinner sits on top while image fetches */}
      {loading && !error && (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load image</Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={styles.fullMedia}
          contentFit="contain"
          onLoadStart={() => { setLoading(true); setError(false); }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          transition={200}
        />
      )}
    </View>
  );
}

// ─── Video Viewer ─────────────────────────────────────────────────────────────
function VideoViewer({ uri }: { uri: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.mediaInner}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      <Video
        source={{ uri }}
        style={styles.fullMedia}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        shouldPlay
        onReadyForDisplay={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Push below status bar
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 10,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Media ──
  // flex:1 → fills everything between header and footer
  mediaArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaInner: {
    flex: 1,
  },
  // width = full screen width; flex:1 height = remaining space
  fullMedia: {
    width: SCREEN_W,
    flex: 1,
  },

  // ── Helpers ──
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  footerSize: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  footerHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
});