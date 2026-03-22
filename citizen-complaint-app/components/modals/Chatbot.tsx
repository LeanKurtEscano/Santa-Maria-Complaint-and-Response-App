/**
 * ChatbotModal — Full-screen FAQ Chatbot for Santa Maria, Laguna.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bot,
  HelpCircle,
  Send,
  Sparkles,
  Square,
  User,
  Zap,
} from 'lucide-react-native';
import { chatbotApiClient } from '@/lib/client/chatbot';
import { getFaqReply } from '@/utils/general/chat';
import { SUGGESTIONS } from '@/constants/general/chat';
import { Role, Message } from '@/types/general/chat';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;



const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });

let _id = 0;
const uid = () => String(++_id);

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
    <View className="flex-row items-center gap-[5px] px-1">
      {[d0, d1, d2].map((dot, i) => (
        <Animated.View
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-blue-400"
          style={{ transform: [{ translateY: dot }] }}
        />
      ))}
    </View>
  );
}

function MessageBubble({
  msg,
  showAvatar,
  isLast,
}: {
  msg: Message;
  showAvatar: boolean;
  isLast: boolean;
}) {
  const isUser = msg.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 18 : -18)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [displayedText, setDisplayedText] = useState(msg.streaming ? '' : msg.text);
  const streamRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Character-by-character streaming effect
  useEffect(() => {
    if (!msg.streaming) {
      setDisplayedText(msg.text);
      return;
    }
    let i = 0;
    const tick = () => {
      i++;
      setDisplayedText(msg.text.slice(0, i));
      if (i < msg.text.length) {
        const ch = msg.text[i - 1];
        const delay = /[.!?\n]/.test(ch) ? 40 : /[,:]/.test(ch) ? 25 : 12;
        streamRef.current = setTimeout(tick, delay);
      }
    };
    streamRef.current = setTimeout(tick, 10);
    return () => { if (streamRef.current) clearTimeout(streamRef.current); };
  }, [msg.text, msg.streaming]);

  // Blinking cursor while streaming
  useEffect(() => {
    if (!msg.streaming) return;
    const blink = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(blink);
  }, [msg.streaming]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const textToShow = msg.streaming
    ? displayedText + (cursorVisible ? '▍' : ' ')
    : displayedText;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }, { scale: scaleAnim }] }}
      className={`flex-row items-end px-4 ${isUser ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-3' : 'mb-[3px]'}`}
    >
      {!isUser && (
        <View className="w-8 h-8 shrink-0 mr-2 mb-0.5">
          {showAvatar ? (
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: '#2563EB' }}
            >
              <Bot size={15} color="white" />
            </View>
          ) : null}
        </View>
      )}

      <View className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <View
          style={
            isUser
              ? {
                backgroundColor: '#2563EB',
                borderRadius: 20,
                borderBottomRightRadius: 5,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: '#1d4ed8',
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 4,
              }
              : {
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderBottomLeftRadius: 5,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: '#F1F5F9',
                shadowColor: '#94a3b8',
                shadowOpacity: 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
          }
        >
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: isUser ? '#FFFFFF' : '#1E293B',
              fontWeight: '400',
            }}
          >
            {textToShow}
          </Text>
        </View>
        {isLast && !msg.streaming && (
          <Text className="text-[10px] text-slate-400 mt-1 mx-0.5">
            {formatTime(msg.timestamp)}
          </Text>
        )}
      </View>

      {isUser && (
        <View
          className="w-8 h-8 rounded-full items-center justify-center mb-0.5 ml-2 shrink-0"
          style={{ backgroundColor: '#E2E8F0' }}
        >
          <User size={14} color="#64748B" />
        </View>
      )}
    </Animated.View>
  );
}

// ─── Suggestion chip ──────────────────────────────────────────────────────────

function SuggestionChip({ text, onPress, disabled }: { text: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.72}
      disabled={disabled}
      style={{
        borderWidth: 1.5,
        borderColor: disabled ? '#E2E8F0' : '#BFDBFE',
        backgroundColor: disabled ? '#F8FAFC' : '#EFF6FF',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: disabled ? '#94A3B8' : '#2563EB', fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </TouchableOpacity>
  );
}
// ─── Date separator ───────────────────────────────────────────────────────────

function DateSeparator() {
  return (
    <View className="flex-row items-center px-8 my-4 gap-3">
      <View className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
      <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>Ngayon</Text>
      </View>
      <View className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
    </View>
  );
}

// ─── Bot header branding ──────────────────────────────────────────────────────

function BotInfo() {
  return (
    <View
      className="mx-4 mb-4 mt-2 rounded-2xl p-4 flex-row items-center gap-3"
      style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: '#2563EB' }}
      >
        <Zap size={18} color="white" />
      </View>
      <View className="flex-1">
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E40AF' }}>
          SantaBot FAQ Assistant
        </Text>
        <Text style={{ fontSize: 11, color: '#3B82F6', marginTop: 1 }}>
          Tanungin mo ako tungkol sa Santa Maria, Laguna — reklamo, serbisyo, dokumento, at higit pa.
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

// ✅ Use a fixed constant ID — never changes across reloads
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'bot-welcome',   
    role: 'bot',
    text: 'Kamusta! Ako si SantaBot 👋\n\nAng iyong FAQ assistant para sa Munisipalidad ng Santa Maria, Laguna.\n\nAno ang maipaglilingkod ko sa iyo?',
    timestamp: new Date(),
    streaming: false,
  },
];


export default function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
  const insets = useSafeAreaInsets();


  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);      // waiting for API / local reply
  const [isStreaming, setIsStreaming] = useState(false); // bot bubble animating text
  // const [showSuggestions, setShowSuggestions] = useState(true);

  const listRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);

  // Abort controller ref — cancelled when user hits Stop
  const abortRef = useRef<AbortController | null>(null);
  // Timeout ref for the streaming finish timer
  const streamFinishRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ─── Cancel — stop typing dots OR stop streaming animation ───────────────
  const handleCancel = useCallback(() => {
    // Abort in-flight API request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Clear streaming finish timer
    if (streamFinishRef.current) {
      clearTimeout(streamFinishRef.current);
      streamFinishRef.current = null;
    }
    // Stop typing indicator
    setIsTyping(false);
    // Immediately finalize any streaming bubble
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
  }, []);

  // ─── Send ─────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, isSuggestion = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // If already busy, cancel current response first then proceed
      if (isTyping || isStreaming) {
        handleCancel();
      }

      setInput('');
      // setShowSuggestions(false);

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        text: trimmed,
        timestamp: new Date(),
        streaming: false,
      };
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

      setIsTyping(true);

      let reply: string;

      if (isSuggestion) {
        // Local FAQ — no network call
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        reply = getFaqReply(trimmed);
      } else {
        // RAG backend with abort support
        try {
          abortRef.current = new AbortController();
          const response = await chatbotApiClient.post(
            '/ask',
            { question: trimmed },
            { signal: abortRef.current.signal }
          );
          reply = response.data.answer;
        } catch (err: any) {
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
            // User cancelled — remove the user message optimistically and stop
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
            setIsTyping(false);
            return;
          }
          reply =
            'Pasensya na, may problema sa koneksyon. Subukan ulit o pumili mula sa mga mungkahi sa itaas. 🙏';
        } finally {
          abortRef.current = null;
        }
      }

      setIsTyping(false);
      setIsStreaming(true);

      const botId = uid();
      const botMsg: Message = {
        id: botId,
        role: 'bot',
        text: reply,
        timestamp: new Date(),
        streaming: true,
      };
      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

      // Flip streaming off after animation completes
      const estimatedDuration = reply.length * 13;
      streamFinishRef.current = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, streaming: false } : m))
        );
        setIsStreaming(false);
        streamFinishRef.current = null;
      }, estimatedDuration);
    },
    [isTyping, isStreaming, handleCancel]
  );

  const isBusy = isTyping || isStreaming;
  const kavOffset = Platform.OS === 'android' ? STATUS_BAR_HEIGHT : insets.top;

  return (
    <Modal visible={visible} transparent={false} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Animated.View style={{ flex: 1, transform: [{ translateY: slideAnim }] }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={kavOffset}>

            {/* ── Header ── */}
            <View
              style={{
                paddingTop: insets.top,
                backgroundColor: '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, gap: 8 }}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={22} color="#1E293B" />
                </TouchableOpacity>

                <View style={{ position: 'relative', marginRight: 4 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={20} color="white" />
                  </View>
                  <View style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF' }} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>SantaBot</Text>
                    <Sparkles size={12} color="#3B82F6" />
                  </View>
                  <Text style={{ fontSize: 11, color: isBusy ? '#3B82F6' : '#64748B', fontWeight: '500', marginTop: 1 }}>
                    {isBusy ? 'Nagtytype...' : 'FAQ · Santa Maria, Laguna'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}
                >
                  <HelpCircle size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Messages ── */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              ListHeaderComponent={<><DateSeparator /><BotInfo /></>}
              renderItem={({ item, index }) => {
                const next = messages[index + 1];
                const isLast = !next || next.role !== item.role;
                const showAvatar = item.role === 'bot' && isLast;
                return <MessageBubble msg={item} showAvatar={showAvatar} isLast={isLast} />;
              }}
              ListFooterComponent={
                isTyping ? (
                  <Animated.View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 4, marginBottom: 4 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2 }}>
                      <Bot size={14} color="white" />
                    </View>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderBottomLeftRadius: 5, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1 }}>
                      <TypingDots />
                    </View>
                  </Animated.View>
                ) : null
              }
            />

            {/* ── Suggestions ── */}
            {/* {showSuggestions && (
              <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, paddingBottom: 10 }}>
                <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
                  Mga Madalas na Tanong
                </Text>
                <FlatList
                  data={SUGGESTIONS}
                  keyExtractor={(s) => s}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  renderItem={({ item }) => (
                    <SuggestionChip text={item} onPress={() => sendMessage(item, true)} />
                  )}
                />
              </View>
            )}



            {/* ── Input bar ── */}

            <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, paddingBottom: 10 }}>
              <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
                Mga Madalas na Tanong
              </Text>
              <FlatList
                data={SUGGESTIONS}
                keyExtractor={(s) => s}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item }) => (
                  <SuggestionChip
                    text={item}
                    onPress={() => sendMessage(item, true)}
                    disabled={isBusy}  // 👈 add this
                  />
                )}
              />
            </View>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
                paddingHorizontal: 12,
                paddingTop: 10,
                paddingBottom: Math.max(insets.bottom, 12),
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F1F5F9',
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 2,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  minHeight: 44,
                  borderWidth: 1.5,
                  borderColor: isBusy ? '#BFDBFE' : '#E2E8F0',
                }}
              >
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder={isBusy ? 'Naghihintay sa sagot...' : 'Magtanong tungkol sa Santa Maria...'}
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={500}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: '#1E293B',
                    paddingTop: 10,
                    paddingBottom: 10,
                    maxHeight: 100,
                    lineHeight: 20,
                  }}
                  returnKeyType="default"
                />
              </View>

              {/* Stop button — shown while busy */}
              {isBusy ? (
                <TouchableOpacity
                  onPress={handleCancel}
                  activeOpacity={0.8}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FEE2E2',
                    borderWidth: 1.5,
                    borderColor: '#FECACA',
                  }}
                >
                  <Square size={16} color="#EF4444" fill="#EF4444" />
                </TouchableOpacity>
              ) : (
                /* Send button */
                <TouchableOpacity
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim()}
                  activeOpacity={0.8}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: input.trim() ? '#2563EB' : '#E2E8F0',
                    shadowColor: input.trim() ? '#1d4ed8' : 'transparent',
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: input.trim() ? 4 : 0,
                  }}
                >
                  <Send size={18} color={input.trim() ? '#FFFFFF' : '#94A3B8'} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              )}
            </View>

          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}