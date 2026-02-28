import GeneralToast from '@/components/Toast/GeneralToast';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { requestNotificationPermissionForComplaints } from '@/utils/general/requestNotificationPermission';
import {
  X,
  Upload,
  FileText,
  Video,
  Image as ImageIcon,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  Check,
  PenLine,
  Info,
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react-native';
import { useAttachments, Attachment } from '@/hooks/general/useAttachment';
import { useTranslation } from 'react-i18next';
import { PRESET_TITLE_KEYS, OTHER_KEY, PresetTitle } from '@/constants/localization/complaint-title-key';
import ComplaintLetterPreview from '@/components/letter-preview/ComplaintLetterPreview';
import { complaintApiClient } from '@/lib/client/complaint';
import { saveTokenToBackend } from '@/hooks/general/usePushNotifications';
import { useCurrentUser } from '@/store/useCurrentUserStore';

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Instructions reminder screen
// Step 2: The actual complaint form
// ─────────────────────────────────────────────────────────────────────────────
function InstructionsStep({
  barangayName,
  onProceed,
  onBack,
  t,
}: {
  barangayName: string;
  onProceed: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const instructions = [
    {
      num: '1',
      title: t('complaint_form.instruction_1_title'),
      body: t('complaint_form.instruction_1_body'),
    },
    {
      num: '2',
      title: t('complaint_form.instruction_2_title'),
      body: t('complaint_form.instruction_2_body'),
    },
    {
      num: '3',
      title: t('complaint_form.instruction_3_title'),
      body: t('complaint_form.instruction_3_body'),
    },
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Step indicator */}
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-600 rounded-full w-7 h-7 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            <View className="h-0.5 flex-1 bg-blue-200 mx-1" />
            <View className="bg-gray-200 rounded-full w-7 h-7 items-center justify-center ml-2">
              <Text className="text-gray-400 text-xs font-bold">2</Text>
            </View>
          </View>

          {/* Hero card */}
          <View className="bg-blue-700 rounded-2xl px-5 py-6 mb-5 overflow-hidden">
            <View className="flex-row items-center mb-3">
              <View className="bg-white/20 p-2.5 rounded-xl mr-3">
                <ClipboardList size={22} color="white" />
              </View>
              <Text className="text-white text-xl font-bold flex-1">
                {t('complaint_form.instructions_title')}
              </Text>
            </View>
            <Text className="text-blue-100 text-sm leading-6">
              {t('complaint_form.instructions_disclaimer')}
            </Text>
          </View>

          {/* Instruction cards */}
          {instructions.map((item, index) => (
            <View
              key={item.num}
              className="bg-white border border-gray-100 rounded-2xl px-5 py-5 mb-3 shadow-sm"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}
            >
              <View className="flex-row items-start">
                <View className="bg-blue-600 rounded-xl w-8 h-8 items-center justify-center mr-4 mt-0.5 shrink-0">
                  <Text className="text-white text-sm font-bold">{item.num}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-1.5 uppercase tracking-wide">
                    {item.title}
                  </Text>
                  <Text className="text-sm text-gray-600 leading-6">{item.body}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Warning card */}
          <View
            className="border border-red-200 rounded-2xl overflow-hidden mb-5"
            style={{ shadowColor: '#dc2626', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 }}
          >
            <View className="bg-red-600 px-5 py-3.5 flex-row items-center">
              <ShieldAlert size={18} color="white" />
              <Text className="text-white font-bold text-base ml-2.5 tracking-wide uppercase">
                {t('complaint_form.instruction_4_title')}
              </Text>
            </View>
            <View className="bg-red-50 px-5 py-4 flex-row items-start">
              <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
              <Text className="text-sm text-red-800 leading-6 flex-1 ml-3">
                {t('complaint_form.instruction_4_body')}
              </Text>
            </View>
          </View>

          {/* Acknowledgement hint */}
          <View className="flex-row items-center bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 mb-2">
            <CheckCircle2 size={16} color="#16A34A" />
            <Text className="text-sm text-green-800 font-medium ml-2.5 flex-1 leading-5">
              By proceeding, you confirm that you have read and understood the above guidelines.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Proceed button */}
      <View className="bg-white border-t border-gray-100 px-5 py-4">
        <TouchableOpacity
          onPress={onProceed}
          className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center active:bg-blue-700"
          style={{ shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}
        >
          <Text className="text-white font-bold text-base mr-2">
            I Understand — Proceed to Form
          </Text>
          <ArrowRight size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Form Step ─────────────────────────────────────────────────────────────────
export default function ComplaintFormScreen() {
  const { t } = useTranslation();
  const { userData } = useCurrentUser();
  const userId = userData?.id;
  const router = useRouter();
  const params = useLocalSearchParams();
  const barangayName = (params.barangayName as string) || 'Barangay';
  const barangayId = params.id as string;

  // Two-step state
  const [step, setStep] = useState<'instructions' | 'form'>('instructions');

  const [selectedPreset, setSelectedPreset] = useState<PresetTitle | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const {
    attachments,
    isPickingFile,
    showAttachmentModal,
    setShowAttachmentModal,
    handlePickImage,
    handlePickVideo,
    handlePickDocument,
    handleRemoveAttachment,
    formatFileSize,
    resetAttachments,
    showToast,
    setToastVisible,
    toastVisible,
    toastMessage,
    toastType,
  } = useAttachments();

  const selectedTitleKey = selectedPreset?.key ?? '';
  const isOtherSelected = selectedTitleKey === OTHER_KEY;
  const resolvedTitle = isOtherSelected
    ? customTitle.trim()
    : selectedTitleKey
    ? t(selectedTitleKey)
    : '';
  const resolvedCategoryId = selectedPreset?.category_id ?? null;

  // ── Show instructions step ──
  if (step === 'instructions') {
    return (
      <InstructionsStep
        barangayName={barangayName}
        onProceed={() => setStep('form')}
        onBack={() => router.back()}
        t={t}
      />
    );
  }

  const validateFields = (): boolean => {
    let valid = true;
    if (!resolvedTitle) {
      setTitleError(t('complaint_form.error.title_required'));
      valid = false;
    } else if (isOtherSelected && customTitle.trim().length < 3) {
      setTitleError(t('complaint_form.error.title_too_short'));
      valid = false;
    } else {
      setTitleError('');
    }
    if (!message.trim()) {
      setMessageError(t('complaint_form.error.details_required'));
      valid = false;
    } else {
      setMessageError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const complaintData = {
        title: resolvedTitle,
        description: message,
        barangay_id: barangayId,
        location_details: null,
        category_id: resolvedCategoryId,
        sector_id: null,
        priority_level_id: null,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(complaintData));

      if (attachments.length > 0) {
        for (const attachment of attachments) {
          formData.append('attachments', {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.mimeType || 'application/octet-stream',
          } as any);
        }
      }

      const response = await complaintApiClient.post('/submit-complaint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        showToast('Complaint submitted successfully!', 'success');
        resetAttachments();
        setSelectedPreset(null);
        setCustomTitle('');
        setMessage('');

        try {
          const result = await requestNotificationPermissionForComplaints();
          if (result.granted && result.token && userId) {
            await saveTokenToBackend(userId, result.token);
          }
        } catch (notifError) {
          console.warn('Notification setup failed:', notifError);
        }
      }
    } catch (error: any) {
      showToast('Something Went Wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
      setShowPreview(false);
    }
  };

  const handleSelectPreset = (preset: PresetTitle) => {
    setSelectedPreset(preset);
    setTitleError('');
    if (preset.key !== OTHER_KEY) setCustomTitle('');
    setShowTitlePicker(false);
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={20} color="#3B82F6" />;
      case 'video': return <Video size={20} color="#3B82F6" />;
      default:      return <FileText size={20} color="#3B82F6" />;
    }
  };

  const renderAttachment = (attachment: Attachment) => (
    <View key={attachment.id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-2.5 flex-row items-center">
      <View className="bg-blue-50 p-2.5 rounded-xl mr-3">
        {getAttachmentIcon(attachment.type)}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {attachment.name}
        </Text>
        {attachment.size && (
          <Text className="text-xs text-gray-500 mt-0.5">{formatFileSize(attachment.size)}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveAttachment(attachment.id)}
        className="p-2 bg-red-50 rounded-xl ml-2"
      >
        <X size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (showPreview) {
    return (
      <ComplaintLetterPreview
        barangayName={barangayName}
        title={resolvedTitle}
        message={message}
        attachments={attachments}
        onConfirmSubmit={handleSubmit}
        onBack={() => setShowPreview(false)}
        isSubmitting={isSubmitting}
        toastVisible={toastVisible}
        setToastVisible={setToastVisible}
        toastMessage={toastMessage}
        toastType={toastType}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

      {/* ── Header ── */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => setStep('instructions')}
          className="mr-3 p-2 -ml-2"
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{t('complaint_form.screen_title')}</Text>
          <Text className="text-sm text-blue-600 mt-0.5">{barangayName}</Text>
        </View>

        {/* Step indicator pill */}
        <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
          <View className="w-2 h-2 rounded-full bg-gray-300 mr-1" />
          <View className="w-2 h-2 rounded-full bg-blue-600" />
          <Text className="text-xs font-semibold text-blue-600 ml-1.5">Step 2</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Complaint Title ── */}
        <View className="mb-5">
          <Text className="text-base font-bold text-gray-800 mb-2">
            {t('complaint_form.title_label')} <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-sm text-gray-500 mb-3 leading-5">
            Select the category that best describes your complaint.
          </Text>

          <TouchableOpacity
            onPress={() => setShowTitlePicker(true)}
            className={`flex-row items-center justify-between bg-white border-2 rounded-2xl px-4 py-4 ${
              titleError ? 'border-red-400' : 'border-gray-200'
            }`}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
          >
            <Text numberOfLines={1} className={`flex-1 text-base ${selectedPreset ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {selectedPreset ? t(selectedPreset.key) : t('complaint_form.title_placeholder')}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {isOtherSelected && (
            <View className="mt-3">
              <View className={`flex-row items-center bg-white border-2 rounded-2xl px-4 py-3.5 ${titleError ? 'border-red-400' : 'border-blue-400'}`}>
                <PenLine size={18} color="#3B82F6" />
                <TextInput
                  value={customTitle}
                  onChangeText={(text) => {
                    setCustomTitle(text);
                    if (text.trim().length >= 3) setTitleError('');
                  }}
                  placeholder={t('complaint_form.custom_title_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                  autoFocus
                  className="flex-1 text-base text-gray-900 ml-3"
                />
                <Text className="text-xs text-gray-400 ml-2">{customTitle.length}/100</Text>
              </View>
              <Text className="text-sm text-blue-500 mt-1.5 ml-1">{t('complaint_form.custom_title_hint')}</Text>
            </View>
          )}

          {titleError ? (
            <View className="flex-row items-center gap-1.5 mt-2">
              <AlertCircle size={14} color="#EF4444" />
              <Text className="text-sm text-red-500">{titleError}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Divider ── */}
        <View className="h-px bg-gray-100 mb-5" />

        {/* ── Complaint Details ── */}
        <View className="mb-5">
          <Text className="text-base font-bold text-gray-800 mb-2">
            {t('complaint_form.details_label')} <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-sm text-gray-500 mb-3 leading-5">
            Describe your complaint clearly and with as much detail as possible.
          </Text>
          <TextInput
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (text.trim()) setMessageError('');
            }}
            placeholder={t('complaint_form.details_placeholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            maxLength={1000}
            className={`bg-white border-2 rounded-2xl px-4 py-4 text-base text-gray-900 min-h-[180px] ${
              messageError ? 'border-red-400' : 'border-gray-200'
            }`}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
          />
          <View className="flex-row items-center justify-between mt-2">
            {messageError ? (
              <View className="flex-row items-center gap-1.5">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-sm text-red-500">{messageError}</Text>
              </View>
            ) : (
              <View />
            )}
            <Text className="text-xs text-gray-400">{message.length}/1000</Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View className="h-px bg-gray-100 mb-5" />

        {/* ── Attachments ── */}
        <View className="mb-6">
          <Text className="text-base font-bold text-gray-800 mb-1">{t('complaint_form.attachments_label')}</Text>
          <Text className="text-sm text-gray-500 mb-4 leading-5">{t('complaint_form.attachments_hint')}</Text>

          {attachments.map((attachment) => renderAttachment(attachment))}

          {attachments.length < 3 && (
            <TouchableOpacity
              onPress={() => setShowAttachmentModal(true)}
              className="bg-white border-2 border-dashed border-blue-300 rounded-2xl py-7 items-center justify-center active:bg-blue-50"
            >
              <View className="bg-blue-50 p-3.5 rounded-2xl mb-3">
                <Upload size={26} color="#3B82F6" />
              </View>
              <Text className="text-blue-600 font-bold text-base">{t('complaint_form.add_attachment')}</Text>
              <Text className="text-gray-400 text-sm mt-1">
                {t('complaint_form.attachments_count', { count: attachments.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info Box ── */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex-row items-start">
          <Info size={18} color="#1D4ED8" style={{ marginTop: 1, flexShrink: 0 }} />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-bold text-blue-900 mb-1">{t('complaint_form.note_title')}</Text>
            <Text className="text-sm text-blue-800 leading-6">{t('complaint_form.note_body')}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Review & Submit Button ── */}
      <View className="bg-white border-t border-gray-100 px-5 py-4">
        <TouchableOpacity
          onPress={() => {
            if (!validateFields()) return;
            setShowPreview(true);
          }}
          className="py-4 rounded-2xl items-center justify-center bg-blue-600 active:bg-blue-700"
          style={{ shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}
        >
          <Text className="text-white font-bold text-base">
            {t('complaint_form.submit')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Preset Title Picker Modal ── */}
      <Modal
        visible={showTitlePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTitlePicker(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowTitlePicker(false)}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>

            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">{t('complaint_form.picker_title')}</Text>
                <TouchableOpacity onPress={() => setShowTitlePicker(false)} className="p-2 -mr-2">
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500 mt-1">{t('complaint_form.picker_subtitle')}</Text>
            </View>

            <FlatList
              data={PRESET_TITLE_KEYS}
              keyExtractor={(item) => item.key}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedPreset?.key === item.key;
                const isOther = item.key === OTHER_KEY;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelectPreset(item)}
                    className={`flex-row items-center py-4 px-4 mb-1.5 rounded-2xl border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400'
                        : isOther
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    {isOther && <PenLine size={16} color="#6B7280" className="mr-2" />}
                    <Text
                      className={`flex-1 text-base ${
                        isSelected
                          ? 'font-bold text-blue-700'
                          : isOther
                          ? 'italic text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {t(item.key)}
                    </Text>
                    {isSelected && <Check size={20} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              }}
            />

            <View className="px-4 pt-2 pb-6">
              <TouchableOpacity
                onPress={() => setShowTitlePicker(false)}
                className="bg-gray-100 py-4 rounded-2xl active:bg-gray-200"
              >
                <Text className="text-center text-gray-700 font-bold text-base">{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Attachment Type Modal ── */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowAttachmentModal(false)}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>

            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">{t('complaint_form.add_attachment')}</Text>
                <TouchableOpacity onPress={() => setShowAttachmentModal(false)} className="p-2 -mr-2">
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                {t('complaint_form.attachment_remaining', { count: 3 - attachments.length })}
              </Text>
            </View>

            <View className="px-4 py-4">
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-blue-50 rounded-2xl mb-3 ${isPickingFile ? 'opacity-50' : 'active:bg-blue-100'}`}
              >
                <View className="bg-blue-600 p-3 rounded-2xl mr-4">
                  <ImageIcon size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-0.5">{t('complaint_form.attachment_photo')}</Text>
                  <Text className="text-sm text-gray-500">{t('complaint_form.attachment_photo_hint')}</Text>
                </View>
                <View className="bg-blue-600 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-xs font-bold">JPG, PNG</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickVideo}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-purple-50 rounded-2xl mb-3 ${isPickingFile ? 'opacity-50' : 'active:bg-purple-100'}`}
              >
                <View className="bg-purple-600 p-3 rounded-2xl mr-4">
                  <Video size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-0.5">{t('complaint_form.attachment_video')}</Text>
                  <Text className="text-sm text-gray-500">{t('complaint_form.attachment_video_hint')}</Text>
                </View>
                <View className="bg-purple-600 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-xs font-bold">MP4, MOV</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickDocument}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-green-50 rounded-2xl mb-3 ${isPickingFile ? 'opacity-50' : 'active:bg-green-100'}`}
              >
                <View className="bg-green-600 p-3 rounded-2xl mr-4">
                  <FileText size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-0.5">{t('complaint_form.attachment_document')}</Text>
                  <Text className="text-sm text-gray-500">{t('complaint_form.attachment_document_hint')}</Text>
                </View>
                <View className="bg-green-600 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-xs font-bold">ANY</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => setShowAttachmentModal(false)}
                className="bg-gray-100 py-4 rounded-2xl active:bg-gray-200"
              >
                <Text className="text-center text-gray-700 font-bold text-base">{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

      <GeneralToast
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        message={toastMessage}
        type={toastType}
      />
    </SafeAreaView>
  );
}