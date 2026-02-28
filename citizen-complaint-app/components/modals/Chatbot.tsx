/**
 * ChatbotModal — Full-screen FAQ Chatbot for Santa Maria, Laguna.
 *
 * KEYBOARD FIX:
 *  - KeyboardAvoidingView uses behavior="padding" on BOTH platforms
 *  - Input bar is rendered OUTSIDE the FlatList, inside the KAV flex container
 *  - keyboardVerticalOffset accounts for the status bar height on Android
 *  - useSafeAreaInsets handles notch / home indicator padding manually
 *  - This guarantees the input bar is always fully visible above the keyboard
 *
 * Stack: React Native + NativeWind + react-native-safe-area-context
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
  User,
  Zap,
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'bot';
interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

// ─── FAQ Suggestions ──────────────────────────────────────────────────────────

const SUGGESTIONS = [
  '📋 Paano mag-file ng reklamo?',
  '🔍 Status ng aking reklamo',
  '📄 Barangay clearance',
  '🏛️ Mga serbisyo ng munisipyo',
  '⏰ Oras ng opisina',
  '📞 Mga contact numbers',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });

let _id = 0;
const uid = () => String(++_id);

// ─── FAQ knowledge base ───────────────────────────────────────────────────────

function getFaqReply(input: string): string {
  const l = input.toLowerCase();

  if ((l.includes('reklamo') || l.includes('complaint')) &&
      (l.includes('file') || l.includes('paano') || l.includes('submit') || l.includes('isumite'))) {
    return '📋 Para mag-file ng reklamo sa Santa Maria:\n\n1️⃣ Buksan ang "Mga Reklamo" tab sa ibaba\n2️⃣ I-tap ang "Magsumite ng Reklamo"\n3️⃣ Piliin ang kategorya ng iyong reklamo\n4️⃣ Isulat ang detalye — maging tiyak at malinaw\n5️⃣ Mag-attach ng larawan/dokumento kung mayroon\n6️⃣ I-tap ang Submit\n\nTatanggap ka ng notification kapag may update. ✅';
  }
  if (l.includes('status') || (l.includes('reklamo') && (l.includes('track') || l.includes('ano na') || l.includes('update')))) {
    return '🔍 Makikita ang status ng iyong reklamo sa "Mga Reklamo" tab.\n\nMga estado:\n🔵 Isinumite — natanggap na\n🟡 Sa Proseso — isinasaalang-alang\n🟢 Nalutas — naresolba na\n🔴 Tinanggihan — may kulang na info\n\nMatanggap ka ng push notification sa bawat pagbabago. 📲';
  }
  if (l.includes('clearance') || l.includes('barangay clearance')) {
    return '🏘️ Para makakuha ng Barangay Clearance:\n\n📍 Pumunta sa iyong barangay hall\n🕗 8:00 AM – 5:00 PM, Lunes–Biyernes\n\n📄 Mga kailangan:\n• Valid ID (kahit isa)\n• Proof of residency (kung bago)\n\n💵 Bayad: ₱50–₱100\n⏱️ Oras ng pagproseso: 15–30 minuto\n\n💡 Tip: Pumunta nang maaga para maiwasan ang pila!';
  }
  if (l.includes('dokumento') || l.includes('cedula') || l.includes('certificate') || l.includes('permit') || l.includes('sertipiko')) {
    return '📄 Mga dokumento sa Santa Maria:\n\n• Barangay Clearance → barangay hall\n• Cedula (CTC) → munisipyo\n• Business Permit → BPLO\n• Certificate of Residency → barangay hall\n• Building Permit → Engineering Office\n• Birth/Death/Marriage → Civil Registry\n\n📍 Munisipyo: Magsaysay Ave., Santa Maria\n🕗 8AM–5PM, Lunes–Biyernes';
  }
  if (l.includes('oras') || l.includes('schedule') || l.includes('bukas') || l.includes('open')) {
    return '🕗 Oras ng Munisipalidad ng Santa Maria:\n\n📅 Lunes – Biyernes: 8:00 AM – 5:00 PM\n❌ Sarado: Sabado, Linggo, at pista opisyal\n\nMga 24/7 na serbisyo:\n🚨 Emergency hotlines\n🌊 MDRRMO (disaster response)\n\nPara sa espesyal na schedule, makipag-ugnayan sa opisina. 📞';
  }
  if (l.includes('contact') || l.includes('hotline') || l.includes('numero') || l.includes('telepono') || l.includes('makausap')) {
    return '📞 Mga contact ng Santa Maria, Laguna:\n\n🏛️ Munisipyo → "Hotlines" tab sa app\n🚒 BFP (Fire) → 911\n👮 PNP (Pulisya) → 911\n🌊 MDRRMO → 24/7 hotline\n🏥 RHU → sa loob ng munisipyo\n\nPara sa kumpletong listahan, buksan ang "Hotlines" tab. 📱';
  }
  if (l.includes('serbisyo') || l.includes('services') || l.includes('available')) {
    return '🏛️ Mga serbisyo ng Munisipalidad ng Santa Maria:\n\n📋 Pagsasampa ng reklamo\n📄 Mga dokumento at permit\n💊 Pangunahing kalusugan (RHU)\n🌊 Disaster response (MDRRMO)\n🏗️ Engineering at imprastraktura\n📚 Social welfare (MSWDO)\n💼 Business permit at licensing\n🌿 Agricultural support (MAO)\n👶 Day care at programa para kabataan';
  }
  if (l.includes('opisyal') || l.includes('mayor') || l.includes('kapitan') || l.includes('gobyerno')) {
    return '🏛️ Ang Santa Maria ay pinamumunuan ng:\n\n• Municipal Mayor — pinakamataas na opisyal\n• Vice Mayor — namumuno sa Sangguniang Bayan\n• Mga Konsehal — gumagawa ng batas\n• Mga Kapitan — namumuno sa bawat barangay\n\nPara sa listahan ng opisyal, bisitahin ang opisyal na website ng Santa Maria o makipag-ugnayan sa munisipyo. 📢';
  }
  if (l.includes('saan') || l.includes('address') || l.includes('lokasyon') || l.includes('location')) {
    return '📍 Munisipalidad ng Santa Maria\nMagsaysay Ave., Santa Maria, Laguna\n\n🗺️ Matatagpuan sa hilagang bahagi ng Laguna\n\nMga barangay ng Santa Maria:\nAmuyong, Bagong Bayan, Bubukal, Calios, Duhat, Ibabang Iyam, Ilayang Iyam, Kanluran, Labasan, Malinao, Malinta, Muzon, Palayan, Pulong Buhangin, Sto. Cristo, Talangka, at iba pa.\n\n🗺️ I-search sa Google Maps: "Santa Maria Municipal Hall, Laguna"';
  }
  if (l.includes('baha') || l.includes('bagyo') || l.includes('sakuna') || l.includes('emergency') || l.includes('lindol')) {
    return '🚨 Para sa mga emergency sa Santa Maria:\n\n☎️ MDRRMO — available 24/7\n☎️ 911 — para sa agarang tulong\n\nKung may babala ng bagyo o baha:\n• Huwag lumabas kung hindi kinakailangan\n• Ihanda ang emergency kit\n• Sundan ang instruksyon ng barangay\n• Iulat ang delikadong sitwasyon sa MDRRMO\n\n⚠️ Para sa agarang tulong: 911';
  }
  if (l.includes('kalusugan') || l.includes('health') || l.includes('rhu') || l.includes('doktor') || l.includes('bakuna')) {
    return '🏥 Serbisyong pangkalusugan sa Santa Maria:\n\nRural Health Unit (RHU)\n📍 Sa loob ng munisipyo\n🕗 8AM–5PM, Lunes–Biyernes\n\nMga serbisyo:\n💉 Bakuna (immunization)\n🤰 Prenatal at maternal care\n👶 Child health services\n💊 Free basic medicines\n🩺 Medical consultation\n\n🚑 Emergency: pumunta sa pinakamalapit na ospital o 911';
  }
  if (l.includes('bayad') || l.includes('magkano') || l.includes('libre') || l.includes('fee')) {
    return '💰 Impormasyon sa bayad:\n\n🆓 LIBRE:\n• Pagsasampa ng reklamo\n• Basic health consultation\n• Bakuna para sa bata\n• Social welfare assistance\n\n💵 MAY BAYAD:\n• Barangay Clearance: ₱50–₱100\n• Cedula: nakabatay sa kita\n• Business Permit: nakabatay sa negosyo\n• Building Permit: nakabatay sa proyekto\n\nPara sa eksaktong halaga, makipag-ugnayan sa opisina. 📞';
  }
  if (l.includes('hello') || l.includes('hi') || l.includes('kumusta') || l.includes('magandang') || l === 'hey') {
    return 'Kamusta! 😊 Narito ako para sagutin ang iyong mga tanong tungkol sa:\n\n📋 Reklamo\n📄 Mga dokumento\n🏛️ Mga serbisyo\n📞 Contact numbers\n🗺️ Lokasyon ng Santa Maria\n\nAno ang maipaglilingkod ko sa iyo?';
  }
  if (l.includes('salamat') || l.includes('thank')) {
    return 'Walang anuman! 🙏 Lagi kaming handa para tumulong. Kung mayroon pang ibang katanungan, huwag mag-atubiling magtanong. Mabuhay ang Santa Maria! 🇵🇭';
  }
  return 'Pasensya na, hindi ko pa ganap na naiintindihan ang iyong tanong. 😔\n\nNarito ako para sa mga tanong tungkol sa:\n• Pagsasampa ng reklamo\n• Mga dokumento at permit\n• Mga serbisyo ng munisipyo\n• Oras ng opisina at contact\n• Lokasyon ng Santa Maria\n\nSubukan mong i-rephrase ang iyong tanong, o piliin mula sa mga mungkahi sa itaas. 👆';
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

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
          Animated.timing(dot, { toValue: 0,  duration: 280, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
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

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, showAvatar, isLast }: { msg: Message; showAvatar: boolean; isLast: boolean }) {
  const isUser = msg.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 18 : -18)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }, { scale: scaleAnim }] }}
      className={`flex-row items-end px-4 ${isUser ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-3' : 'mb-[3px]'}`}
    >
      {/* Bot avatar slot */}
      {!isUser && (
        <View className="w-8 h-8 shrink-0 mr-2 mb-0.5">
          {showAvatar ? (
            <View className="w-8 h-8 rounded-full bg-gradient-to-br items-center justify-center"
              style={{ backgroundColor: '#2563EB' }}>
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
            {msg.text}
          </Text>
        </View>
        {isLast && (
          <Text className="text-[10px] text-slate-400 mt-1 mx-0.5">
            {formatTime(msg.timestamp)}
          </Text>
        )}
      </View>

      {/* User avatar */}
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

function SuggestionChip({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={{
        borderWidth: 1.5,
        borderColor: '#BFDBFE',
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
      }}
    >
      <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </TouchableOpacity>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────

function DateSeparator() {
  return (
    <View className="flex-row items-center px-8 my-4 gap-3">
      <View className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
      <View
        className="px-3 py-1 rounded-full"
        style={{ backgroundColor: '#F1F5F9' }}
      >
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
      style={{
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
      }}
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

export default function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'bot',
      text: 'Kamusta! Ako si SantaBot 👋\n\nAng iyong FAQ assistant para sa Munisipalidad ng Santa Maria, Laguna.\n\nAno ang maipaglilingkod ko sa iyo?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const listRef   = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const inputRef  = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      setInput('');
      setShowSuggestions(false);

      const userMsg: Message = { id: uid(), role: 'user', text: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
      const reply = getFaqReply(trimmed);
      setIsTyping(false);

      const botMsg: Message = { id: uid(), role: 'bot', text: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    },
    [isTyping]
  );

  // The keyboard offset must include the status bar on Android
  // so the KAV knows how much space to push up
  const kavOffset = Platform.OS === 'android' ? STATUS_BAR_HEIGHT : insets.top;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={onClose}
    >
      {/*
        KEYBOARD LAYOUT STRATEGY:
        ┌─────────────────────────┐  ← paddingTop: insets.top (status bar safe)
        │        HEADER           │
        ├─────────────────────────┤
        │                         │
        │     MESSAGES (flex:1)   │  ← scrollable, fills remaining space
        │                         │
        ├─────────────────────────┤
        │    SUGGESTIONS (opt)    │
        ├─────────────────────────┤
        │      INPUT BAR          │  ← fixed at bottom, INSIDE the KAV
        └─────────────────────────┘  ← paddingBottom: insets.bottom (home bar safe)

        KeyboardAvoidingView wraps everything from header down.
        behavior="padding" on both platforms adds padding at the bottom equal
        to the keyboard height, which pushes the input bar up perfectly.
        keyboardVerticalOffset = status bar height so the calculation is correct.
      */}
      <View
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      >
        {/* Animate the entire screen content sliding up */}
        <Animated.View
          style={{ flex: 1, transform: [{ translateY: slideAnim }] }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
            keyboardVerticalOffset={kavOffset}
          >

            {/* ── Header (inside KAV so it moves with keyboard — keeps layout stable) ── */}
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  gap: 8,
                }}
              >
                {/* Back */}
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowLeft size={22} color="#1E293B" />
                </TouchableOpacity>

                {/* Avatar */}
                <View style={{ position: 'relative', marginRight: 4 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: '#2563EB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bot size={20} color="white" />
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 1,
                      right: 1,
                      width: 11,
                      height: 11,
                      borderRadius: 6,
                      backgroundColor: '#22C55E',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}
                  />
                </View>

                {/* Name & subtitle */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                      SantaBot
                    </Text>
                    <Sparkles size={12} color="#3B82F6" />
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 }}>
                    FAQ · Santa Maria, Laguna
                  </Text>
                </View>

                {/* Help */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <HelpCircle size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Messages list ── */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
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
                  />
                );
              }}
              ListFooterComponent={
                isTyping ? (
                  <Animated.View
                    style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 4, marginBottom: 4 }}
                  >
                    <View
                      style={{
                        width: 32, height: 32,
                        borderRadius: 16,
                        backgroundColor: '#2563EB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                        marginBottom: 2,
                      }}
                    >
                      <Bot size={14} color="white" />
                    </View>
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        borderBottomLeftRadius: 5,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                        shadowColor: '#94a3b8',
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      <TypingDots />
                    </View>
                  </Animated.View>
                ) : null
              }
            />

            {/* ── Suggestion chips ── */}
            {showSuggestions && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                  paddingTop: 12,
                  paddingBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    fontWeight: '700',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    paddingHorizontal: 16,
                    marginBottom: 8,
                  }}
                >
                  Mga Madalas na Tanong
                </Text>
                <FlatList
                  data={SUGGESTIONS}
                  keyExtractor={(s) => s}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  renderItem={({ item }) => (
                    <SuggestionChip text={item} onPress={() => sendMessage(item)} />
                  )}
                />
              </View>
            )}

            {/* ── Input bar ── */}
            {/*
              This is INSIDE KeyboardAvoidingView and BELOW the FlatList.
              When keyboard appears, KAV adds padding equal to keyboard height,
              which pushes this bar up by exactly that amount — always fully visible.
            */}
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
              {/* Text input pill */}
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
                  borderColor: '#E2E8F0',
                }}
              >
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Magtanong tungkol sa Santa Maria..."
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

              {/* Send button */}
              <TouchableOpacity
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                activeOpacity={0.8}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: input.trim() && !isTyping ? '#2563EB' : '#E2E8F0',
                  shadowColor: input.trim() && !isTyping ? '#1d4ed8' : 'transparent',
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: input.trim() && !isTyping ? 4 : 0,
                }}
              >
                <Send
                  size={18}
                  color={input.trim() && !isTyping ? '#FFFFFF' : '#94A3B8'}
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}