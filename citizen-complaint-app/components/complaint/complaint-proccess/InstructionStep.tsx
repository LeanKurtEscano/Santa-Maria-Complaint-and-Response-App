import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ClipboardList, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface InstructionsStepProps {
  barangayName: string;
  onProceed: () => void;
  onBack: () => void;
}

export function InstructionsStep({ barangayName, onProceed, onBack }: InstructionsStepProps) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const instructions = [
    { num: '1', title: t('complaint_form.instruction_1_title'), body: t('complaint_form.instruction_1_body') },
    { num: '2', title: t('complaint_form.instruction_2_title'), body: t('complaint_form.instruction_2_body') },
    { num: '3', title: t('complaint_form.instruction_3_title'), body: t('complaint_form.instruction_3_body') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-3 p-2 -ml-2">
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{t('complaint_form.screen_title')}</Text>
          <Text className="text-sm text-blue-600 mt-0.5">{barangayName}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Step progress */}
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-600 rounded-full w-7 h-7 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            <View className="h-0.5 flex-1 bg-blue-200 mx-1" />
            <View className="bg-gray-200 rounded-full w-7 h-7 items-center justify-center mx-1">
              <Text className="text-gray-400 text-xs font-bold">2</Text>
            </View>
            <View className="h-0.5 flex-1 bg-gray-200 mx-1" />
            <View className="bg-gray-200 rounded-full w-7 h-7 items-center justify-center ml-2">
              <Text className="text-gray-400 text-xs font-bold">3</Text>
            </View>
          </View>

          {/* Hero card */}
          <View className="bg-blue-700 rounded-2xl px-5 py-6 mb-5 overflow-hidden">
            <View className="flex-row items-center mb-3">
              <View className="bg-white/20 p-2.5 rounded-xl mr-3">
                <ClipboardList size={22} color="white" />
              </View>
              <Text className="text-white text-xl font-bold flex-1">{t('complaint_form.instructions_title')}</Text>
            </View>
            <Text className="text-blue-100 text-sm leading-6">{t('complaint_form.instructions_disclaimer')}</Text>
          </View>

          {/* Instruction cards */}
          {instructions.map((item) => (
            <View key={item.num} className="bg-white border border-gray-100 rounded-2xl px-5 py-5 mb-3 shadow-sm" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
              <View className="flex-row items-start">
                <View className="bg-blue-600 rounded-xl w-8 h-8 items-center justify-center mr-4 mt-0.5 shrink-0">
                  <Text className="text-white text-sm font-bold">{item.num}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-1.5 uppercase tracking-wide">{item.title}</Text>
                  <Text className="text-sm text-gray-600 leading-6">{item.body}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Warning card */}
          <View className="border border-red-200 rounded-2xl overflow-hidden mb-5" style={{ shadowColor: '#dc2626', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 }}>
            <View className="bg-red-600 px-5 py-3.5 flex-row items-center">
              <ShieldAlert size={18} color="white" />
              <Text className="text-white font-bold text-base ml-2.5 tracking-wide uppercase">{t('complaint_form.instruction_4_title')}</Text>
            </View>
            <View className="bg-red-50 px-5 py-4 flex-row items-start">
              <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
              <Text className="text-sm text-red-800 leading-6 flex-1 ml-3">{t('complaint_form.instruction_4_body')}</Text>
            </View>
          </View>

          {/* Agreement */}
          <View className="flex-row items-center bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 mb-2">
            <CheckCircle2 size={16} color="#16A34A" />
            <Text className="text-sm text-green-800 font-medium ml-2.5 flex-1 leading-5">{t('complaint_form.agreement')}</Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View className="bg-white border-t border-gray-100 px-5 py-4">
        <TouchableOpacity
          onPress={onProceed}
          className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center active:bg-blue-700"
          style={{ shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}
        >
          <Text className="text-white font-bold text-base mr-2">{t('complaint_form.proceed_to_form')}</Text>
          <ArrowRight size={18} color="white" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}