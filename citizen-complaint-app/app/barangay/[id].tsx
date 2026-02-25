import GeneralToast from '@/components/Toast/GeneralToast';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
} from 'lucide-react-native';
import { useAttachments, Attachment } from '@/hooks/general/useAttachment';
import { useTranslation } from 'react-i18next';
import { PRESET_TITLE_KEYS, OTHER_KEY, PresetTitle } from '@/constants/localization/complaint-title-key';
import ComplaintLetterPreview from '@/components/letter-preview/ComplaintLetterPreview';
import { complaintApiClient } from '@/lib/client/complaint';

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace PRESET_TITLE_KEYS with a dynamic fetch when ready.
//
// import { useQuery } from '@tanstack/react-query';
// import { complaintApiClient } from '@/lib/client/complaint';
//
// interface Category { id: number; category_name: string; }
//
// const { data: categories = [] } = useQuery<Category[]>({
//   queryKey: ['complaint-categories'],
//   queryFn: async () => {
//     const res = await complaintApiClient.get('/categories');
//     return res.data;
//   },
// });
//
// Then map categories → PresetTitle[] like so:
// const dynamicPresets: PresetTitle[] = categories.map((cat) => ({
//   key: `complaint.preset.${cat.category_name}`,   // must match your i18n keys
//   category_id: cat.id,
// }));
//
// And replace `PRESET_TITLE_KEYS` in the FlatList with `dynamicPresets`.
// ─────────────────────────────────────────────────────────────────────────────

