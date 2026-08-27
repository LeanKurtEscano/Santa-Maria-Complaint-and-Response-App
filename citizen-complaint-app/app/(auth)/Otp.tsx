import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Clock,
  ShieldAlert,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { authApiClient } from '@/lib/client/user';
import { THEME } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import { userApiClient } from '@/lib/client/user';
const IP_URL = process.env.EXPO_PUBLIC_IP_URL;
interface OTPVerificationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      otpResendRoute?: string;
      successRoute?: string;
      apiRoute?: string;
      email?: string;
      phone?: string;
    };
  };
}

type ErrorType = 'invalid_otp' | 'expired_otp' | 'server' | 'validation' | 'generic' | null;

// ── Image helpers ─────────────────────────────────────────────────────────────

/**
 * Writes a base64 data URI to a temporary file and returns the file:// path.
 *
 * WHY: React Native's FormData file append requires a file:// (or content://)
 * URI — it cannot directly accept a base64 data URI string. We write the image
 * to the app's cache directory, which is always writable, then append that path.
 *
 * The temp files are cleaned up after the request completes.
 */
const base64ToTempFile = async (base64Uri: string, filename: string): Promise<string | null> => {
  if (!base64Uri) return null;
  try {
    // Strip the "data:image/jpeg;base64," prefix — FileSystem only wants the raw base64
    const base64Data = base64Uri.includes(',') ? base64Uri.split(',')[1] : base64Uri;
    const tempPath = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(tempPath, base64Data, {
      encoding: 'base64' as any,
    });
    return tempPath;
  } catch (err) {
    console.error(`Failed to write temp file ${filename}:`, err);
    return null;
  }
};

/**
 * Deletes a list of temp file paths. Called after the API request regardless
 * of success/failure to avoid accumulating stale files in the cache directory.
 */
