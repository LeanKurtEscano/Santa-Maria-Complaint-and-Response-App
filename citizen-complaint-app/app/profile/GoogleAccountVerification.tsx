import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import {
  CreditCard,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { ID_TYPES } from '@/constants/auth/registration';
import {
  validateIdNumberByType,
  getIdNumberPlaceholder,
  getIdNumberHint,
} from '@/utils/validation/id';
import ErrorMessage from '@/components/register/ErrorMessage';
import TermsAndAgreementModal from '@/components/modals/TermsAndAgreement';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import GeneralToast from '@/components/Toast/GeneralToast';
import useToastStore from '@/store/useGlobalModal';
import { authApiClient, userApiClient } from '@/lib/client/user';
import { askForNotificationPermission } from '@/hooks/general/usePushNotifications';
type ImageField = 'idFrontImage' | 'idBackImage' | 'selfieImage';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * MEMORY NOTES (Android):
 *
 * The dominant memory cost in this pipeline isn't the final base64 string —
 * it's the *decode* step inside ImageManipulator. A modern Android camera
 * can produce a 10-50MP JPEG. To resize it, the native layer has to first
 * decode that into an uncompressed bitmap (roughly width * height * 4 bytes),
 * which for a 12MP photo is 140MB+ of transient native memory, before it
 * ever gets resized/re-encoded down to something small. On lower-RAM Android
 * devices this decode spike is what causes silent failures/crashes — no
 * amount of *output* compression avoids it, since it happens before
 * compression is applied.
 *
 * We can't avoid the initial decode from JS/Expo, but we can:
 *  1. Ask for a smaller *output* budget on Android specifically (lower
 *     ceiling reduces the chance we're anywhere near a device's limit).
 *  2. Verify the actual encoded size and adaptively re-encode smaller if
 *     we're still over budget, instead of trusting a single fixed setting.
 *  3. Retry once at a much smaller size if the manipulator throws at all
 *     (memory-pressure failures on Android often surface as a thrown error
 *     rather than a hard crash).
 *  4. Delete the temp file the manipulator writes to cache once we've read
 *     its base64, so repeated attempts (retries, re-picks) don't also pile
 *     up disk pressure on top of memory pressure.
 */

// Conservative per-image budget, comfortably under the backend's 1024KB
// per-part limit (base64 inflates raw bytes by ~33%, so budget in base64
// characters, not source bytes).
const TARGET_BASE64_BYTES = 700 * 1024;

// Android gets a smaller ceiling and harder floor than iOS — Android devices
// span a much wider (and lower) RAM range.
const INITIAL_WIDTH = Platform.OS === 'android' ? 1024 : 1280;
const INITIAL_QUALITY = Platform.OS === 'android' ? 0.5 : 0.6;
const MIN_WIDTH = Platform.OS === 'android' ? 640 : 800;
const MIN_QUALITY = 0.3;
const MAX_ATTEMPTS = 3;

const base64ByteLength = (base64: string): number => {
  // Rough but sufficient estimate: 4 base64 chars encode 3 bytes.
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const deleteQuietly = (uri?: string) => {
  if (!uri) return;
  try {
    // SDK 54's class-based API: File.delete() is sync and throws if the
    // file doesn't exist, so guard with `exists` first.
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best-effort cache cleanup — never let this fail the actual flow.
  }
};

/**
 * Resizes an image to a memory-safe max width and compresses it, then
 * returns a base64 data URI. Adaptively steps down size/quality if the
 * first pass is still too large, and retries once at a much smaller size
 * if the manipulator itself throws (typical shape of a memory-pressure
 * failure on Android).
 */
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
        // We only needed the base64 string — drop the cached file the
        // manipulator wrote to disk so retries/re-picks don't accumulate.
        void deleteQuietly(manipulated.uri);
        return dataUri;
      }

      // Still too big: step down and try again.
      void deleteQuietly(manipulated.uri);
      width = Math.max(MIN_WIDTH, Math.round(width * 0.75));
      quality = Math.max(MIN_QUALITY, Number((quality - 0.1).toFixed(2)));
    } catch (err) {
      lastError = err;
      void deleteQuietly(manipulated?.uri);
      // Likely a decode/memory failure on this attempt — retry smaller
      // rather than giving up immediately.
      width = Math.max(MIN_WIDTH, Math.round(width * 0.6));
      quality = MIN_QUALITY;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to encode image');
};

