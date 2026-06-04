import React, { useState } from 'react';
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
import { Controller, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react-native';
import { RegistrationFormData } from '@/types/auth/register';
import { THEME } from '@/constants/theme';
import { ID_TYPES } from '@/constants/auth/registration';
import {
  validateIdNumberByType,
  getIdNumberPlaceholder,
  getIdNumberHint,
} from '@/utils/validation/id';
import ErrorMessage from './ErrorMessage';
import Recaptcha from './Recaptcha';
import TermsAndAgreementModal from '@/components/modals/TermsAndAgreement';

interface Step3Props {
  form: UseFormReturn<RegistrationFormData>;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  recaptchaVerified: boolean;
  setRecaptchaVerified: (v: boolean) => void;
  recaptchaError: string | undefined;
  setRecaptchaError: (e: string | undefined) => void;
  saveFormData: () => Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts any image URI to a stable base64 data URI immediately after pick.
 *
 * WHY: On newer Android, image picker returns content:// or short-lived file://
 * URIs that expire once the picker closes or the app is backgrounded. Converting
 * to base64 right away makes the value stable for the lifetime of the session.
 *
 * NOTE: We use XMLHttpRequest instead of fetch() because fetch() of a
 * content:// URI is unreliable on Android's JS engine.
 */
const toBase64DataUri = (uri: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!uri) return reject(new Error('No URI provided'));
    // Already base64 — nothing to do.
    if (uri.startsWith('data:')) return resolve(uri);

    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = () => reject(new Error('XHR failed'));
    xhr.open('GET', uri);
    xhr.responseType = 'blob';
    xhr.send();
  });
};

/**
 * Shows a human-readable label for the image field value.
 * base64 URIs are replaced with a friendly name.
 */
const getDisplayLabel = (
  value: string,
  fieldName: 'idFrontImage' | 'idBackImage' | 'selfieImage',
): string => {
  if (!value) return '';
  if (value.startsWith('data:')) {
    const labels: Record<string, string> = {
      idFrontImage: 'ID Front captured',
      idBackImage: 'ID Back captured',
      selfieImage: 'Selfie captured',
    };
    return labels[fieldName] ?? 'Image captured';
  }
  return value.split('/').pop() ?? 'Image selected';
};

// ── Component ────────────────────────────────────────────────────────────────

const Step3IdVerification = ({
  form,
  onBack,
  onSubmit,
  isLoading,
  recaptchaVerified,
  setRecaptchaVerified,
  recaptchaError,
  setRecaptchaError,
  saveFormData,
}: Step3Props) => {
  const { t } = useTranslation();
  const { control, formState: { errors }, watch, setValue, setError, clearErrors } = form;

  const [selectedIdType, setSelectedIdType] = useState(watch('idType') || '');
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<
    'idFrontImage' | 'idBackImage' | 'selfieImage' | null
  >(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const idPlaceholder = selectedIdType ? getIdNumberPlaceholder(selectedIdType) : 'Select an ID type first';
  const idHint = getIdNumberHint(selectedIdType);

  // ── Image handling ────────────────────────────────────────────────────────

  const handleImagePick = (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
    setCurrentImageField(field);
    setShowImagePickerModal(true);
  };

  const processAndStoreImage = async (
    uri: string,
    field: 'idFrontImage' | 'idBackImage' | 'selfieImage',
  ) => {
    setImageLoading(true);
    try {
      // Convert to base64 immediately so the value is stable on Android even
      // after the picker closes, the app is backgrounded, or at submit time.
      const base64Uri = await toBase64DataUri(uri);
      setValue(field, base64Uri as any);
      clearErrors(field);
      await saveFormData();
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
      // allowsEditing on Android produces a short-lived temp URI that can expire
      // before submission. Disable it on Android to avoid that race condition.
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
      // Same reason as above — disable editing on Android.
      allowsEditing: Platform.OS === 'ios',
      quality: 0.7,
    });

    setShowImagePickerModal(false);
    if (!result.canceled) {
      await processAndStoreImage(result.assets[0].uri, currentImageField);
    }
    setCurrentImageField(null);
  };

  const removeImage = async (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
    setValue(field, '' as any, { shouldValidate: false, shouldDirty: true });
    clearErrors(field);
    await saveFormData();
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const ImageUploadField = ({
    fieldName,
    label,
    required,
    subLabel,
  }: {
    fieldName: 'idFrontImage' | 'idBackImage' | 'selfieImage';
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
            {value && value !== '' ? (
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
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-2">{t('idVerification')}</Text>
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
                    saveFormData();
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
              {idHint ? (
                <Text className="text-xs text-neutral-500 mt-1">{idHint}</Text>
              ) : null}
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

      {/* Terms and Conditions */}
      <View className="mb-4">
        <Controller
          control={control}
          name="agreedToTerms"
          rules={{ required: t('required') }}
          render={({ field: { onChange, value } }) => (
            <>
              <TouchableOpacity
                onPress={() => {
                  if (value) { onChange(false); } else { setShowTermsModal(true); }
                }}
                className="flex-row items-start mb-2"
                activeOpacity={0.7}
              >
                <View
                  style={value ? { backgroundColor: THEME.primary, borderColor: THEME.primary } : {}}
                  className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                    !value ? (errors.agreedToTerms ? 'border-error-500' : 'border-neutral-300') : ''
                  }`}
                >
                  {value && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text className="text-sm text-neutral-700 flex-1">{t('agreeTerms')}</Text>
              </TouchableOpacity>

              <TermsAndAgreementModal
                visible={showTermsModal}
                onAccept={() => {
                  onChange(true);
                  clearErrors('agreedToTerms');
                  setShowTermsModal(false);
                  saveFormData();
                }}
                onDecline={() => setShowTermsModal(false)}
              />
            </>
          )}
        />
        <ErrorMessage message={errors.agreedToTerms?.message} />

        {/* reCAPTCHA */}
        <View className="mb-6 mt-2">
          <Recaptcha
            verified={recaptchaVerified}
            onVerify={() => {
              setRecaptchaVerified(true);
              setRecaptchaError(undefined);
            }}
            error={recaptchaError}
          />
        </View>

        {errors.root?.general && (
          <View className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <AlertCircle size={20} color="#EF4444" />
              <Text className="text-error-700 font-medium ml-2">{errors.root.general.message}</Text>
            </View>
          </View>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onBack}
            className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
            activeOpacity={0.7}
            disabled={isLoading || imageLoading}
          >
            <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isLoading || imageLoading}
            style={{ backgroundColor: THEME.primary }}
            className="flex-1 rounded-xl py-4 items-center shadow-sm"
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text className="text-white font-semibold text-base">{t('submit')}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Step3IdVerification;