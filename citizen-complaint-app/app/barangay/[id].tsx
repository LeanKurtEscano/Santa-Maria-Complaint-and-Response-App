/**
 * IMPORTANT: Add these permissions to your app.json or app.config.js:
 *
 * For iOS (in "ios" section):
 * "infoPlist": {
 *   "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to attach images to complaints.",
 *   "NSCameraUsageDescription": "This app needs access to your camera to take photos for complaints."
 * }
 *
 * For Android (in "android" section):
 * "permissions": [
 *   "READ_EXTERNAL_STORAGE",
 *   "WRITE_EXTERNAL_STORAGE",
 *   "CAMERA"
 * ]
 */
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
import { PRESET_TITLE_KEYS } from '@/constants/localization/complaint-title-key';

const OTHER_KEY = 'complaint.preset.other';

export default function ComplaintFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const barangayName = (params.barangayName as string) || 'Barangay';
  const barangayId = params.id as string;

  const [selectedTitleKey, setSelectedTitleKey] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [showTitlePicker, setShowTitlePicker] = useState(false);

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [titleError, setTitleError] = useState('');
  const [messageError, setMessageError] = useState('');

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
    setToastVisible,
    toastVisible,
    toastMessage,
    toastType,
    hideToast,
  } = useAttachments();

  const isOtherSelected = selectedTitleKey === OTHER_KEY;

  const resolvedTitle = isOtherSelected
    ? customTitle.trim()
    : selectedTitleKey
    ? t(selectedTitleKey)
    : '';

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
    if (!validateFields()) return;
    setIsSubmitting(true);

    console.log('Submitting complaint:', {
      barangayId,
      title: resolvedTitle,
      message,
      attachments,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(t('complaint.success_title'), t('complaint.success_message'), [
        {
          text: t('common.ok'),
          onPress: () => {
            resetAttachments();
            setSelectedTitleKey('');
            setCustomTitle('');
            setMessage('');
            router.back();
          },
        },
      ]);
    }, 1000);
  };

  const handleSelectPreset = (key: string) => {
    setSelectedTitleKey(key);
    setTitleError('');
    if (key !== OTHER_KEY) setCustomTitle('');
    setShowTitlePicker(false);
  };

  // ---------------------------------------------------------------------------
  // Attachment helpers (unchanged)
  // ---------------------------------------------------------------------------
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} color="#3B82F6" />;
      case 'video':
        return <Video size={20} color="#3B82F6" />;
      default:
        return <FileText size={20} color="#3B82F6" />;
    }
  };

  const renderAttachment = (attachment: Attachment) => (
    <View
      key={attachment.id}
      className="bg-white border border-gray-200 rounded-xl p-3 mb-2 flex-row items-center"
    >
      <View className="bg-blue-50 p-2 rounded-lg mr-3">
        {getAttachmentIcon(attachment.type)}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
          {attachment.name}
        </Text>
        {attachment.size && (
          <Text className="text-xs text-gray-500">
            {formatFileSize(attachment.size)}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveAttachment(attachment.id)}
        className="p-2 bg-red-50 rounded-lg ml-2"
      >
        <X size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 -ml-2">
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">
            {t('complaint.screen_title')}
          </Text>
          <Text className="text-sm text-blue-600">{barangayName}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Complaint Title (Preset Picker) ── */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {t('complaint.title_label')} <Text className="text-red-500">*</Text>
          </Text>

          {/* Dropdown trigger */}
          <TouchableOpacity
            onPress={() => setShowTitlePicker(true)}
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: titleError ? '#EF4444' : '#E5E7EB',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                color: selectedTitleKey ? '#111827' : '#9CA3AF',
                fontSize: 14,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {selectedTitleKey
                ? t(selectedTitleKey)
                : t('complaint.title_placeholder')}
            </Text>
            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>

          {/* Custom title input — shown only when "Other" is selected */}
          {isOtherSelected && (
            <View className="mt-2">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: titleError ? '#EF4444' : '#3B82F6',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <PenLine size={16} color="#3B82F6" style={{ marginRight: 8 }} />
                <TextInput
                  value={customTitle}
                  onChangeText={(text) => {
                    setCustomTitle(text);
                    if (text.trim().length >= 3) setTitleError('');
                  }}
                  placeholder={t('complaint.custom_title_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                  style={{ flex: 1, color: '#111827', fontSize: 14 }}
                  autoFocus
                />
                <Text className="text-xs text-gray-400 ml-2">
                  {customTitle.length}/100
                </Text>
              </View>
              <Text className="text-xs text-blue-500 mt-1 ml-1">
                {t('complaint.custom_title_hint')}
              </Text>
            </View>
          )}

          {/* Error */}
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
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: messageError ? '#EF4444' : '#E5E7EB',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: '#111827',
              fontSize: 14,
              minHeight: 160,
            }}
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
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {t('complaint.attachments_label')}
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            {t('complaint.attachments_hint')}
          </Text>

          {attachments.map((attachment) => renderAttachment(attachment))}

          {attachments.length < 3 && (
            <TouchableOpacity
              onPress={() => setShowAttachmentModal(true)}
              className="bg-white border-2 border-dashed border-blue-300 rounded-xl py-6 items-center justify-center"
            >
              <View className="bg-blue-50 p-3 rounded-full mb-2">
                <Upload size={24} color="#3B82F6" />
              </View>
              <Text className="text-blue-600 font-semibold text-sm">
                {t('complaint.add_attachment')}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                {t('complaint.attachments_count', { count: attachments.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info Box ── */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-sm text-blue-900 font-semibold mb-1">
            {t('complaint.note_title')}
          </Text>
          <Text className="text-xs text-blue-800 leading-5">
            {t('complaint.note_body')}
          </Text>
        </View>
      </ScrollView>

      {/* ── Submit Button ── */}
      <View className="bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`py-4 rounded-xl items-center justify-center ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'
          }`}
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white font-semibold text-base">
            {isSubmitting ? t('complaint.submitting') : t('complaint.submit')}
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
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowTitlePicker(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">
                  {t('complaint.picker_title')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTitlePicker(false)}
                  className="p-2 -mr-2"
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500 mt-1">
                {t('complaint.picker_subtitle')}
              </Text>
            </View>

            {/* Preset list */}
            <FlatList
              data={PRESET_TITLE_KEYS}
              keyExtractor={(item) => item}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: key }) => {
                const isSelected = selectedTitleKey === key;
                const isOther = key === OTHER_KEY;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelectPreset(key)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 13,
                      paddingHorizontal: 12,
                      marginBottom: 4,
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? '#EFF6FF'
                        : isOther
                        ? '#F9FAFB'
                        : 'white',
                      borderWidth: 1,
                      borderColor: isSelected
                        ? '#3B82F6'
                        : isOther
                        ? '#D1D5DB'
                        : '#F3F4F6',
                    }}
                  >
                    {isOther ? (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: '#F3F4F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <PenLine size={14} color="#6B7280" />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: isSelected ? '#DBEAFE' : '#F3F4F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      />
                    )}

                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#1D4ED8' : isOther ? '#6B7280' : '#111827',
                        fontStyle: isOther ? 'italic' : 'normal',
                      }}
                    >
                      {t(key)}
                    </Text>

                    {isSelected && (
                      <Check size={18} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Cancel */}
            <View className="px-4 pb-6 pt-2">
              <TouchableOpacity
                onPress={() => setShowTitlePicker(false)}
                className="bg-gray-100 py-3.5 rounded-xl active:bg-gray-200"
              >
                <Text className="text-center text-gray-700 font-semibold text-base">
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Attachment Type Modal (unchanged) ── */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowAttachmentModal(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">
                  {t('complaint.add_attachment')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAttachmentModal(false)}
                  className="p-2 -mr-2"
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                {t('complaint.attachment_remaining', {
                  count: 3 - attachments.length,
                })}
              </Text>
            </View>

            <View className="px-4 py-4">
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-blue-50 rounded-xl mb-3 ${
                  isPickingFile ? 'opacity-50' : 'active:bg-blue-100'
                }`}
              >
                <View className="bg-blue-600 p-3 rounded-full mr-4">
                  <ImageIcon size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    {t('complaint.attachment_photo')}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {t('complaint.attachment_photo_hint')}
                  </Text>
                </View>
                <View className="bg-blue-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">JPG, PNG</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickVideo}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-purple-50 rounded-xl mb-3 ${
                  isPickingFile ? 'opacity-50' : 'active:bg-purple-100'
                }`}
              >
                <View className="bg-purple-600 p-3 rounded-full mr-4">
                  <Video size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    {t('complaint.attachment_video')}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {t('complaint.attachment_video_hint')}
                  </Text>
                </View>
                <View className="bg-purple-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">MP4, MOV</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickDocument}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-green-50 rounded-xl mb-3 ${
                  isPickingFile ? 'opacity-50' : 'active:bg-green-100'
                }`}
              >
                <View className="bg-green-600 p-3 rounded-full mr-4">
                  <FileText size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    {t('complaint.attachment_document')}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {t('complaint.attachment_document_hint')}
                  </Text>
                </View>
                <View className="bg-green-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">ANY</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => setShowAttachmentModal(false)}
                className="bg-gray-100 py-3.5 rounded-xl active:bg-gray-200"
              >
                <Text className="text-center text-gray-700 font-semibold text-base">
                  {t('common.cancel')}
                </Text>
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