const cleanupTempFiles = async (paths: (string | null)[]) => {
  await Promise.all(
    paths
      .filter(Boolean)
      .map((p) => FileSystem.deleteAsync(p as string, { idempotent: true }).catch(() => {})),
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OTPVerificationScreen({ navigation, route }: OTPVerificationScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { email: registerEmail, phone: registerPhone, apiRoute, otpResendRoute } =
    useLocalSearchParams();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [networkError, setNetworkError] = useState('');
  const [resendTimer, setResendTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Mode detection ──────────────────────────────────────────────────────
  const isResetPassword =
    apiRoute === 'verify-reset-password-otp' || apiRoute === '/verify-reset-password-otp';
  const isPhoneMode =
    apiRoute === '/verify-phone-number-otp' || apiRoute === 'verify-phone-number-otp';

  // ── Load contact info ───────────────────────────────────────────────────
  useEffect(() => {
    const loadContactInfo = async () => {
      if (isResetPassword) {
        const storedEmail = await AsyncStorage.getItem('resetEmail');
        setEmail(storedEmail || '');
      } else if (isPhoneMode) {
        setPhone((registerPhone as string) || '');
      } else {
        setEmail((registerEmail as string) || '');
      }
    };
    loadContactInfo();
  }, [isResetPassword, isPhoneMode, registerEmail, registerPhone]);

  const getEmail = async () => {
    if (isResetPassword) {
      const storedEmail = await AsyncStorage.getItem('resetEmail');
      return storedEmail || '';
    }
    return (registerEmail as string) || '';
  };

  // ── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const clearErrors = () => {
    setErrorMessage('');
    setErrorType(null);
    setNetworkError('');
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (errorType === 'invalid_otp' || errorType === 'expired_otp') clearErrors();
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (!canResend) return;
    clearErrors();
    try {
      if (isResetPassword) {
        await userApiClient.post((otpResendRoute as string) || '/resend-reset-otp', {
          email: await getEmail(),
        });
      } else if (isPhoneMode) {
        await authApiClient.post((otpResendRoute as string) || '/resend-phone-otp', {
          phone_number: phone,
        });
      } else {
        await authApiClient.post((otpResendRoute as string) || '/resend-otp', {
          email: await getEmail(),
        });
      }
      setResendTimer(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (
        err?.code === 'ECONNABORTED' ||
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error'
      ) {
        setNetworkError(t('otpResendNetworkError'));
      } else if (err?.code === 'ETIMEDOUT') {
        setNetworkError(t('otpResendTimeout'));
      } else {
        const msg = extractErrorMessage(
          err?.response?.data?.detail || err?.response?.data?.message,
        );
        setErrorMessage(msg || t('otpResendFailed'));
        setErrorType('generic');
      }
    }
  };

  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const extractErrorMessage = (errorData: any): string => {
    if (!errorData) return '';
    if (Array.isArray(errorData)) {
      return (
        errorData
          .map((e: any) => {
            if (typeof e === 'string') return e;
            const field = e.loc ? e.loc.join('.') : '';
            const msg = e.msg || e.message || '';
            return field ? `${field}: ${msg}` : msg;
          })
          .filter(Boolean)
          .join(', ') || 'Validation error occurred'
      );
    }
    if (typeof errorData === 'object') {
      return errorData.msg || errorData.message || JSON.stringify(errorData);
    }
    return String(errorData);
  };

  // ── Safe AsyncStorage parser ────────────────────────────────────────────
  const safeParseRegistrationData = async (): Promise<any | null> => {
    try {
      const raw = await AsyncStorage.getItem('registrationData');
         console.log('RAW registrationData:', raw);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  /**
   * Sends a multipart FormData request using native fetch instead of Axios.
   *
   * WHY NOT AXIOS: On Android, Axios fails to serialize React Native FormData
   * containing file:// URIs for multipart uploads — it throws a silent "Network Error"
   * with no status code. Native fetch uses RN's XMLHttpRequest which handles
   * file:// URIs correctly and is the recommended approach for file uploads in RN.
   */
  const postFormDataWithFetch = async (
    path: string,
    formData: FormData,
  ): Promise<{ status: number; data: any }> => {
   // Set your API base URL here
    const url = `${IP_URL}/api/v1/auth${path}`;
    console.log('Sending multipart to:', url);

    // Do NOT set Content-Type — fetch sets it with the correct boundary automatically
    const response = await fetch(url, { method: 'POST', body: formData });

    let data: any = null;
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    console.log('Multipart response:', response.status, JSON.stringify(data));

    if (!response.ok) {
      const error: any = new Error(`Request failed with status ${response.status}`);
      error.response = { status: response.status, data };
      throw error;
    }
    return { status: response.status, data };
  };

  /**
   * Builds a multipart FormData payload for the registration verification API.
   *
   * HOW IMAGES WORK:
   * 1. Images are stored in AsyncStorage as base64 data URIs (set in Step3).
   * 2. React Native's FormData cannot accept base64 data URIs directly as files.
   * 3. We write each image to a temp file in the cache directory using expo-file-system.
   * 4. We append the temp file:// paths to FormData — RN's native layer reads them.
   * 5. After the request, we delete the temp files.
   *
   * We also do NOT manually set Content-Type. Axios/fetch sets it automatically
   * with the correct multipart boundary string. Setting it manually strips the
   * boundary and causes a server-side parse failure.
   *
   * NOTE: `email` and `phone_number` are ALWAYS both included, regardless of
   * which OTP flow triggered this (email verification or phone verification).
   * The backend User model requires both fields together — previously this
   * function only included one or the other based on `includeEmail`, which
   * caused phone_number to be silently dropped (and saved as NULL) during the
   * email-verification flow. The `includeEmail` parameter is now unused for
   * this purpose but is kept in the signature for backwards compatibility with
   * callers; consider removing it in a later cleanup pass.
   */
  const buildRegistrationFormData = async (
    registrationData: any,
    otpString: string,
    includeEmail: boolean,
  ): Promise<{ formData: FormData; tempFiles: (string | null)[] }> => {
    // Write base64 images to temp files in parallel
    const [frontPath, backPath, selfiePath] = await Promise.all([
      registrationData.idFrontImage
        ? base64ToTempFile(registrationData.idFrontImage, 'front_id.jpg')
        : Promise.resolve(null),
      registrationData.idBackImage
        ? base64ToTempFile(registrationData.idBackImage, 'back_id.jpg')
        : Promise.resolve(null),
      registrationData.selfieImage
        ? base64ToTempFile(registrationData.selfieImage, 'selfie_with_id.jpg')
        : Promise.resolve(null),
    ]);

    const formData = new FormData();

    const dataObject: any = {
      password: registrationData.password,
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      middle_name: registrationData.middleName || null,
      suffix: registrationData.suffix || null,
      age: registrationData.age,
      birthdate: formatDateForBackend(registrationData.dateOfBirth),
      gender: registrationData.gender,
      barangay: registrationData.barangay,
      zip_code: registrationData.zipCode || registrationData.zone || null,
      full_address: registrationData.streetAddress,
      longitude: registrationData.longitude || null,
      latitude: registrationData.latitude || null,
      id_type: registrationData.idType,
      id_number: registrationData.idNumber,
      otp: otpString,
    };

    // Always send both email and phone_number — the backend User model
    // expects both to be populated together, regardless of which OTP flow
    // (email or phone) triggered this verification.
    dataObject.email = registrationData.email;
    dataObject.phone_number = registrationData.phoneNumber;

    formData.append('data', JSON.stringify(dataObject));

    // Append images using the stable temp file:// paths
    if (frontPath) {
      formData.append('front_id', {
        uri: frontPath,
        type: 'image/jpeg',
        name: 'front_id.jpg',
      } as any);
    }
    if (backPath) {
      formData.append('back_id', {
        uri: backPath,
        type: 'image/jpeg',
        name: 'back_id.jpg',
      } as any);
    }
    if (selfiePath) {
      formData.append('selfie_with_id', {
        uri: selfiePath,
        type: 'image/jpeg',
        name: 'selfie_with_id.jpg',
      } as any);
    }

    return { formData, tempFiles: [frontPath, backPath, selfiePath] };
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMessage(t('otpEnterAllDigits'));
      setErrorType('generic');
      return;
    }

    setIsVerifying(true);
    clearErrors();

    try {
      // ── Reset password flow ──────────────────────────────────────────
      if (isResetPassword) {
        const response = await userApiClient.post(`${apiRoute}`, {
          email: await getEmail(),
          otp: otpString,
        });
        if (response.status !== 200) {
          setErrorMessage(t('otpVerificationFailed'));
          setErrorType('generic');
          setIsVerifying(false);
          return;
        }
        router.push({
          pathname: '/(auth)/ResetPassword',
          params: { email: await getEmail() },
        });

      // ── Phone OTP flow ───────────────────────────────────────────────
      } else if (isPhoneMode) {
        const registrationData = await safeParseRegistrationData();
        if (!registrationData) {
          setErrorMessage(t('otpRegistrationDataNotFound'));
          setErrorType('generic');
          setIsVerifying(false);
          return;
        }

        const { formData, tempFiles } = await buildRegistrationFormData(
          registrationData,
          otpString,
          false,
        );

        try {
          // Use native fetch instead of Axios for multipart — Axios fails on Android with file:// URIs
          const response = await postFormDataWithFetch('/verify-phone-number-otp', formData);
          if (response.status === 200 || response.status === 201) {
            await AsyncStorage.removeItem('registrationData');
            router.push('/(auth)/NotVerified');
          }
        } finally {
          // Always clean up temp files, success or failure
          await cleanupTempFiles(tempFiles);
        }

      // ── Email OTP flow ───────────────────────────────────────────────
      } else {
        const registrationData = await safeParseRegistrationData();
        if (!registrationData) {
          setErrorMessage(t('otpRegistrationDataNotFound'));
          setErrorType('generic');
          setIsVerifying(false);
          return;
        }

        const { formData, tempFiles } = await buildRegistrationFormData(
          registrationData,
          otpString,
          true,
        );

        try {
          // Use native fetch instead of Axios for multipart — Axios fails on Android with file:// URIs
          const response = await postFormDataWithFetch('/verify-otp', formData);
          if (response.status === 200 || response.status === 201) {
            await AsyncStorage.removeItem('registrationData');
            router.push('/(auth)/NotVerified');
          }
        } finally {
          // Always clean up temp files, success or failure
          await cleanupTempFiles(tempFiles);
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 400) {
        const detail = extractErrorMessage(err?.response?.data?.detail);
        if (detail.includes('expired') || detail.includes('not found')) {
          setErrorMessage(t('otpExpired'));
          setErrorType('expired_otp');
          setOtp(['', '', '', '', '', '']);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else if (detail.includes('Invalid OTP')) {
          setErrorMessage(t('otpIncorrect'));
          setErrorType('invalid_otp');
        } else if (detail.includes('ID images')) {
          setErrorMessage(t('otpIdImagesRequired'));
          setErrorType('validation');
        } else if (
          detail.includes('birthdate') ||
          detail.includes('datetime') ||
          detail.includes('date')
        ) {
          setErrorMessage(t('otpInvalidDate'));
          setErrorType('validation');
        } else {
          setErrorMessage(detail || t('otpVerificationFailed'));
          setErrorType('generic');
        }
      } else if (status === 422) {
        const detail = extractErrorMessage(err?.response?.data?.detail);
        setErrorMessage(detail || t('otpValidationError'));
        setErrorType('validation');
      } else if (status >= 500) {
        setErrorMessage(t('otpServerError'));
        setErrorType('server');
      } else if (
        err?.code === 'ECONNABORTED' ||
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error'
      ) {
        setNetworkError(t('otpNetworkError'));
      } else if (err?.code === 'ETIMEDOUT') {
        setNetworkError(t('otpRequestTimeout'));
      } else {
        const msg = extractErrorMessage(
          err?.response?.data?.detail || err?.response?.data?.message,
        );
        setErrorMessage(msg || t('otpVerificationFailed'));
        setErrorType('generic');
      }
    } finally {
      setIsVerifying(false);
    }
  };

const handleBack = async () => {
  if (!isResetPassword) {
    try {
      await AsyncStorage.removeItem('registrationData');
    } catch {
      // best-effort cleanup, don't block navigation on it
    }
  }
  if (navigation) navigation.goBack();
  else router.back();
};

  // ── Masking helpers ─────────────────────────────────────────────────────
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const maskPhone = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 6) return phoneNumber;
    return digits.slice(0, 4) + '****' + digits.slice(-2);
  };

  const getInputStyle = (digit: string, isFocused: boolean) => {
    const hasOtpError = errorType === 'invalid_otp' || errorType === 'expired_otp';
    if (hasOtpError)
      return { borderColor: '#DC2626', backgroundColor: '#FEF2F2', color: '#B91C1C' };
    if (isFocused)
      return {
        borderColor: THEME.primary,
        backgroundColor: THEME.primary + '10',
        color: THEME.primary,
      };
    if (digit)
      return {
        borderColor: THEME.primary,
        backgroundColor: THEME.primary + '10',
        color: THEME.primary,
      };
    return { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#111827' };
  };

  const errorConfig = {
    invalid_otp: {
      containerStyle: { backgroundColor: '#FEF2F2', borderColor: '#F87171' },
      textStyle: { color: '#991B1B' },
      iconColor: '#DC2626',
      Icon: AlertCircle,
    },
    expired_otp: {
      containerStyle: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
      textStyle: { color: '#92400E' },
      iconColor: '#D97706',
      Icon: Clock,
    },
    server: {
      containerStyle: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
      textStyle: { color: '#92400E' },
      iconColor: '#D97706',
      Icon: ShieldAlert,
    },
    validation: {
      containerStyle: { backgroundColor: '#FFF7ED', borderColor: '#FB923C' },
      textStyle: { color: '#9A3412' },
      iconColor: '#EA580C',
      Icon: AlertCircle,
    },
    generic: {
      containerStyle: { backgroundColor: '#FEF2F2', borderColor: '#F87171' },
      textStyle: { color: '#991B1B' },
      iconColor: '#DC2626',
      Icon: AlertCircle,
    },
  };

  const activeError = errorType ? errorConfig[errorType] : null;
  const isAboveCardError = errorType === 'server' || errorType === 'validation';
  const isInsideCardError =
    errorType === 'invalid_otp' || errorType === 'expired_otp' || errorType === 'generic';

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-2">
            <TouchableOpacity
              onPress={handleBack}
              className="flex-row items-center mb-6"
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="#1F2937" />
              <Text className="text-neutral-800 text-base font-medium ml-2">{t('back')}</Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 flex-1">
            {/* Icon + title */}
            <View className="items-center mb-8">
              <View
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: THEME.primary }}
              >
                {isPhoneMode ? (
                  <Phone size={32} color="#FFFFFF" />
                ) : (
                  <Mail size={32} color="#FFFFFF" />
                )}
              </View>

              <Text className="text-neutral-900 text-2xl font-bold text-center mb-2">
                {isPhoneMode
                  ? t('verifyYourPhone') || 'Verify Your Phone'
                  : t('verifyYourEmail')}
              </Text>

              <Text className="text-neutral-600 text-base text-center leading-6">
                {isPhoneMode
                  ? t('otpSentMessagePhone') || 'We sent a 6-digit code to'
                  : t('otpSentMessage')}
              </Text>

              <Text
                className="text-base font-semibold text-center mt-1"
                style={{ color: THEME.primary }}
              >
                {isPhoneMode ? maskPhone(phone) : maskEmail(email)}
              </Text>
            </View>

            {/* Network Error banner */}
            {networkError ? (
              <View className="bg-error-50 border border-error-400 rounded-xl p-4 mb-4 flex-row items-start">
                <WifiOff size={18} color="#DC2626" />
                <Text className="text-sm text-error-800 flex-1 ml-2.5 leading-5">
                  {networkError}
                </Text>
              </View>
            ) : null}

            {/* Above-card errors */}
            {errorMessage && isAboveCardError && activeError ? (
              <View
                className="border rounded-xl p-4 mb-4 flex-row items-start"
                style={activeError.containerStyle}
              >
                <activeError.Icon size={18} color={activeError.iconColor} />
                <Text className="text-sm ml-2.5 flex-1 leading-5" style={activeError.textStyle}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* OTP Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
              <Text className="text-neutral-700 text-sm font-medium text-center mb-4">
                {t('enterVerificationCode')}
              </Text>

              {/* OTP Inputs */}
              <View className="flex-row justify-between mb-4">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className="w-12 h-14 border-2 rounded-xl text-center text-xl font-bold"
                    style={[
                      { textAlignVertical: 'center' },
                      getInputStyle(digit, focusedIndex === index),
                    ]}
                  />
                ))}
              </View>

              {/* Inside-card errors */}
              {errorMessage && isInsideCardError && activeError ? (
                <View
                  className="flex-row items-start rounded-xl p-3.5 mb-4 border"
                  style={activeError.containerStyle}
                >
                  <activeError.Icon
                    size={16}
                    color={activeError.iconColor}
                    style={{ marginTop: 1 }}
                  />
                  <Text className="text-sm ml-2 flex-1 leading-5" style={activeError.textStyle}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* Resend */}
              <View className="items-center">
                <Text className="text-neutral-600 text-sm mb-2">{t("didn'tReceiveCode")}</Text>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                    <Text className="text-sm font-semibold" style={{ color: THEME.primary }}>
                      {t('resendOTP')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-neutral-500 text-sm">
                    {t('resendIn')} {Math.floor(resendTimer / 60)}:
                    {String(resendTimer % 60).padStart(2, '0')}
                  </Text>
                )}
              </View>
            </View>

            {/* Info notice */}
            <View
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: THEME.primary + '20' }}
            >
              <View className="flex-row items-start">
                <View
                  className="rounded-full p-1 mr-3 mt-0.5"
                  style={{ backgroundColor: THEME.primary }}
                >
                  <CheckCircle size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: THEME.primary }}
                  >
                    {t('importantNotice')}
                  </Text>
                  <Text className="text-sm leading-5" style={{ color: THEME.primary }}>
                    {t('otpVerificationNotice')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={isVerifying || otp.join('').length !== 6}
              className="rounded-xl py-4 items-center shadow-sm mb-6"
              style={{
                backgroundColor:
                  isVerifying || otp.join('').length !== 6 ? '#D1D5DB' : THEME.primary,
              }}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">{t('verifyOTP')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}