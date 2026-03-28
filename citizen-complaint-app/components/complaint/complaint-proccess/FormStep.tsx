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
import { THEME } from '@/constants/theme';

interface FormStepProps {
  barangayName: string;
  hasProfileLocation: boolean;
  selectedPreset: PresetTitle | null;
  customTitle: string;
  titleError: string;
  showTitlePicker: boolean;
  onOpenTitlePicker: () => void;
  onCloseTitlePicker: () => void;
  onSelectPreset: (preset: PresetTitle) => void;
  onChangeCustomTitle: (text: string) => void;
  message: string;
  messageError: string;
  onChangeMessage: (text: string) => void;
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
      case 'image': return <ImageIcon size={20} color={THEME.primary} />;
      case 'video': return <Video size={20} color={THEME.primary} />;
      default:      return <FileText size={20} color={THEME.primary} />;
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
          <Text className="text-sm mt-0.5" style={{ color: THEME.primary }}>{barangayName}</Text>
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
            className={`flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 border-2 ${titleError ? 'border-red-400' : 'border-gray-200'}`}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
          >
            <Text numberOfLines={1} className={`flex-1 text-base ${selectedPreset ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {selectedPreset ? t(selectedPreset.key) : t('complaint_form.title_placeholder')}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {isOtherSelected && (
            <View className="mt-3">
              <View
                className={`flex-row items-center bg-white border-2 rounded-2xl px-4 py-3.5 ${titleError ? 'border-red-400' : ''}`}
                style={!titleError ? { borderColor: THEME.primary } : undefined}
              >
                <PenLine size={18} color={THEME.primary} />
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
              <Text className="text-sm mt-1.5 ml-1" style={{ color: THEME.primary }}>
                {t('complaint_form.custom_title_hint')}
              </Text>
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
              <View className="p-2.5 rounded-xl mr-3" style={{ backgroundColor: `${THEME.primary}15` }}>
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
              className="bg-white border-2 border-dashed rounded-2xl py-7 items-center justify-center"
              style={{ borderColor: `${THEME.primary}60` }}
            >
              <View className="p-3.5 rounded-2xl mb-3" style={{ backgroundColor: `${THEME.primary}15` }}>
                <Upload size={26} color={THEME.primary} />
              </View>
              <Text className="font-bold text-base" style={{ color: THEME.primary }}>
                {t('complaint_form.add_attachment')}
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                {t('complaint_form.attachments_count', { count: attachments.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Info Box ── */}
        <View
          className="rounded-2xl p-5 mb-6 flex-row items-start border"
          style={{ backgroundColor: `${THEME.primary}10`, borderColor: `${THEME.primary}30` }}
        >
          <Info size={18} color={THEME.primary} style={{ marginTop: 1, flexShrink: 0 }} />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-bold mb-1" style={{ color: THEME.primary }}>
              {t('complaint_form.note_title')}
            </Text>
            <Text className="text-sm leading-6" style={{ color: THEME.primary }}>
              {t('complaint_form.note_body')}
            </Text>
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
          className="py-4 rounded-2xl items-center justify-center flex-row gap-2"
          style={{
            backgroundColor: THEME.primary,
            shadowColor: THEME.primary,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text className="font-bold text-base" style={{ color: '#ffffff' }}>Next: Pin Location</Text>
          <ArrowRight size={18} color="#ffffff" />
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
                    className={`flex-row items-center py-4 px-4 mb-1.5 rounded-2xl border ${isOther ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}
                    style={isSelected ? { backgroundColor: `${THEME.primary}10`, borderColor: THEME.primary } : undefined}
                  >
                    {isOther && <PenLine size={16} color="#6B7280" style={{ marginRight: 8 }} />}
                    <Text
                      className={`flex-1 text-base ${isOther && !isSelected ? 'italic text-gray-500' : 'text-gray-900'}`}
                      style={isSelected ? { fontWeight: 'bold', color: THEME.primary } : undefined}
                    >
                      {t(item.key)}
                    </Text>
                    {isSelected && <Check size={20} color={THEME.primary} />}
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
                { onPress: onPickImage,    bg: `${THEME.primary}10`, iconBg: THEME.primary, icon: <ImageIcon size={24} color="#ffffff" />, label: t('complaint_form.attachment_photo'),    hint: t('complaint_form.attachment_photo_hint'),    tag: 'JPG, PNG' },
                { onPress: onPickVideo,    bg: '#f5f3ff',            iconBg: '#7c3aed',     icon: <Video size={24} color="#ffffff" />,     label: t('complaint_form.attachment_video'),    hint: t('complaint_form.attachment_video_hint'),    tag: 'MP4, MOV' },
                { onPress: onPickDocument, bg: '#f0fdf4',            iconBg: '#16a34a',     icon: <FileText size={24} color="#ffffff" />,  label: t('complaint_form.attachment_document'), hint: t('complaint_form.attachment_document_hint'), tag: 'ANY' },
              ].map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={opt.onPress}
                  disabled={isPickingFile}
                  className={`flex-row items-center p-4 rounded-2xl mb-3 ${isPickingFile ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: opt.bg }}
                >
                  <View className="p-3 rounded-2xl mr-4" style={{ backgroundColor: opt.iconBg }}>
                    {opt.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-0.5">{opt.label}</Text>
                    <Text className="text-sm text-gray-500">{opt.hint}</Text>
                  </View>
                  <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: opt.iconBg }}>
                    <Text className="text-xs font-bold" style={{ color: '#ffffff' }}>{opt.tag}</Text>
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