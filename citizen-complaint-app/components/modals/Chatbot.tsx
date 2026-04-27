import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  ArrowLeft,
  Bot,
  ClipboardList,
  FileText,
  HelpCircle,
  Phone,
  Send,
  Sparkles,
  Square,
  User,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { chatbotApiClient } from '@/lib/client/chatbot';
import { getFaqReply } from '@/utils/general/chat';
import { SUGGESTIONS } from '@/constants/general/chat';
import { Role, Message } from '@/types/general/chat';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { detectIntents, TextRun, RICH_REGEX, ActionIntent } from '@/constants/chatbot/rule-based-nlp';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const MAX_CHARS = 250;
const ACTION_COOLDOWN_MS = 800;

const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

type ConnectionQuality = 'online' | 'slow' | 'offline';

// ─── Connection Quality Hook ──────────────────────────────────────────────────

function useConnectionQuality(): ConnectionQuality {
  const [quality, setQuality] = useState<ConnectionQuality>('online');

  useEffect(() => {
    const evaluate = (state: NetInfoState): ConnectionQuality => {
      if (!state.isConnected || state.isInternetReachable === false) return 'offline';
      if (state.isInternetReachable === null) return 'online';

      const type = state.type;

      if (type === 'cellular') {
        const details = state.details as any;
        const cellType: string = details?.cellularGeneration ?? '';
        if (['2g', 'edge', '2G', 'EDGE'].includes(cellType)) return 'slow';
      }

      if (type === 'wifi') {
        const details = state.details as any;
        const strength: number | undefined = details?.strength;
        if (strength !== undefined && strength < 30) return 'slow';
      }

      return 'online';
    };

    const unsubscribe = NetInfo.addEventListener((state) => setQuality(evaluate(state)));
    NetInfo.fetch().then((state) => setQuality(evaluate(state)));
    return () => unsubscribe();
  }, []);

  return quality;
}

// ─── Connection Banner ────────────────────────────────────────────────────────

function ConnectionBanner({ quality }: { quality: ConnectionQuality }) {
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const prevQuality = useRef<ConnectionQuality>('online');

  useEffect(() => {
    const shouldShow = quality !== 'online';
    const wasShowing = prevQuality.current !== 'online';
    prevQuality.current = quality;

    if (shouldShow) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (wasShowing) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -60, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [quality]);

  if (quality === 'online') return null;

  const isOffline = quality === 'offline';

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim, overflow: 'hidden' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: isOffline ? '#FEF2F2' : '#FFFBEB',
          borderBottomWidth: 1,
          borderBottomColor: isOffline ? '#FECACA' : '#FDE68A',
        }}
      >
        {isOffline ? <WifiOff size={14} color="#DC2626" /> : <Wifi size={14} color="#D97706" />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: isOffline ? '#DC2626' : '#B45309' }}>
            {isOffline ? 'Walang koneksyon sa internet' : 'Mabagal ang koneksyon'}
          </Text>
          <Text style={{ fontSize: 11, color: isOffline ? '#EF4444' : '#D97706', marginTop: 1 }}>
            {isOffline
              ? 'Hindi matanggap ang mga mensahe. Subukang kumonekta muli.'
              : 'Maaaring matagal ang sagot. Pakiusap na magantay.'}
          </Text>
        </View>
        <PulsingDot color={isOffline ? '#EF4444' : '#F59E0B'} />
      </View>
    </Animated.View>
  );
}

// ─── Pulsing Dot ──────────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, transform: [{ scale }], opacity }}
    />
  );
}

// ─── Rich Text Parser ─────────────────────────────────────────────────────────

function parseTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  RICH_REGEX.lastIndex = 0;

  while ((match = RICH_REGEX.exec(text)) !== null) {
    if (match.index > last) runs.push({ type: 'text', value: text.slice(last, match.index) });
    if (match[1] !== undefined) runs.push({ type: 'bold', value: match[1] });
    else if (match[2] !== undefined) runs.push({ type: 'bold', value: match[2] });
    else runs.push({ type: 'url', value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push({ type: 'text', value: text.slice(last) });
  return runs;
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

interface ActionButtonProps {
  intent: ActionIntent;
  onPress: () => void;
}

function ActionButton({ intent, onPress }: ActionButtonProps) {
  if (intent === 'emergency') {
    return <EmergencyButton onPress={onPress} />;
  }
  const isTrack = intent === 'track';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        backgroundColor: isTrack ? THEME.primaryMuted : '#FFF7ED',
        borderWidth: 1.5,
        borderColor: isTrack ? THEME.primary + '55' : '#FED7AA',
      }}
    >
      {isTrack
        ? <ClipboardList size={14} color={THEME.primary} />
        : <FileText size={14} color="#F97316" />
      }
      <Text style={{ fontSize: 12, fontWeight: '700', color: isTrack ? THEME.primary : '#EA580C' }}>
        {isTrack ? 'Track My Complaint' : 'File a Complaint'}
      </Text>
    </TouchableOpacity>
  );
}

function EmergencyButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1.5,
        borderColor: '#FECACA',
      }}
    >
      <Phone size={14} color="#DC2626" />
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>
        Call for an Emergency
      </Text>
    </TouchableOpacity>
  );
}

// ─── Typing Dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  const d0 = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(500),
        ])
      );
    const a0 = make(d0, 0);
    const a1 = make(d1, 140);
    const a2 = make(d2, 280);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 4 }}>
      {[d0, d1, d2].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: THEME.primary,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  showAvatar,
  isLast,
  onAction,
  onTextUpdate,
}: {
  msg: Message;
  showAvatar: boolean;
  isLast: boolean;
  onTextUpdate?: (id: string, text: string) => void;
  onAction: (intent: ActionIntent) => void;
}) {
  const isUser = msg.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 18 : -18)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // FIX: If already streamed (restored from cache or finished), show full text immediately.
  const [displayedText, setDisplayedText] = useState(
    msg.streamed || !msg.streaming ? msg.text : ''
  );
  const streamRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [intents, setIntents] = useState<ActionIntent[]>([]);

  // FIX: Detect intents immediately for already-streamed messages
  useEffect(() => {
    if (!isUser && (msg.streamed || !msg.streaming)) {
      setIntents(detectIntents(msg.text));
    }
  }, []);

  // Typewriter effect
  useEffect(() => {
    // FIX: Skip typewriter if already streamed or not streaming
    if (msg.streamed || !msg.streaming) {
      setDisplayedText(msg.text);
      if (!isUser) setIntents(detectIntents(msg.text));
      return;
    }

    let i = 0;
    const tick = () => {
      i++;
      const partial = msg.text.slice(0, i);
      setDisplayedText(partial);
      onTextUpdate?.(msg.id, partial);

      if (i < msg.text.length) {
        const ch = msg.text[i - 1];
        const delay = /[.!?\n]/.test(ch) ? 40 : /[,:]/.test(ch) ? 25 : 12;
        streamRef.current = setTimeout(tick, delay);
      }
    };

    streamRef.current = setTimeout(tick, 10);
    return () => {
      if (streamRef.current) clearTimeout(streamRef.current);
    };
  }, [msg.text, msg.streaming, msg.streamed]); // FIX: added msg.streamed to deps

  // Cursor blink — FIX: also guard on msg.streamed
  useEffect(() => {
    if (!msg.streaming || msg.streamed) {
      setCursorVisible(false);
      return;
    }
    const blink = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(blink);
  }, [msg.streaming, msg.streamed]); // FIX: added msg.streamed to deps

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const renderContent = () => {
    const textColor = isUser ? '#FFFFFF' : '#1E293B';

    if (isUser) {
      return (
        <Text style={{ fontSize: 15, lineHeight: 22, color: textColor, fontWeight: '400' }}>
          {displayedText}
        </Text>
      );
    }

    // FIX: cursor only shows when actively streaming AND not yet streamed
    const cursor = msg.streaming && !msg.streamed && cursorVisible ? '▍' : '';
    const runs = parseTextRuns(displayedText);

    return (
      <Text style={{ fontSize: 15, lineHeight: 22, color: textColor, fontWeight: '400' }}>
        {runs.map((run, idx) => {
          if (run.type === 'url') {
            return (
              <Text
                key={idx}
                onPress={() => Linking.openURL(run.value)}
                style={{ color: '#2563EB', textDecorationLine: 'underline', fontWeight: '500' }}
              >
                {run.value}
              </Text>
            );
          }
          if (run.type === 'bold') {
            return (
              <Text key={idx} style={{ fontWeight: '700', color: textColor }}>
                {run.value}
              </Text>
            );
          }
          return <Text key={idx}>{run.value}</Text>;
        })}
        {cursor ? <Text style={{ color: textColor }}>{cursor}</Text> : null}
      </Text>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: isLast ? 12 : 3,
      }}
    >
      {!isUser && (
        <View style={{ width: 32, height: 32, flexShrink: 0, marginRight: 8, marginBottom: 2 }}>
          {showAvatar && (
            <View
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: THEME.primary,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Bot size={15} color="white" />
            </View>
          )}
        </View>
      )}

      <View style={{ maxWidth: '75%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <View
          style={
            isUser
              ? {
                  backgroundColor: THEME.primary,
                  borderRadius: 20, borderBottomRightRadius: 5,
                  paddingHorizontal: 16, paddingVertical: 10,
                  shadowColor: THEME.primaryDark, shadowOpacity: 0.3,
                  shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
                }
              : {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20, borderBottomLeftRadius: 5,
                  paddingHorizontal: 16, paddingVertical: 10,
                  borderWidth: 1, borderColor: '#F1F5F9',
                  shadowColor: '#94a3b8', shadowOpacity: 0.12,
                  shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
                }
          }
        >
          {renderContent()}
        </View>

        {!isUser && !msg.streaming && intents.length > 0 && (
          <View style={{ marginTop: 2, gap: 4 }}>
            {intents.map((intent) => (
              <ActionButton key={intent} intent={intent} onPress={() => onAction(intent)} />
            ))}
          </View>
        )}

        {isLast && !msg.streaming && (
          <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, marginHorizontal: 2 }}>
            {formatTime(msg.timestamp)}
          </Text>
        )}
      </View>

      {isUser && (
        <View
          style={{
            width: 32, height: 32, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 2, marginLeft: 8, flexShrink: 0,
            backgroundColor: '#E2E8F0',
          }}
        >
          <User size={14} color="#64748B" />
        </View>
      )}
    </Animated.View>
  );
}