/**
 * Translates raw backend/network error strings into plain-language messages
 * a non-technical user can act on. Falls back to a generic message rather
 * than showing raw server text (stack-trace-y strings like "Part exceeded
 * maximum size of 1024KB." or "Internal Server Error" are meaningless to
 * users and look broken/unpolished).
 */
const getFriendlySubmitError = (
  rawMessage: string | undefined,
  status: number | undefined,
  t: (k: string) => string
): string => {
  const text = (rawMessage ?? '').toLowerCase();

  if (text.includes('exceeded maximum size') || text.includes('too large') || text.includes('payload too large')) {
    return t('googleIdVerification.errors.imageTooLarge');
  }
  if (text.includes('network') || text.includes('timeout') || status === undefined) {
    return t('googleIdVerification.errors.networkError');
  }
  if (status === 401 || status === 403) {
    return t('googleIdVerification.errors.sessionExpired');
  }
  if (status !== undefined && status >= 500) {
    return t('googleIdVerification.errors.serverError');
  }
  if (text.includes('already') && (text.includes('verified') || text.includes('exists'))) {
    return t('googleIdVerification.errors.alreadyVerified');
  }
  if (text.includes('invalid') && text.includes('id')) {
    return t('googleIdVerification.errors.invalidIdDetails');
  }

  // Fall back to the generic message rather than showing raw backend text.
  return t('googleIdVerification.errors.submitFailed');
};

const getDisplayLabel = (value: string, fieldName: ImageField, t: (k: string) => string): string => {
  if (!value) return '';
  const labels: Record<ImageField, string> = {
    idFrontImage: t('googleIdVerification.captured.front'),
    idBackImage: t('googleIdVerification.captured.back'),
    selfieImage: t('googleIdVerification.captured.selfie'),
  };
  return labels[fieldName] ?? t('googleIdVerification.captured.generic');
};

// ── Component ────────────────────────────────────────────────────────────────

