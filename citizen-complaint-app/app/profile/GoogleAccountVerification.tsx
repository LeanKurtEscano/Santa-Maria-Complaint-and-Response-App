import React, { useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  CreditCard,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  FileText,
  ChevronLeft,
} from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { ID_TYPES } from '@/constants/auth/registration';
import {
  validateIdNumberByType,
  getIdNumberPlaceholder,
  getIdNumberHint,
} from '@/utils/validation/id';
import ErrorMessage from '@/components/register/ErrorMessage';
import useToastStore from '@/store/useGlobalModal';
import { authApiClient } from '@/lib/client/user';
// ── Local form shape ─────────────────────────────────────────────────────────
// This screen only needs the ID fields — no terms/recaptcha, since the user
// already agreed to those at signup. Kept separate from RegistrationFormData
// on purpose so this screen doesn't depend on the registration wizard's type.
interface IdVerificationFormData {
  idType: string;
  idNumber: string;
  idFrontImage: string;
  idBackImage: string;
  selfieImage: string;
}

type ImageField = 'idFrontImage' | 'idBackImage' | 'selfieImage';

// ── Image helpers ────────────────────────────────────────────────────────────
// Same memory-safe resize/encode pipeline as Step3IdVerification — kept
// duplicated here rather than importing from that file, since Step3 is a
// route-agnostic wizard step and shouldn't be reached into by a screen.
// If this logic needs to change in both places, consider extracting it to
// e.g. `@/utils/image/resizeAndEncode.ts` so both call the same source.

const TARGET_BASE64_BYTES = 700 * 1024;
const INITIAL_WIDTH = Platform.OS === 'android' ? 1024 : 1280;
const INITIAL_QUALITY = Platform.OS === 'android' ? 0.5 : 0.6;
const MIN_WIDTH = Platform.OS === 'android' ? 640 : 800;
const MIN_QUALITY = 0.3;
const MAX_ATTEMPTS = 3;

const base64ByteLength = (base64: string): number => {
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const deleteQuietly = (uri?: string) => {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best-effort cache cleanup — never let this fail the actual flow.
  }
};

const resizeAndEncode = async (uri: string): Promise<string> => {
  if (!uri) throw new Error('No URI provided');

  let width = INITIAL_WIDTH;
  let quality = INITIAL_QUALITY;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let manipulated: ImageManipulator.ImageResult | undefined;
    try {
      manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) {
        throw new Error('Failed to encode image');
      }

      const sizeBytes = base64ByteLength(manipulated.base64);
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      const atFloor = width <= MIN_WIDTH && quality <= MIN_QUALITY;

      if (sizeBytes <= TARGET_BASE64_BYTES || isLastAttempt || atFloor) {
        const dataUri = `data:image/jpeg;base64,${manipulated.base64}`;
        void deleteQuietly(manipulated.uri);
        return dataUri;
      }

      void deleteQuietly(manipulated.uri);
      width = Math.max(MIN_WIDTH, Math.round(width * 0.75));
      quality = Math.max(MIN_QUALITY, Number((quality - 0.1).toFixed(2)));
    } catch (err) {
      lastError = err;
      void deleteQuietly(manipulated?.uri);
      width = Math.max(MIN_WIDTH, Math.round(width * 0.6));
      quality = MIN_QUALITY;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to encode image');
};

const getDisplayLabel = (value: string, fieldName: ImageField): string => {
  if (!value) return '';
  if (value.startsWith('data:')) {
    const labels: Record<ImageField, string> = {
      idFrontImage: 'ID Front captured',
      idBackImage: 'ID Back captured',
      selfieImage: 'Selfie captured',
    };
    return labels[fieldName] ?? 'Image captured';
  }
  return value.split('/').pop() ?? 'Image selected';
};

// ── Component ────────────────────────────────────────────────────────────────