export default function ComplaintFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const barangayName = (params.barangayName as string) || 'Barangay';
  const barangayId = params.id as string;

  // Selected preset now holds the full { key, category_id } object
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

  // Derived values from selectedPreset
  const selectedTitleKey = selectedPreset?.key ?? '';
  const isOtherSelected = selectedTitleKey === OTHER_KEY;
  const resolvedTitle = isOtherSelected
    ? customTitle.trim()
    : selectedTitleKey
    ? t(selectedTitleKey)
    : '';
  const resolvedCategoryId = selectedPreset?.category_id ?? null;

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
            setShowPreview(false);
          router.back();


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
    <View key={attachment.id} className="bg-white border border-gray-200 rounded-xl p-3 mb-2 flex-row items-center">
      <View className="bg-blue-50 p-2 rounded-lg mr-3">
        {getAttachmentIcon(attachment.type)}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
          {attachment.name}
        </Text>
        {attachment.size && (
          <Text className="text-xs text-gray-500">{formatFileSize(attachment.size)}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => handleRemoveAttachment(attachment.id)} className="p-2 bg-red-50 rounded-lg ml-2">
        <X size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  // ── Show letter preview before final submit ──
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
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 -ml-2">
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{t('complaint_form.screen_title')}</Text>
          <Text className="text-sm text-blue-600">{barangayName}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>

        {/* ── Filing Instructions ── */}
        <View className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">

          {/* Header bar */}
          <View className="bg-blue-700 px-4 py-3 flex-row items-center gap-2">
            <ClipboardList size={16} color="white" />
            <Text className="text-white font-bold text-sm tracking-wide uppercase">
              {t('complaint_form.instructions_title')}
            </Text>
          </View>

          {/* Instructions body */}
          <View className="px-4 py-4 gap-3">

            {/* Instruction 1 */}
            <View className="flex-row items-start gap-3">
              <View className="bg-blue-700 rounded-full w-5 h-5 items-center justify-center mt-0.5 shrink-0">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-0.5">
                  {t('complaint_form.instruction_1_title')}
                </Text>
                <Text className="text-xs text-gray-600 leading-4">
                  {t('complaint_form.instruction_1_body')}
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            {/* Instruction 2 */}
            <View className="flex-row items-start gap-3">
              <View className="bg-blue-700 rounded-full w-5 h-5 items-center justify-center mt-0.5 shrink-0">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-0.5">
                  {t('complaint_form.instruction_2_title')}
                </Text>
                <Text className="text-xs text-gray-600 leading-4">
                  {t('complaint_form.instruction_2_body')}
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            {/* Instruction 3 */}
            <View className="flex-row items-start gap-3">
              <View className="bg-blue-700 rounded-full w-5 h-5 items-center justify-center mt-0.5 shrink-0">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-0.5">
                  {t('complaint_form.instruction_3_title')}
                </Text>
                <Text className="text-xs text-gray-600 leading-4">
                  {t('complaint_form.instruction_3_body')}
                </Text>
              </View>
            </View>

          </View>

          {/* ── Warning Block (Instruction 4) ── */}
          <View className="mx-4 mb-4 border border-red-300 rounded-xl overflow-hidden">
            {/* Warning header */}
            <View className="bg-red-600 px-3 py-2 flex-row items-center gap-2">
              <ShieldAlert size={14} color="white" />
              <Text className="text-white font-bold text-xs tracking-widest uppercase flex-1">
                {t('complaint_form.instruction_4_title')}
              </Text>
            </View>
            {/* Warning body */}
            <View className="bg-red-50 px-3 py-3 flex-row items-start gap-2">
              <AlertCircle size={14} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
              <Text className="text-xs text-red-800 leading-[18px] flex-1">
                {t('complaint_form.instruction_4_body')}
              </Text>
            </View>
          </View>

          {/* Footer disclaimer */}
          <View className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex-row items-center gap-2">
            <Info size={13} color="#6B7280" />
            <Text className="text-xs text-gray-500 flex-1 leading-4">
              {t('complaint_form.instructions_disclaimer')}
            </Text>
          </View>

        </View>

        {/* ── Complaint Title ── */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {t('complaint_form.title_label')} <Text className="text-red-500">*</Text>
          </Text>

          {/* Dropdown trigger */}
          <TouchableOpacity
            onPress={() => setShowTitlePicker(true)}
            className={`flex-row items-center justify-between bg-white border rounded-xl px-4 py-[13px] ${
              titleError ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <Text numberOfLines={1} className={`flex-1 text-sm ${selectedPreset ? 'text-gray-900' : 'text-gray-400'}`}>
              {selectedPreset ? t(selectedPreset.key) : t('complaint_form.title_placeholder')}
            </Text>
            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>

          {/* Custom input for "Other" */}
          {isOtherSelected && (
            <View className="mt-2">
              <View className={`flex-row items-center bg-white border rounded-xl px-3 py-[10px] ${titleError ? 'border-red-500' : 'border-blue-500'}`}>
                <PenLine size={16} color="#3B82F6" className="mr-2" />
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
                  className="flex-1 text-sm text-gray-900"
                />
                <Text className="text-xs text-gray-400 ml-2">{customTitle.length}/100</Text>
              </View>
              <Text className="text-xs text-blue-500 mt-1 ml-1">{t('complaint_form.custom_title_hint')}</Text>
            </View>
          )}

          {/* Title error */}
          {titleError ? (
            <View className="flex-row items-center gap-1 mt-1">
              <AlertCircle size={13} color="#EF4444" />
              <Text className="text-xs text-red-500">{titleError}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Complaint Details ── */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {t('complaint_form.details_label')} <Text className="text-red-500">*</Text>
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
            className={`bg-white border rounded-xl px-4 py-3 text-sm text-gray-900 min-h-[160px] ${
              messageError ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          <View className="flex-row items-center justify-between mt-1">
            {messageError ? (
              <View className="flex-row items-center gap-1">
                <AlertCircle size={13} color="#EF4444" />
                <Text className="text-xs text-red-500">{messageError}</Text>
              </View>
            ) : (
              <View />
            )}
            <Text className="text-xs text-gray-500">{message.length}/1000</Text>
          </View>
        </View>

        {/* ── Attachments ── */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">{t('complaint_form.attachments_label')}</Text>
          <Text className="text-xs text-gray-500 mb-3">{t('complaint_form.attachments_hint')}</Text>

          {attachments.map((attachment) => renderAttachment(attachment))}

          {attachments.length < 3 && (
            <TouchableOpacity
              onPress={() => setShowAttachmentModal(true)}
              className="bg-white border-2 border-dashed border-blue-300 rounded-xl py-6 items-center justify-center"
            >
              <View className="bg-blue-50 p-3 rounded-full mb-2">
                <Upload size={24} color="#3B82F6" />
              </View>
              <Text className="text-blue-600 font-semibold text-sm">{t('complaint_form.add_attachment')}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {t('complaint_form.attachments_count', { count: attachments.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info Box ── */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-sm text-blue-900 font-semibold mb-1">{t('complaint_form.note_title')}</Text>
          <Text className="text-xs text-blue-800 leading-5">{t('complaint_form.note_body')}</Text>
        </View>

      </ScrollView>

      {/* ── Review & Submit Button ── */}
      <View className="bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={() => {
            if (!validateFields()) return;
            setShowPreview(true);
          }}
          className="py-4 rounded-xl items-center justify-center bg-blue-600 active:bg-blue-700"
        >
          <Text className="text-white font-semibold text-base">
            {t('complaint_form.submit')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Preset Title Picker Modal ── */}
      <Modal visible={showTitlePicker} transparent animationType="slide" onRequestClose={() => setShowTitlePicker(false)}>
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
                    className={`flex-row items-center py-[13px] px-3 mb-1 rounded-xl border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : isOther
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    {isOther && <PenLine size={14} color="#6B7280" className="mr-2" />}
                    <Text
                      className={`flex-1 text-sm ${
                        isSelected
                          ? 'font-semibold text-blue-700'
                          : isOther
                          ? 'italic text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {t(item.key)}
                    </Text>
                    {isSelected && <Check size={18} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              }}
            />

            <View className="px-4 pt-2 pb-6">
              <TouchableOpacity onPress={() => setShowTitlePicker(false)} className="bg-gray-100 py-3.5 rounded-xl active:bg-gray-200">
                <Text className="text-center text-gray-700 font-semibold text-base">{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Attachment Type Modal ── */}
      <Modal visible={showAttachmentModal} transparent animationType="slide" onRequestClose={() => setShowAttachmentModal(false)}>
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
              {/* Photo */}
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-blue-50 rounded-xl mb-3 ${isPickingFile ? 'opacity-50' : 'active:bg-blue-100'}`}
              >
                <View className="bg-blue-600 p-3 rounded-full mr-4">
                  <ImageIcon size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">{t('complaint_form.attachment_photo')}</Text>
                  <Text className="text-sm text-gray-600">{t('complaint_form.attachment_photo_hint')}</Text>
                </View>
                <View className="bg-blue-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">JPG, PNG</Text>
                </View>
              </TouchableOpacity>

              {/* Video */}
              <TouchableOpacity
                onPress={handlePickVideo}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-purple-50 rounded-xl mb-3 ${isPickingFile ? 'opacity-50' : 'active:bg-purple-100'}`}
              >
                <View className="bg-purple-600 p-3 rounded-full mr-4">
                  <Video size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">{t('complaint_form.attachment_video')}</Text>
                  <Text className="text-sm text-gray-600">{t('complaint_form.attachment_video_hint')}</Text>
                </View>
                <View className="bg-purple-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">MP4, MOV</Text>
                </View>
              </TouchableOpacity>

              {/* Document */}
              <TouchableOpacity
                onPress={handlePickDocument}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-green-50 rounded-xl mb-3 ${isPickingFile ? 'opacity-50' : 'active:bg-green-100'}`}
              >
                <View className="bg-green-600 p-3 rounded-full mr-4">
                  <FileText size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">{t('complaint_form.attachment_document')}</Text>
                  <Text className="text-sm text-gray-600">{t('complaint_form.attachment_document_hint')}</Text>
                </View>
                <View className="bg-green-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">ANY</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="px-4 pb-6">
              <TouchableOpacity onPress={() => setShowAttachmentModal(false)} className="bg-gray-100 py-3.5 rounded-xl active:bg-gray-200">
                <Text className="text-center text-gray-700 font-semibold text-base">{t('common.cancel')}</Text>
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