export default function GoogleIdVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userData, fetchCurrentUser } = useCurrentUser();
  const { setToastVisible, toastVisible, toastMessage, toastType, showToast } = useToastStore();

  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idNumberError, setIdNumberError] = useState<string | undefined>();
  const [idTypeError, setIdTypeError] = useState<string | undefined>();

  // Base64 data URIs (data:image/...;base64,...) used for both preview and upload —
  // same shape as the register flow, now resized/adaptively-compressed before encoding.
  const [idFrontImage, setIdFrontImage] = useState('');
  const [idBackImage, setIdBackImage] = useState('');
  const [selfieImage, setSelfieImage] = useState('');

  const [imageErrors, setImageErrors] = useState<Partial<Record<ImageField, string>>>({});

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<ImageField | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  // `isLoading` (state) is what disables the button visually, but state
  // updates are async and don't take effect until the next render — a fast
  // double-tap can fire handleSubmit twice before the disabled prop lands.
  // This ref is checked/set synchronously so a second tap in the same
  // frame is a true no-op, not just visually blocked.
  const isSubmittingRef = useRef(false);

  const idPlaceholder = idType ? getIdNumberPlaceholder(idType) : t('googleIdVerification.selectIdTypeFirst');
  const idHint = getIdNumberHint(idType);

  const imageSetters: Record<ImageField, (v: string) => void> = {
    idFrontImage: setIdFrontImage,
    idBackImage: setIdBackImage,
    selfieImage: setSelfieImage,
  };
  const imageValues: Record<ImageField, string> = {
    idFrontImage: idFrontImage,
    idBackImage: idBackImage,
    selfieImage: selfieImage,
  };

  // ── Image handling ────────────────────────────────────────────────────────

  const handleImagePick = (field: ImageField) => {
    setCurrentImageField(field);
    setShowImagePickerModal(true);
  };

  const storeImage = async (asset: ImagePicker.ImagePickerAsset, field: ImageField) => {
    // Drop any previous image for this field first so we're not briefly
    // holding the old large string alongside the new one being built.
    imageSetters[field]('');
    const dataUri = await resizeAndEncode(asset.uri);
    imageSetters[field](dataUri);
    setImageErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const pickFromCamera = async () => {
    if (!currentImageField) return;

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showToast(t('googleIdVerification.errors.cameraPermission'), 'error');
      return;
    }

    setImageLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        // allowsEditing on Android produces a short-lived temp URI that can expire
        // before we finish reading it. Disable it on Android to avoid that race.
        allowsEditing: Platform.OS === 'ios',
        quality: 0.7,
        exif: false,
      });

      setShowImagePickerModal(false);
      if (!result.canceled) {
        await storeImage(result.assets[0], currentImageField);
      }
    } catch (error) {
      console.log('Camera capture/encode error:', error);
      setImageErrors((prev) => ({
        ...prev,
        [currentImageField]: t('googleIdVerification.errors.imageProcessFailed'),
      }));
    } finally {
      setImageLoading(false);
      setCurrentImageField(null);
    }
  };

  const pickFromLibrary = async () => {
    if (!currentImageField) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast(t('googleIdVerification.errors.libraryPermission'), 'error');
      return;
    }

    setImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'ios',
        quality: 0.7,
        exif: false,
      });

      setShowImagePickerModal(false);
      if (!result.canceled) {
        await storeImage(result.assets[0], currentImageField);
      }
    } catch (error) {
      console.log('Library pick/encode error:', error);
      setImageErrors((prev) => ({
        ...prev,
        [currentImageField]: t('googleIdVerification.errors.imageProcessFailed'),
      }));
    } finally {
      setImageLoading(false);
      setCurrentImageField(null);
    }
  };

  const removeImage = (field: ImageField) => {
    imageSetters[field]('');
    setImageErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    let valid = true;

    if (!idType) {
      setIdTypeError(t('required'));
      valid = false;
    } else {
      setIdTypeError(undefined);
    }

    const idErr = validateIdNumberByType(idNumber, idType, t);
    if (!idNumber || idErr) {
      setIdNumberError(idErr || t('required'));
      valid = false;
    } else {
      setIdNumberError(undefined);
    }

    const nextImageErrors: Partial<Record<ImageField, string>> = {};
    if (!idFrontImage) {
      nextImageErrors.idFrontImage = t('required');
      valid = false;
    }
    if (!idBackImage) {
      nextImageErrors.idBackImage = t('required');
      valid = false;
    }
    if (!selfieImage) {
      nextImageErrors.selfieImage = t('required');
      valid = false;
    }
    setImageErrors(nextImageErrors);

    if (!agreedToTerms) {
      setTermsError(t('required'));
      valid = false;
    } else {
      setTermsError(undefined);
    }

    return valid;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    setSubmitError(undefined);
    if (!validate()) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id_type', idType);
      formData.append('id_number', idNumber);
      // Same shape as register: send the base64 data URI strings directly
      // instead of building { uri, name, type } file parts. This avoids the
      // Android multipart file-streaming issue that was causing the images
      // to arrive as undefined server-side. Images are resized/adaptively
      // compressed before this point (see resizeAndEncode) to stay under
      // the backend's per-part size limit and reduce peak memory use.
      formData.append('front_id', idFrontImage);
      formData.append('back_id', idBackImage);
      formData.append('selfie_with_id', selfieImage);

      // Let Axios/RN set Content-Type itself. If authApiClient has a default
      // 'application/json' Content-Type baked in, override it here so the
      // multipart boundary isn't clobbered:
      const response = await authApiClient.patch('/id-verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        await fetchCurrentUser();
      }

      // Clear the large base64 strings out of state now that they've been
      // sent — nothing downstream needs them, and we're about to navigate
      // away anyway.
      setIdFrontImage('');
      setIdBackImage('');
      setSelfieImage('');

      if (!userData?.push_notifications_enabled) {
  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    Alert.alert(
      '🔔 Stay Updated',
      'Do you want to receive notifications about your ID verification status?',
      [
        { text: 'No Thanks', style: 'cancel', onPress: done },
        {
          text: 'Yes, Notify Me',
          onPress: async () => {
            try {
              const token = await askForNotificationPermission();
              if (!token) {
                showToast(t('googleIdVerification.errors.notificationPermissionDenied') ?? 'Permission denied for notifications.', 'error');
                return;
              }
              await userApiClient.post('/push-token', { token });
              await userApiClient.post('/enable-push-notifications', { enabled: true });
              await fetchCurrentUser(true);
              showToast('Notifications enabled!', 'success');
            } catch (err) {
              showToast('Failed to enable notifications.', 'error');
            } finally {
              done();
            }
          },
        },
      ],
      { cancelable: true, onDismiss: done } // safety net for outside-tap / back-button dismiss on Android
    );
  });
}




      router.push('/(tabs)');
    } catch (error: any) {
      // Keep the raw error in logs for debugging — never shown to the user.
      console.log('ID verification error:', JSON.stringify(error?.response?.data, null, 2));
      console.log('ID verification error status:', error?.response?.status);

      const detail = error?.response?.data?.detail;
      const rawMessage = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join('\n')
        : detail;

      setSubmitError(getFriendlySubmitError(rawMessage, error?.response?.status, t));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
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
  }) => {
    const value = imageValues[fieldName];
    const error = imageErrors[fieldName];

    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {label} {required && '*'}
        </Text>
        {value ? (
          <View
            className={`border-2 rounded-xl p-4 bg-white ${
              error ? 'border-error-500' : 'border-neutral-200'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <ImageIcon size={20} color="#10B981" />
                <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>
                  {getDisplayLabel(value, fieldName, t)}
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
              error ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'
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
        <ErrorMessage message={error} />
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              position: 'absolute',
              top: 8,
              left: 0,
              zIndex: 10,
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={THEME.primary} />
            <Text style={{ color: THEME.primary }} className="text-base font-medium ml-0.5">
              {t('back')}
            </Text>
          </TouchableOpacity>

          <View className="items-center mb-6" style={{ marginTop: 36 }}>
            <View
              style={{ backgroundColor: THEME.primaryMuted }}
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
            >
              <ShieldCheck size={32} color={THEME.primary} />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 mb-2 text-center">
              {t('googleIdVerification.title')}
            </Text>
            <Text className="text-sm text-neutral-600 text-center">
              {t('googleIdVerification.subtitle')}
            </Text>
          </View>
        </View>

        {!!userData?.email && (
          <View className="bg-white border border-neutral-200 rounded-xl px-4 py-3 mb-6">
            <Text className="text-xs text-neutral-500 mb-0.5">
              {t('googleIdVerification.signedInAs')}
            </Text>
            <Text className="text-sm font-medium text-neutral-900">{userData.email}</Text>
          </View>
        )}

        {/* ID Type */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">{t('idType')} *</Text>
          <TouchableOpacity
            onPress={() => setShowIdTypeModal(true)}
            className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
              idTypeError ? 'border-error-500 bg-error-50' : 'border-neutral-200'
            }`}
            activeOpacity={0.7}
          >
            <CreditCard size={20} color="#6B7280" />
            <Text className={`flex-1 ml-3 text-base ${idType ? 'text-neutral-900' : 'text-neutral-400'}`}>
              {idType ? t(idType) : t('selectIdType')}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>
          <ErrorMessage message={idTypeError} />
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
                      if (idType !== type) {
                        setIdNumber('');
                        setIdNumberError(undefined);
                      }
                      setIdType(type);
                      setIdTypeError(undefined);
                      setShowIdTypeModal(false);
                    }}
                    className={`py-4 border-b border-neutral-200 flex-row justify-between items-center ${
                      idType === type ? 'bg-primary-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base text-neutral-900">{t(type)}</Text>
                    {idType === type && <Check size={18} color={THEME.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ID Number */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">{t('idNumber')} *</Text>
          <View
            className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
              idNumberError ? 'border-error-500 bg-error-50' : 'border-neutral-200'
            }`}
          >
            <FileText size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
              onBlur={() => {
                const err = validateIdNumberByType(idNumber, idType, t);
                setIdNumberError(err || undefined);
              }}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^a-zA-Z0-9\- ]/g, '').toUpperCase();
                setIdNumber(sanitized);
                setIdNumberError(undefined);
              }}
              maxLength={30}
              value={idNumber}
              placeholder={idPlaceholder}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
          </View>
          {idHint ? <Text className="text-xs text-neutral-500 mt-1">{idHint}</Text> : null}
          <ErrorMessage message={idNumberError} />
        </View>

        {/* Image Upload Fields */}
        <ImageUploadField
          fieldName="idFrontImage"
          label={t('uploadIdFront')}
          required
          subLabel={t('googleIdVerification.subLabels.front')}
        />
        <ImageUploadField
          fieldName="idBackImage"
          label={t('uploadIdBack')}
          required
          subLabel={t('googleIdVerification.subLabels.back')}
        />
        <ImageUploadField
          fieldName="selfieImage"
          label={t('uploadSelfie')}
          required
          subLabel={t('googleIdVerification.subLabels.selfie')}
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
              <Text className="text-xl font-bold text-neutral-900 mb-4">
                {t('googleIdVerification.chooseImageSource')}
              </Text>
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
                  <Text className="text-base font-semibold text-neutral-900">
                    {t('googleIdVerification.takePhoto')}
                  </Text>
                  <Text className="text-sm text-neutral-600">
                    {t('googleIdVerification.takePhotoSubtitle')}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickFromLibrary}
                className="flex-row items-center bg-neutral-50 rounded-xl p-4"
                activeOpacity={0.7}
              >
                <ImageIcon size={24} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-neutral-900">
                    {t('googleIdVerification.chooseFromGallery')}
                  </Text>
                  <Text className="text-sm text-neutral-600">
                    {t('googleIdVerification.chooseFromGallerySubtitle')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Terms and Conditions */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => {
              if (agreedToTerms) {
                setAgreedToTerms(false);
              } else {
                setShowTermsModal(true);
              }
            }}
            className="flex-row items-start mb-2"
            activeOpacity={0.7}
          >
            <View
              style={agreedToTerms ? { backgroundColor: THEME.primary, borderColor: THEME.primary } : {}}
              className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                !agreedToTerms ? (termsError ? 'border-error-500' : 'border-neutral-300') : ''
              }`}
            >
              {agreedToTerms && <Check size={14} color="#FFFFFF" />}
            </View>
            <Text className="text-sm text-neutral-700 flex-1">{t('agreeTerms')}</Text>
          </TouchableOpacity>

          <TermsAndAgreementModal
            visible={showTermsModal}
            onAccept={() => {
              setAgreedToTerms(true);
              setTermsError(undefined);
              setShowTermsModal(false);
            }}
            onDecline={() => setShowTermsModal(false)}
          />

          <ErrorMessage message={termsError} />
        </View>

        {submitError && (
          <View className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <AlertCircle size={20} color="#EF4444" />
              <Text className="text-error-700 font-medium ml-2">{submitError}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading || imageLoading}
          style={{ backgroundColor: THEME.primary }}
          className="rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">{t('submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <GeneralToast
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        message={toastMessage}
        type={toastType}
      />
    </SafeAreaView>
  );
}