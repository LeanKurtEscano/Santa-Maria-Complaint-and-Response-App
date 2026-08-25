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
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Clock,
  ShieldAlert,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { authApiClient } from '@/lib/client/user';
import { THEME } from '@/constants/theme';
import { useCurrentUser } from '@/store/useCurrentUserStore';

// Keep these keys identical to the ones used in LoginScreen so both
// screens read/write the same SecureStore entries.
const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'complaint_token',
  REFRESH_TOKEN: 'complaint_refresh_token',
  PENDING_EMAIL: 'pending_verify_email',
};

// Adjust these to match your actual backend routes.
const VERIFY_DEVICE_ROUTE = '/verify-device-otp';
const RESEND_DEVICE_OTP_ROUTE = '/resend-device-otp';

type ErrorType = 'invalid_otp' | 'expired_otp' | 'server' | 'validation' | 'generic' | null;

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

export default function VerifyDeviceScreen({ navigation }: any) {
  const router = useRouter();
  const { t } = useTranslation();
  const { fetchCurrentUser } = useCurrentUser();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [networkError, setNetworkError] = useState('');
  const [resendTimer, setResendTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Pulled from SecureStore — set by LoginScreen when it detects
  // `is_verified === false` on the /login or /login/google response.
  // Works for both normal and Google login: the backend's
  // verify-device-otp endpoint only needs email + otp, no password.
  const [email, setEmail] = useState('');
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Load pending email stashed by LoginScreen ────────────────────────────
  useEffect(() => {
    const loadPendingEmail = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync(SECURE_STORE_KEYS.PENDING_EMAIL);

        if (!storedEmail) {
          // Nothing to verify — bounce back to login.
          router.replace('/(auth)/Login');
          return;
        }

        setEmail(storedEmail);
      } finally {
        setLoadingCredentials(false);
      }
    };

    loadPendingEmail();
  }, []);

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
    if (!canResend || !email) return;
    clearErrors();
    try {
      // Backend's OTP endpoints use Form(...) params, so send as
      // form-encoded data rather than JSON. Adjust if your
      // /resend-device-otp route expects a different content type.
      const formBody = new URLSearchParams();
      formBody.append('email', email);

      await authApiClient.post(RESEND_DEVICE_OTP_ROUTE, formBody.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
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

  // ── Verify OTP ──────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMessage(t('otpEnterAllDigits'));
      setErrorType('generic');
      return;
    }

    if (!email) {
      setErrorMessage(t('otpVerificationFailed'));
      setErrorType('generic');
      return;
    }

    setIsVerifying(true);
    clearErrors();

    try {
      // Backend route: verify_device_otp_endpoint(email: str = Form(...), otp: str = Form(...))
      // expects form-encoded data, not JSON.
      const formBody = new URLSearchParams();
      formBody.append('email', email);
      formBody.append('otp', otpString);

      const { data } = await authApiClient.post(VERIFY_DEVICE_ROUTE, formBody.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Success: device is now verified — finish logging the user in.
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, data.access_token);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, data.refresh_token);

      // Clear the pending email now that it's done its job.
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PENDING_EMAIL);

      // Pull the authenticated user's data into the store.
      await fetchCurrentUser();
      await useCurrentUser.getState().syncPushToken();

      router.replace('/(tabs)');
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 400) {
        const detail = extractErrorMessage(err?.response?.data?.detail);
        if (detail.includes('expired') || detail.includes('not found')) {
          setErrorMessage(t('otpExpired'));
          setErrorType('expired_otp');
          setOtp(['', '', '', '', '', '']);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else if (detail.includes('Incorrect OTP')) {
          setErrorMessage(t('otpIncorrect'));
          setErrorType('invalid_otp');
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
    // Abandoning device verification — drop the stashed email.
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PENDING_EMAIL);

    if (navigation) navigation.goBack();
    else router.back();
  };

  // ── Masking helper ───────────────────────────────────────────────────────
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
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

  if (loadingCredentials) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color={THEME.primary} />
      </SafeAreaView>
    );
  }

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
                <ShieldCheck size={32} color="#FFFFFF" />
              </View>

              <Text className="text-neutral-900 text-2xl font-bold text-center mb-2">
                {t('verifyYourDevice') || 'Verify This Device'}
              </Text>

              <Text className="text-neutral-600 text-base text-center leading-6">
                {t('otpSentMessage')}
              </Text>

              <Text
                className="text-base font-semibold text-center mt-1"
                style={{ color: THEME.primary }}
              >
                {maskEmail(email)}
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