import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X, Upload, FileText, Video, Image as ImageIcon,
  ArrowLeft, AlertCircle, ChevronDown, Check, PenLine,
  Info, ArrowRight, MapPin,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PRESET_TITLE_KEYS, OTHER_KEY, PresetTitle } from '@/constants/localization/complaint-title-key';
import { Attachment } from '@/hooks/general/useAttachment';
import { StepDots } from './StepDots';

interface FormStepProps {
  barangayName: string;
  hasProfileLocation: boolean;
  // Title
  selectedPreset: PresetTitle | null;
  customTitle: string;
  titleError: string;
  showTitlePicker: boolean;
  onOpenTitlePicker: () => void;
  onCloseTitlePicker: () => void;
  onSelectPreset: (preset: PresetTitle) => void;
  onChangeCustomTitle: (text: string) => void;
  // Message
  message: string;
  messageError: string;
  onChangeMessage: (text: string) => void;
  // Attachments
  attachments: Attachment[];
  isPickingFile: boolean;
  showAttachmentModal: boolean;
  onOpenAttachmentModal: () => void;
  onCloseAttachmentModal: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onPickDocument: () => void;
  onRemoveAttachment: (id: string) => void;
  formatFileSize: (size: number) => string;
  // Navigation
  onBack: () => void;
  onNext: () => void;
}

