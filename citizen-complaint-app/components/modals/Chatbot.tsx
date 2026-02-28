
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bot, ChevronDown, Send, Sparkles, User } from 'lucide-react-native';

type Role = 'user' | 'bot';

interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

// ─── Quick suggestion chips ───────────────────────────────────────────────────

const SUGGESTIONS = [
  'Paano mag-file ng reklamo?',
  'Ano ang status ng aking reklamo?',
  'Sino ang makakausap sa barangay?',
  'Magkano ang bayad sa serbisyo?',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}



function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -6, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(400),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View className="flex-row items-center gap-1 px-1 py-0.5">
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400"
          style={{ transform: [{ translateY: dot }] }}
        />
      ))}
    </View>
  );
}



function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
      className={`flex-row items-end gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mb-0.5 shrink-0">
          <Bot size={16} color="white" />
        </View>
      )}

      <View className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <View
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 rounded-br-sm'
              : 'bg-white border border-slate-100 rounded-bl-sm'
          }`}
        >
          <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-gray-800'}`}>
            {msg.text}
          </Text>
        </View>
        <Text className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.timestamp)}</Text>
      </View>

      {/* User avatar */}
      {isUser && (
        <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center mb-0.5 shrink-0">
          <User size={16} color="#64748B" />
        </View>
      )}
    </Animated.View>
  );
}



function SuggestionChip({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white border border-blue-200 rounded-full px-3.5 py-2 mr-2"
    >
      <Text className="text-blue-600 text-xs font-semibold">{text}</Text>
    </TouchableOpacity>
  );
}


interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'bot',
      text: 'Magandang araw! Ako si BrgyBot, ang iyong virtual na katulong. Paano kita matutulungan ngayon? 😊',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const listRef  = useRef<FlatList>(null);

  const sheetAnim = useRef(new Animated.Value(600)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetAnim, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetAnim, {
          toValue: 600,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const mockBotReply = async (userText: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const lower = userText.toLowerCase();
    if (lower.includes('reklamo') && lower.includes('file'))
      return 'Para mag-file ng reklamo, pumunta sa tab na "Mga Reklamo" sa ibaba ng screen, pagkatapos ay pindutin ang "Magsumite ng Reklamo". Siguraduhing kumpleto ang lahat ng kinakailangang impormasyon. 📋';
    if (lower.includes('status'))
      return 'Maaari mong tingnan ang status ng iyong reklamo sa "Mga Reklamo" tab. Makikita mo doon ang lahat ng iyong mga isinumiteng reklamo at ang kanilang kasalukuyang katayuan. 🔍';
    if (lower.includes('bayad') || lower.includes('magkano'))
      return 'Ang mga serbisyo ng barangay ay libre para sa lahat ng residente. Para sa mga espesyal na dokumento, maaaring may maliit na bayad. Makipag-ugnayan sa barangay hall para sa detalye. 💬';
    if (lower.includes('sino') || lower.includes('makakausap'))
      return 'Maaari kang makipag-ugnayan sa aming barangay hall sa oras ng opisina (8AM–5PM, Lunes–Biyernes). Maaari ka ring tumawag sa hotline na makikita sa "Hotlines" section ng app. 📞';
    return 'Salamat sa iyong katanungan! Para sa mas detalyadong tulong, maaari kang direktang makipag-ugnayan sa aming barangay hall o pumunta sa "Mga Serbisyo" para sa karagdagang impormasyon. 🙏';
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg: Message = { id: uid(), role: 'user', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    setIsTyping(true);
    const reply = await mockBotReply(trimmed);
    setIsTyping(false);

    const botMsg: Message = { id: uid(), role: 'bot', text: reply, timestamp: new Date() };
    setMessages((prev) => [...prev, botMsg]);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
   
        <Pressable onPress={onClose} className="flex-1">
          <Animated.View
            className="flex-1 bg-black"
            style={{ opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }) }}
          />
        </Pressable>

  
        <Animated.View
          style={{ transform: [{ translateY: sheetAnim }] }}
          className="bg-slate-50 rounded-t-3xl overflow-hidden"
       
        >

       
          <View className="bg-blue-600 px-5 pt-5 pb-5">
       
            <View className="w-10 h-1 rounded-full bg-white/30 self-center mb-4" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                {/* Avatar */}
                <View className="w-11 h-11 rounded-full bg-white/20 border border-white/30 items-center justify-center">
                  <Bot size={22} color="white" />
                </View>
                <View>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-white text-base font-bold">BrgyBot</Text>
                    <Sparkles size={12} color="#93c5fd" />
                  </View>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <View className="w-2 h-2 rounded-full bg-green-400" />
                    <Text className="text-blue-100 text-xs">Online — laging handang tumulong</Text>
                  </View>
                </View>
              </View>

              {/* Close */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="w-9 h-9 rounded-full bg-white/15 border border-white/25 items-center justify-center"
              >
                <ChevronDown size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Messages ── */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
            style={{ maxHeight: 380 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            ListFooterComponent={
              isTyping ? (
                <View className="flex-row items-end gap-2 mb-3">
                  <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mb-0.5">
                    <Bot size={16} color="white" />
                  </View>
                  <View className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <TypingDots />
                  </View>
                </View>
              ) : null
            }
          />

          {/* ── Suggestion chips ── */}
          {showSuggestions && (
            <View className="px-4 pb-3">
              <Text className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">
                Mabilis na Tanong
              </Text>
              <FlatList
                data={SUGGESTIONS}
                keyExtractor={(s) => s}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <SuggestionChip text={item} onPress={() => sendMessage(item)} />
                )}
              />
            </View>
          )}

          {/* ── Input bar ── */}
          <View className="bg-white border-t border-slate-100 px-4 py-3 flex-row items-end gap-3">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Mag-type ng mensahe..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-900"
              style={{ maxHeight: 100 }}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.8}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                input.trim() && !isTyping ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <Send size={18} color={input.trim() && !isTyping ? 'white' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Safe area spacer */}
          <View className="bg-white h-5" />

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}