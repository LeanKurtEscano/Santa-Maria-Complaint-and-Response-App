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
      setTitleError(t('complaint.error.title_required'));
      valid = false;
    } else if (isOtherSelected && customTitle.trim().length < 3) {
      setTitleError(t('complaint.error.title_too_short'));
      valid = false;
    } else {
      setTitleError('');
    }
    if (!message.trim()) {
      setMessageError(t('complaint.error.details_required'));
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
        category_id: resolvedCategoryId, // ← now properly sent to backend
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

      Alert.alert(t('complaint.success_title'), t('complaint.success_message'), [
        {
          text: t('common.ok'),
          onPress: () => {
            resetAttachments();
            setSelectedPreset(null);
            setCustomTitle('');
            setMessage('');
            setShowPreview(false);
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      showToast("Something Went Wrong. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
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
          <Text className="text-xl font-bold text-gray-900">{t('complaint.screen_title')}</Text>
          <Text className="text-sm text-blue-600">{barangayName}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>

        {/* ── Complaint Title ── */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {t('complaint.title_label')} <Text className="text-red-500">*</Text>
          </Text>

          {/* Dropdown trigger */}
          <TouchableOpacity
            onPress={() => setShowTitlePicker(true)}
            className={`flex-row items-center justify-between bg-white border rounded-xl px-4 py-[13px] ${
              titleError ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <Text numberOfLines={1} className={`flex-1 text-sm ${selectedPreset ? 'text-gray-900' : 'text-gray-400'}`}>
              {selectedPreset ? t(selectedPreset.key) : t('complaint.title_placeholder')}
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
                  placeholder={t('complaint.custom_title_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                  autoFocus
                  className="flex-1 text-sm text-gray-900"
                />
                <Text className="text-xs text-gray-400 ml-2">{customTitle.length}/100</Text>
              </View>
              <Text className="text-xs text-blue-500 mt-1 ml-1">{t('complaint.custom_title_hint')}</Text>
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
            {t('complaint.details_label')} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (text.trim()) setMessageError('');
            }}
            placeholder={t('complaint.details_placeholder')}
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
          <Text className="text-sm font-semibold text-gray-700 mb-2">{t('complaint.attachments_label')}</Text>
          <Text className="text-xs text-gray-500 mb-3">{t('complaint.attachments_hint')}</Text>

          {attachments.map((attachment) => renderAttachment(attachment))}

          {attachments.length < 3 && (
            <TouchableOpacity
              onPress={() => setShowAttachmentModal(true)}
              className="bg-white border-2 border-dashed border-blue-300 rounded-xl py-6 items-center justify-center"
            >
              <View className="bg-blue-50 p-3 rounded-full mb-2">
                <Upload size={24} color="#3B82F6" />
              </View>
              <Text className="text-blue-600 font-semibold text-sm">{t('complaint.add_attachment')}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {t('complaint.attachments_count', { count: attachments.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info Box ── */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-sm text-blue-900 font-semibold mb-1">{t('complaint.note_title')}</Text>
          <Text className="text-xs text-blue-800 leading-5">{t('complaint.note_body')}</Text>
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
            {t('complaint.submit')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Preset Title Picker Modal ── */}
      <Modal visible={showTitlePicker} transparent animationType="slide" onRequestClose={() => setShowTitlePicker(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowTitlePicker(false)}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>

            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">{t('complaint.picker_title')}</Text>
                <TouchableOpacity onPress={() => setShowTitlePicker(false)} className="p-2 -mr-2">
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500 mt-1">{t('complaint.picker_subtitle')}</Text>
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
                <Text className="text-xl font-bold text-gray-900">{t('complaint.add_attachment')}</Text>
                <TouchableOpacity onPress={() => setShowAttachmentModal(false)} className="p-2 -mr-2">
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                {t('complaint.attachment_remaining', { count: 3 - attachments.length })}
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
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">{t('complaint.attachment_photo')}</Text>
                  <Text className="text-sm text-gray-600">{t('complaint.attachment_photo_hint')}</Text>
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
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">{t('complaint.attachment_video')}</Text>
                  <Text className="text-sm text-gray-600">{t('complaint.attachment_video_hint')}</Text>
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
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">{t('complaint.attachment_document')}</Text>
                  <Text className="text-sm text-gray-600">{t('complaint.attachment_document_hint')}</Text>
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