export function FormStep({
  barangayName,
  hasProfileLocation,
  selectedPreset,
  customTitle,
  titleError,
  showTitlePicker,
  onOpenTitlePicker,
  onCloseTitlePicker,
  onSelectPreset,
  onChangeCustomTitle,
  message,
  messageError,
  onChangeMessage,
  attachments,
  isPickingFile,
  showAttachmentModal,
  onOpenAttachmentModal,
  onCloseAttachmentModal,
  onPickImage,
  onPickVideo,
  onPickDocument,
  onRemoveAttachment,
  formatFileSize,
  onBack,
  onNext,
}: FormStepProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const isOtherSelected = selectedPreset?.key === OTHER_KEY;

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={20} color="#3B82F6" />;
      case 'video': return <Video size={20} color="#3B82F6" />;
      default: return <FileText size={20} color="#3B82F6" />;
    }
  };

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
        <StepDots current={2} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* Profile location warning */}
        {!hasProfileLocation && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Profile')}
            activeOpacity={0.8}
            className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-4 mb-5 flex-row items-start"
          >
            <AlertCircle size={18} color="#D97706" style={{ marginTop: 1, flexShrink: 0 }} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-bold text-amber-900">Profile Location Required</Text>
              <Text className="text-xs text-amber-700 mt-0.5 leading-5">
                You haven't set your location yet. Tap here to update your profile before submitting.
              </Text>
            </View>
            <ArrowRight size={16} color="#D97706" style={{ marginTop: 2 }} />
          </TouchableOpacity>
        )}

        {/* ── Complaint Title ── */}
        <View className="mb-5">
          <Text className="text-base font-bold text-gray-800 mb-2">
            {t('complaint_form.title_label')} <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-sm text-gray-500 mb-3 leading-5">
            Select the category that best describes your complaint.
          </Text>
          <TouchableOpacity
            onPress={onOpenTitlePicker}
            className={`flex-row items-center justify-between bg-white border-2 rounded-2xl px-4 py-4 ${titleError ? 'border-red-400' : 'border-gray-200'}`}
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
                  onChangeText={onChangeCustomTitle}
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
            onChangeText={onChangeMessage}
            placeholder={t('complaint_form.details_placeholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            maxLength={1000}
            className={`bg-white border-2 rounded-2xl px-4 py-4 text-base text-gray-900 min-h-[180px] ${messageError ? 'border-red-400' : 'border-gray-200'}`}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
          />
          <View className="flex-row items-center justify-between mt-2">
            {messageError ? (
              <View className="flex-row items-center gap-1.5">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-sm text-red-500">{messageError}</Text>
              </View>
            ) : <View />}
            <Text className="text-xs text-gray-400">{message.length}/1000</Text>
          </View>
        </View>

        <View className="h-px bg-gray-100 mb-5" />

        {/* ── Attachments ── */}
        <View className="mb-6">
          <Text className="text-base font-bold text-gray-800 mb-1">{t('complaint_form.attachments_label')}</Text>
          <Text className="text-sm text-gray-500 mb-4 leading-5">{t('complaint_form.attachments_hint')}</Text>

          {attachments.map((attachment) => (
            <View key={attachment.id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-2.5 flex-row items-center">
              <View className="bg-blue-50 p-2.5 rounded-xl mr-3">
                {getAttachmentIcon(attachment.type)}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{attachment.name}</Text>
                {attachment.size && (
                  <Text className="text-xs text-gray-500 mt-0.5">{formatFileSize(attachment.size)}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => onRemoveAttachment(attachment.id)} className="p-2 bg-red-50 rounded-xl ml-2">
                <X size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {attachments.length < 3 && (
            <TouchableOpacity
              onPress={onOpenAttachmentModal}
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

        {/* ── Next step hint ── */}
        <View className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3.5 mb-2 flex-row items-center gap-3">
          <MapPin size={16} color="#059669" />
          <Text className="text-sm text-emerald-800 flex-1 leading-5">
            <Text className="font-bold">Next: </Text>
            Pin where the incident happened on the map.
          </Text>
        </View>

      </ScrollView>

      {/* Footer */}
      <View className="bg-white border-t border-gray-100 px-5 py-4">
        <TouchableOpacity
          onPress={onNext}
          className="py-4 rounded-2xl items-center justify-center bg-blue-600 active:bg-blue-700 flex-row gap-2"
          style={{ shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}
        >
          <Text className="text-white font-bold text-base">Next: Pin Location</Text>
          <ArrowRight size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* ── Title Picker Modal ── */}
      <Modal visible={showTitlePicker} transparent animationType="slide" onRequestClose={onCloseTitlePicker}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onCloseTitlePicker}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">{t('complaint_form.picker_title')}</Text>
                <TouchableOpacity onPress={onCloseTitlePicker} className="p-2 -mr-2">
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
                    onPress={() => onSelectPreset(item)}
                    className={`flex-row items-center py-4 px-4 mb-1.5 rounded-2xl border ${isSelected ? 'bg-blue-50 border-blue-400' : isOther ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}
                  >
                    {isOther && <PenLine size={16} color="#6B7280" style={{ marginRight: 8 }} />}
                    <Text className={`flex-1 text-base ${isSelected ? 'font-bold text-blue-700' : isOther ? 'italic text-gray-500' : 'text-gray-900'}`}>
                      {t(item.key)}
                    </Text>
                    {isSelected && <Check size={20} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              }}
            />
            <View className="px-4 pt-2 pb-6">
              <TouchableOpacity onPress={onCloseTitlePicker} className="bg-gray-100 py-4 rounded-2xl active:bg-gray-200">
                <Text className="text-center text-gray-700 font-bold text-base">{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Attachment Type Modal ── */}
      <Modal visible={showAttachmentModal} transparent animationType="slide" onRequestClose={onCloseAttachmentModal}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onCloseAttachmentModal}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">{t('complaint_form.add_attachment')}</Text>
                <TouchableOpacity onPress={onCloseAttachmentModal} className="p-2 -mr-2">
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                {t('complaint_form.attachment_remaining', { count: 3 - attachments.length })}
              </Text>
            </View>
            <View className="px-4 py-4">
              {[
                { onPress: onPickImage,    bg: 'bg-blue-50',   iconBg: 'bg-blue-600',   icon: <ImageIcon size={24} color="white" />, label: t('complaint_form.attachment_photo'),    hint: t('complaint_form.attachment_photo_hint'),    tag: 'JPG, PNG', tagBg: 'bg-blue-600' },
                { onPress: onPickVideo,    bg: 'bg-purple-50', iconBg: 'bg-purple-600', icon: <Video size={24} color="white" />,     label: t('complaint_form.attachment_video'),    hint: t('complaint_form.attachment_video_hint'),    tag: 'MP4, MOV', tagBg: 'bg-purple-600' },
                { onPress: onPickDocument, bg: 'bg-green-50',  iconBg: 'bg-green-600',  icon: <FileText size={24} color="white" />,  label: t('complaint_form.attachment_document'), hint: t('complaint_form.attachment_document_hint'), tag: 'ANY',      tagBg: 'bg-green-600' },
              ].map((opt, i) => (
                <TouchableOpacity key={i} onPress={opt.onPress} disabled={isPickingFile} className={`flex-row items-center p-4 ${opt.bg} rounded-2xl mb-3 ${isPickingFile ? 'opacity-50' : ''}`}>
                  <View className={`${opt.iconBg} p-3 rounded-2xl mr-4`}>{opt.icon}</View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-0.5">{opt.label}</Text>
                    <Text className="text-sm text-gray-500">{opt.hint}</Text>
                  </View>
                  <View className={`${opt.tagBg} px-3 py-1.5 rounded-full`}>
                    <Text className="text-white text-xs font-bold">{opt.tag}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View className="px-4 pb-6">
              <TouchableOpacity onPress={onCloseAttachmentModal} className="bg-gray-100 py-4 rounded-2xl active:bg-gray-200">
                <Text className="text-center text-gray-700 font-bold text-base">{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}