// ─── Suggestion Chip ──────────────────────────────────────────────────────────

function SuggestionChip({
  text,
  onPress,
  disabled,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.72}
      disabled={disabled}
      style={{
        borderWidth: 1.5,
        borderColor: disabled ? '#E2E8F0' : THEME.primary + '55',
        backgroundColor: disabled ? '#F8FAFC' : THEME.primaryMuted,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
        marginRight: 8, opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: disabled ? '#94A3B8' : THEME.primary, fontSize: 12, fontWeight: '600' }}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSeparator() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginVertical: 16, gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
      <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, backgroundColor: '#F1F5F9' }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>Ngayon</Text>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
    </View>
  );
}

// ─── Bot Info Card ────────────────────────────────────────────────────────────

function BotInfo() {
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginHorizontal: 16, marginBottom: 16, marginTop: 8,
        borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: THEME.primaryMuted,
        borderWidth: 1, borderColor: THEME.primary + '33',
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: THEME.primary,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Zap size={18} color="white" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: THEME.primaryDark }}>
          Mary bot FAQ Assistant
        </Text>
        <Text style={{ fontSize: 11, color: THEME.primary, marginTop: 1 }}>
          {t('chatbot.info')}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const connectionQuality = useConnectionQuality();
  const { t } = useTranslation();

  const isOffline = connectionQuality === 'offline';
  const isSlow = connectionQuality === 'slow';

  const makeInitialMessages = (): Message[] => [
    {
      id: uid(),
      role: 'bot',
      text: t('chatbot.greeting'),
      timestamp: new Date(),
      streaming: false,
      streamed: true, // FIX: initial greeting is already "done"
    },
  ];

  const [messages, setMessages] = useState<Message[]>(makeInitialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ── Cooldown state ──
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelScaleAnim = useRef(new Animated.Value(1)).current;

  const listRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamFinishRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSendingRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const generationRef = useRef(0);
  const currentBotIdRef = useRef<string | null>(null);
  const cancelledIdsRef = useRef<Set<string>>(new Set());
  const displayedTextRef = useRef<string>('');

  // ── Session cache — persists across modal opens within 30 minutes ──
  const sessionCacheRef = useRef<{
    sessionId: string;
    messages: Message[];
    closedAt: Date;
  } | null>(null);

  const charCount = input.length;
  const isNearLimit = charCount >= MAX_CHARS - 30;
  const isAtLimit = charCount >= MAX_CHARS;

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated }), 60);
    if (Platform.OS === 'android') {
      setTimeout(() => listRef.current?.scrollToEnd({ animated }), 250);
    }
  }, []);

  const scrollToBottomIfNear = useCallback((animated = true) => {
    if (isNearBottomRef.current) scrollToBottom(animated);
  }, [scrollToBottom]);

  const startCooldown = useCallback(() => {
    setIsCoolingDown(true);

    Animated.sequence([
      Animated.timing(cancelScaleAnim, {
        toValue: 0.82,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cancelScaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => {
      setIsCoolingDown(false);
      cooldownRef.current = null;
    }, ACTION_COOLDOWN_MS);
  }, [cancelScaleAnim]);

  // ── Modal open / close lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      const now = new Date();
      const cache = sessionCacheRef.current;
      const withinWindow =
        cache !== null &&
        now.getTime() - cache.closedAt.getTime() < 30 * 60 * 1000;

      if (withinWindow) {
        setSessionId(cache!.sessionId);
        setMessages(cache!.messages);
      } else {
        setSessionId(uuidv4());
        setMessages(makeInitialMessages());
      }

      isNearBottomRef.current = true;
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } else {
      // FIX: freeze streaming + mark all as streamed before caching
      sessionCacheRef.current = {
        sessionId: sessionId ?? uuidv4(),
        messages: messages.map((m) => ({ ...m, streaming: false, streamed: true })),
        closedAt: new Date(),
      };

      setInput('');
      setIsTyping(false);
      setIsStreaming(false);

      if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
      if (streamFinishRef.current) { clearTimeout(streamFinishRef.current); streamFinishRef.current = null; }
      isSendingRef.current = false;
      currentBotIdRef.current = null;
      cancelledIdsRef.current.clear();
      displayedTextRef.current = '';

      if (cooldownRef.current) { clearTimeout(cooldownRef.current); cooldownRef.current = null; }
      setIsCoolingDown(false);

      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT, duration: 300,
        easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAction = useCallback(
    (intent: ActionIntent) => {
      const routes: Record<ActionIntent, string> = {
        track: '/complaints/UserComplaints',
        file: '/(tabs)/Complaints',
        emergency: '/(tabs)/Emergency',
      };
      const route = routes[intent];
      if (!route) return;
      onClose();
      setTimeout(() => router.push(route as any), 320);
    },
    [router, onClose]
  );

  const handleCancel = useCallback(() => {
    if (isCoolingDown) return;

    generationRef.current += 1;

    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (streamFinishRef.current) { clearTimeout(streamFinishRef.current); streamFinishRef.current = null; }

    setIsTyping(false);
    setIsStreaming(false);

    if (currentBotIdRef.current) {
      const idToFreeze = currentBotIdRef.current;
      const partial = displayedTextRef.current;
      // FIX: mark as streamed: true so it won't retype on next open
      setMessages((prev) =>
        prev.map((m) =>
          m.id === idToFreeze ? { ...m, streaming: false, streamed: true, text: partial } : m
        )
      );
      currentBotIdRef.current = null;
      displayedTextRef.current = '';
    }

    isSendingRef.current = false;
    startCooldown();
  }, [isCoolingDown, startCooldown]);

  const sendMessage = useCallback(
    async (text: string, isSuggestion = false) => {
      const trimmed = text.trim();
      if (!trimmed || isOffline) return;

      if (isSendingRef.current || isCoolingDown) return;
      isSendingRef.current = true;

      startCooldown();

      if (isTyping || isStreaming) handleCancel();

      generationRef.current += 1;
      const myGeneration = generationRef.current;

      setInput('');

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        text: trimmed,
        timestamp: new Date(),
        streaming: false,
        streamed: true, // FIX: user messages are always "done"
      };
      setMessages((prev) => [...prev, userMsg]);

      isNearBottomRef.current = true;
      scrollToBottom();

      setIsTyping(true);

      let reply: string;

      if (isSuggestion) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        if (generationRef.current !== myGeneration) return;
        reply = getFaqReply(trimmed);
      } else {
        try {
          abortRef.current = new AbortController();
          const response = await chatbotApiClient.post(
            '/ask',
            { question: trimmed, session_id: sessionId },
            { signal: abortRef.current.signal }
          );
          if (generationRef.current !== myGeneration) return;
          reply = response.data.answer;
        } catch (err: any) {
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
            setIsTyping(false);
            isSendingRef.current = false;
            return;
          }
          if (generationRef.current !== myGeneration) return;
          reply =
            'Pasensya na, may problema sa koneksyon. Subukan ulit o pumili mula sa mga mungkahi sa itaas. 🙏';
        } finally {
          abortRef.current = null;
        }
      }

      setIsTyping(false);
      setIsStreaming(true);

      const botId = uid();
      currentBotIdRef.current = botId;

      const botMsg: Message = {
        id: botId,
        role: 'bot',
        text: reply,
        timestamp: new Date(),
        streaming: true,
        streamed: false, // FIX: explicitly false — this one should animate
      };
      setMessages((prev) => [...prev, botMsg]);

      isNearBottomRef.current = true;
      scrollToBottom();

      const estimatedDuration = reply.length * 13;
      streamFinishRef.current = setTimeout(() => {
        if (generationRef.current !== myGeneration) return;
        // FIX: mark streamed: true when animation completes
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, streaming: false, streamed: true } : m))
        );
        setIsStreaming(false);
        streamFinishRef.current = null;
        currentBotIdRef.current = null;
        isSendingRef.current = false;
      }, estimatedDuration);
    },
    [isTyping, isStreaming, handleCancel, scrollToBottom, sessionId, isOffline, isCoolingDown, startCooldown]
  );

  const isBusy = isTyping || isStreaming;
  const sendDisabled = isOffline || !input.trim() || isCoolingDown;
  const kavOffset = Platform.OS === 'android' ? STATUS_BAR_HEIGHT : insets.top;

  return (
    <Modal visible={visible} transparent={false} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Animated.View style={{ flex: 1, transform: [{ translateY: slideAnim }] }}>
          <KeyboardAvoidingView style={{ flex: 1 }} keyboardVerticalOffset={kavOffset} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

            {/* ── Header ── */}
            <View
              style={{
                paddingTop: insets.top,
                backgroundColor: '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
                shadowColor: '#000', shadowOpacity: 0.06,
                shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 8, paddingVertical: 10, gap: 8,
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={22} color="#1E293B" />
                </TouchableOpacity>

                <View style={{ position: 'relative', marginRight: 4 }}>
                  <View
                    style={{
                      width: 42, height: 42, borderRadius: 21,
                      backgroundColor: THEME.primary,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Bot size={20} color="white" />
                  </View>
                  <View
                    style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: 6,
                      backgroundColor: isOffline ? '#94A3B8' : isSlow ? '#F59E0B' : '#22C55E',
                      borderWidth: 2, borderColor: '#FFFFFF',
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Mary Bot</Text>
                    <Sparkles size={12} color={THEME.primary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 11, fontWeight: '500', marginTop: 1,
                      color: isOffline ? '#DC2626' : isSlow ? '#D97706' : isBusy ? THEME.primary : '#64748B',
                    }}
                  >
                    {isOffline
                      ? 'Walang koneksyon'
                      : isSlow
                        ? 'Mabagal ang koneksyon'
                        : isBusy
                          ? t('chatbot.typing')
                          : 'FAQ · Santa Maria, Laguna'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Message List ── */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              onContentSizeChange={() => {
                scrollToBottomIfNear(true);
              }}
              onLayout={() => {
                if (isNearBottomRef.current) {
                  listRef.current?.scrollToEnd({ animated: false });
                }
              }}
              onScroll={(e) => {
                const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                isNearBottomRef.current =
                  contentOffset.y + layoutMeasurement.height >= contentSize.height - 200;
              }}
              scrollEventThrottle={100}
              ListHeaderComponent={
                <>
                  <DateSeparator />
                  <BotInfo />
                </>
              }
              renderItem={({ item, index }) => {
                const next = messages[index + 1];
                const isLast = !next || next.role !== item.role;
                const showAvatar = item.role === 'bot' && isLast;
                return (
                  <MessageBubble
                    msg={item}
                    showAvatar={showAvatar}
                    isLast={isLast}
                    onAction={handleAction}
                    onTextUpdate={(id, text) => {
                      if (id === currentBotIdRef.current) {
                        displayedTextRef.current = text;
                        scrollToBottomIfNear();
                      }
                    }}
                  />
                );
              }}
              ListFooterComponent={
                isTyping ? (
                  <Animated.View
                    style={{
                      flexDirection: 'row', alignItems: 'flex-end',
                      paddingHorizontal: 16, marginTop: 4, marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: THEME.primary,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 8, marginBottom: 2,
                      }}
                    >
                      <Bot size={14} color="white" />
                    </View>
                    <View
                      style={{
                        backgroundColor: '#FFFFFF', borderRadius: 20, borderBottomLeftRadius: 5,
                        paddingHorizontal: 16, paddingVertical: 12,
                        borderWidth: 1, borderColor: '#F1F5F9',
                        shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
                      }}
                    >
                      <TypingDots />
                    </View>
                  </Animated.View>
                ) : null
              }
            />

            {/* ── Bottom Area ── */}
            <View>
              <ConnectionBanner quality={connectionQuality} />

              {/* Suggestion chips */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopWidth: connectionQuality !== 'online' ? 0 : 1,
                  borderTopColor: '#F1F5F9',
                  paddingTop: 12, paddingBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10, color: '#94A3B8', fontWeight: '700',
                    letterSpacing: 1.2, textTransform: 'uppercase',
                    paddingHorizontal: 16, marginBottom: 8,
                  }}
                >
                  {t('chatbot.frequentQuestions')}
                </Text>
                <FlatList
                  data={SUGGESTIONS}
                  keyExtractor={(s) => s}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  renderItem={({ item }) => (
                    <SuggestionChip
                      text={t(`chatbot.suggestions.${item}`)}
                      onPress={() => sendMessage(t(`chatbot.suggestions.${item}`), true)}
                      disabled={isBusy || isOffline || isCoolingDown}
                    />
                  )}
                />
              </View>

              {/* Input bar */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopWidth: 1, borderTopColor: '#F1F5F9',
                  paddingHorizontal: 12, paddingTop: 10,
                  paddingBottom: Math.max(insets.bottom, 12),
                }}
              >
                <View style={{ alignItems: 'flex-end', paddingHorizontal: 4, marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: isAtLimit
                        ? '#DC2626'
                        : charCount >= MAX_CHARS - 10
                          ? '#F97316'
                          : '#94A3B8',
                    }}
                  >
                    {charCount}/{MAX_CHARS}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                  <View
                    style={{
                      flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24,
                      paddingHorizontal: 16, paddingVertical: 2,
                      flexDirection: 'row', alignItems: 'flex-end',
                      minHeight: 44, borderWidth: 1.5,
                      borderColor: isAtLimit
                        ? '#DC2626'
                        : isOffline
                          ? '#FECACA'
                          : isSlow
                            ? '#FDE68A'
                            : isBusy
                              ? THEME.primary + '55'
                              : '#E2E8F0',
                    }}
                  >
                    <TextInput
                      ref={inputRef}
                      value={input}
                      onChangeText={(text) => {
                        if (text.length <= MAX_CHARS) setInput(text);
                      }}
                      placeholder={
                        isOffline
                          ? t('chatbot.placeholder.offline')
                          : isSlow
                            ? t('chatbot.placeholder.slow')
                            : isBusy
                              ? t('chatbot.placeholder.busy')
                              : t('chatbot.askInput')
                      }
                      placeholderTextColor={isOffline ? '#EF4444' : '#94A3B8'}
                      multiline
                      maxLength={MAX_CHARS}
                      editable={!isOffline}
                      style={{
                        flex: 1, fontSize: 15,
                        color: isOffline ? '#94A3B8' : '#1E293B',
                        paddingTop: 10, paddingBottom: 10,
                        maxHeight: 100, lineHeight: 20,
                      }}
                      returnKeyType="default"
                    />
                  </View>

                  {isBusy ? (
                    <Animated.View style={{ transform: [{ scale: cancelScaleAnim }] }}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        disabled={isCoolingDown}
                        activeOpacity={0.8}
                        style={{
                          width: 44, height: 44, borderRadius: 22,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isCoolingDown ? '#F1F5F9' : '#FEE2E2',
                          borderWidth: 1.5,
                          borderColor: isCoolingDown ? '#E2E8F0' : '#FECACA',
                          opacity: isCoolingDown ? 0.5 : 1,
                        }}
                      >
                        <Square
                          size={16}
                          color={isCoolingDown ? '#94A3B8' : '#EF4444'}
                          fill={isCoolingDown ? '#94A3B8' : '#EF4444'}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <Animated.View style={{ transform: [{ scale: cancelScaleAnim }] }}>
                      <TouchableOpacity
                        onPress={() => sendMessage(input)}
                        disabled={sendDisabled}
                        activeOpacity={0.8}
                        style={{
                          width: 44, height: 44, borderRadius: 22,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: sendDisabled ? '#E2E8F0' : THEME.primary,
                          shadowColor: sendDisabled ? 'transparent' : THEME.primaryDark,
                          shadowOpacity: 0.35, shadowRadius: 8,
                          shadowOffset: { width: 0, height: 3 },
                          elevation: sendDisabled ? 0 : 4,
                          opacity: isCoolingDown ? 0.5 : 1,
                        }}
                      >
                        <Send size={18} color={sendDisabled ? '#94A3B8' : '#FFFFFF'} style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>

          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}