export default function GoogleAccountVerification() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToastStore();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<IdVerificationFormData>({
    defaultValues: {
      idType: '',
      idNumber: '',
      idFrontImage: '',
      idBackImage: '',
      selfieImage: '',
    },
  });

  const [selectedIdType, setSelectedIdType] = useState('');
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<ImageField | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const idPlaceholder = selectedIdType ? getIdNumberPlaceholder(selectedIdType) : 'Select an ID type first';
  const idHint = getIdNumberHint(selectedIdType);

  // ── Image handling ────────────────────────────────────────────────────────

  const handleImagePick = (field: ImageField) => {
    setCurrentImageField(field);
    setShowImagePickerModal(true);
  };

  const processAndStoreImage = async (uri: string, field: ImageField) => {
    setImageLoading(true);
    try {
      const base64Uri = await resizeAndEncode(uri);
      setValue(field, base64Uri, { shouldDirty: true });
      clearErrors(field);
    } catch {
      setError(field, { type: 'manual', message: 'Failed to process image. Please try again.' });
    } finally {
      setImageLoading(false);
    }
  };

  const pickFromCamera = async () => {
    if (!currentImageField) return;

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Camera permission is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      quality: 0.7,
    });

    setShowImagePickerModal(false);
    if (!result.canceled) {
      await processAndStoreImage(result.assets[0].uri, currentImageField);
    }
    setCurrentImageField(null);
  };

  const pickFromLibrary = async () => {
    if (!currentImageField) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      quality: 0.7,
    });

    setShowImagePickerModal(false);
    if (!result.canceled) {
      await processAndStoreImage(result.assets[0].uri, currentImageField);
    }
    setCurrentImageField(null);
  };

  const removeImage = (field: ImageField) => {
    setValue(field, '', { shouldValidate: false, shouldDirty: true });
    clearErrors(field);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: IdVerificationFormData) => {
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      // Backend endpoint (PATCH /id-verification) declares its params as
      // Form(...), i.e. it expects multipart/form-data — not JSON — and
      // the field names are snake_case, so map from this form's camelCase.
      const formData = new FormData();
      formData.append('id_type', data.idType);
      formData.append('id_number', data.idNumber);
      formData.append('front_id', data.idFrontImage);
      formData.append('back_id', data.idBackImage);
      formData.append('selfie_with_id', data.selfieImage);

      await authApiClient.patch('/id-verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('ID verification submitted successfully.', 'success');
      router.replace('/(tabs)');
    } catch {
      setSubmitError('Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const ImageUploadField = ({
    fieldName,
    label,
    required,
    subLabel,
  }: {
    fieldName: ImageField;
    label: string;
    required?: boolean;
    subLabel: string;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-neutral-700 mb-2">
        {label} {required && '*'}
      </Text>
      <Controller
        control={control}
        name={fieldName}
        rules={required ? { required: t('required') } : undefined}
        render={({ field: { value } }) => (
          <>
            {value ? (
              <View
                className={`border-2 rounded-xl p-4 bg-white ${
                  errors[fieldName] ? 'border-error-500' : 'border-neutral-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <ImageIcon size={20} color="#10B981" />
                    <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>
                      {getDisplayLabel(value, fieldName)}
                    </Text>
                  </View>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleImagePick(fieldName)}
                      className="bg-primary-100 rounded-lg p-2"
                      activeOpacity={0.7}
                      disabled={imageLoading}
                    >
                      <Camera size={16} color={THEME.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeImage(fieldName)}
                      className="bg-error-100 rounded-lg p-2"
                      activeOpacity={0.7}
                      disabled={imageLoading}
                    >
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleImagePick(fieldName)}
                className={`border-2 border-dashed rounded-xl p-6 items-center ${
                  errors[fieldName]
                    ? 'border-error-500 bg-error-50'
                    : 'border-neutral-300 bg-neutral-50'
                }`}
                activeOpacity={0.7}
                disabled={imageLoading}
              >
                {imageLoading && currentImageField === fieldName ? (
                  <ActivityIndicator color={THEME.primary} />
                ) : (
                  <>
                    <Camera size={32} color="#9CA3AF" />
                    <Text style={{ color: THEME.primary }} className="font-medium mt-2">
                      {t('tapToUpload')}
                    </Text>
                    <Text className="text-neutral-500 text-xs mt-1">{subLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      />
      <ErrorMessage message={errors[fieldName]?.message} />
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View style={{ backgroundColor: THEME.primary }} className="px-6 pt-4 pb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">{t('idVerification')}</Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-neutral-600 mb-6">{t('idVerificationNote')}</Text>

        {/* ID Type */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">{t('idType')} *</Text>
          <Controller
            control={control}
            name="idType"
            rules={{ required: t('required') }}
            render={({ field: { value } }) => (
              <TouchableOpacity
                onPress={() => setShowIdTypeModal(true)}
                className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                  errors.idType ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                }`}
                activeOpacity={0.7}
              >
                <CreditCard size={20} color="#6B7280" />
                <Text className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {value ? t(value) : t('selectIdType')}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          />
          <ErrorMessage message={errors.idType?.message} />
        </View>

        {/* ID Type Modal */}
        <Modal
          visible={showIdTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowIdTypeModal(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
              <Text className="text-xl font-bold text-neutral-900 mb-4">{t('selectIdType')}</Text>
              <TouchableOpacity
                onPress={() => setShowIdTypeModal(false)}
                className="absolute top-6 right-6"
                activeOpacity={0.7}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
              <ScrollView>
                {ID_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => {
                      if (selectedIdType !== type) {
                        setValue('idNumber', '');
                        clearErrors('idNumber');
                      }
                      setSelectedIdType(type);
                      setValue('idType', type, { shouldDirty: true, shouldValidate: true });
                      clearErrors('idType');
                      setShowIdTypeModal(false);
                    }}
                    className={`py-4 border-b border-neutral-200 flex-row justify-between items-center ${
                      selectedIdType === type ? 'bg-primary-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base text-neutral-900">{t(type)}</Text>
                    {selectedIdType === type && <Check size={18} color={THEME.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ID Number */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">{t('idNumber')} *</Text>
          <Controller
            control={control}
            name="idNumber"
            rules={{
              required: t('required'),
              validate: (value) => {
                const err = validateIdNumberByType(value, selectedIdType, t);
                return err ? err : true;
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View
                  className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                    errors.idNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                  }`}
                >
                  <FileText size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                    onBlur={() => {
                      onBlur();
                      const err = validateIdNumberByType(value, selectedIdType, t);
                      if (err) setError('idNumber', { type: 'manual', message: err });
                      else clearErrors('idNumber');
                    }}
                    onChangeText={(text) => {
                      const sanitized = text.replace(/[^a-zA-Z0-9\- ]/g, '').toUpperCase();
                      onChange(sanitized);
                      clearErrors('idNumber');
                    }}
                    maxLength={30}
                    value={value}
                    placeholder={idPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                  />
                </View>
                {idHint ? <Text className="text-xs text-neutral-500 mt-1">{idHint}</Text> : null}
              </>
            )}
          />
          <ErrorMessage message={errors.idNumber?.message} />
        </View>

        {/* Image Upload Fields */}
        <ImageUploadField
          fieldName="idFrontImage"
          label={t('uploadIdFront')}
          required
          subLabel="Front side of your ID"
        />
        <ImageUploadField
          fieldName="idBackImage"
          label={t('uploadIdBack')}
          required
          subLabel="Back side of your ID"
        />
        <ImageUploadField
          fieldName="selfieImage"
          label={t('uploadSelfie')}
          required
          subLabel="Selfie holding your ID"
        />

        {/* Image Picker Modal */}
        <Modal
          visible={showImagePickerModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowImagePickerModal(false);
            setCurrentImageField(null);
          }}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-xl font-bold text-neutral-900 mb-4">Choose Image Source</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowImagePickerModal(false);
                  setCurrentImageField(null);
                }}
                className="absolute top-6 right-6"
                activeOpacity={0.7}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickFromCamera}
                className="flex-row items-center bg-primary-50 rounded-xl p-4 mb-3"
                activeOpacity={0.7}
              >
                <Camera size={24} color={THEME.primary} />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-neutral-900">Take Photo</Text>
                  <Text className="text-sm text-neutral-600">Use your camera to capture</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickFromLibrary}
                className="flex-row items-center bg-neutral-50 rounded-xl p-4"
                activeOpacity={0.7}
              >
                <ImageIcon size={24} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-neutral-900">Choose from Gallery</Text>
                  <Text className="text-sm text-neutral-600">Select from your photos</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {submitError && (
          <View className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <AlertCircle size={20} color="#EF4444" />
              <Text className="text-error-700 font-medium ml-2">{submitError}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || imageLoading}
          style={{ backgroundColor: THEME.primary }}
          className="rounded-xl py-4 items-center shadow-sm mt-2"
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">{t('submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}