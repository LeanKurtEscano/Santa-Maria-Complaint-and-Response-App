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
import { ArrowLeft, Mail, AlertCircle, CheckCircle, WifiOff, Clock, ShieldAlert } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApiClient } from '@/lib/client/user';

interface OTPVerificationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      otpResendRoute?: string;
      successRoute?: string;
      apiRoute?: string;
      email?: string;
      phoneNumber?: string;
    };
  };
}

type ErrorType = 'invalid_otp' | 'expired_otp' | 'server' | 'validation' | 'generic' | null;

export default function OTPVerificationScreen({ navigation, route }: OTPVerificationScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [networkError, setNetworkError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const email = route?.params?.email || '';
  const apiRoute = route?.params?.apiRoute;
  const isResetPassword = apiRoute === 'verify-reset-password-otp';

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

    if (errorType === 'invalid_otp' || errorType === 'expired_otp') {
      clearErrors();
    }

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    clearErrors();
    try {
      await authApiClient.post(route?.params?.otpResendRoute || '/register', { email });
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        setNetworkError(t('otpResendNetworkError'));
      } else if (err?.code === 'ETIMEDOUT') {
        setNetworkError(t('otpResendTimeout'));
      } else {
        setErrorMessage(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          t('otpResendFailed')
        );
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
      if (isResetPassword) {
        
        const response = await authApiClient.post(`/${apiRoute}`, { email, otp: otpString });
        if (response.status !== 200) {
          setErrorMessage(t('otpVerificationFailed'));
          setErrorType('generic');
          setIsVerifying(false);
          return;
        }
        router.push({
          pathname: '/(auth)/ResetPassword',
          params: { email },
        });
      } else {
       
        const registrationDataString = await AsyncStorage.getItem('registrationData');
        if (!registrationDataString) {
          setErrorMessage(t('otpRegistrationDataNotFound'));
          setErrorType('generic');
          setIsVerifying(false);
          return;
        }

        const registrationData = JSON.parse(registrationDataString);
        const formData = new FormData();

        const dataObject = {
          email: registrationData.email,
          password: registrationData.password,
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
          middle_name: registrationData.middleName || null,
          suffix: registrationData.suffix || null,
          age: registrationData.age,
          birthdate: formatDateForBackend(registrationData.dateOfBirth),
          phone_number: registrationData.phoneNumber,
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

        formData.append('data', JSON.stringify(dataObject));

        if (registrationData.idFrontImage) {
          formData.append('front_id', {
            uri: registrationData.idFrontImage,
            type: 'image/jpeg',
            name: 'front_id.jpg',
          } as any);
        }
        if (registrationData.idBackImage) {
          formData.append('back_id', {
            uri: registrationData.idBackImage,
            type: 'image/jpeg',
            name: 'back_id.jpg',
          } as any);
        }
        if (registrationData.selfieImage) {
          formData.append('selfie_with_id', {
            uri: registrationData.selfieImage,
            type: 'image/jpeg',
            name: 'selfie_with_id.jpg',
          } as any);
        }

        const response = await authApiClient.post('/verify-otp', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.status === 201) {
          await AsyncStorage.removeItem('registrationData');
        }

        router.push('/(auth)');
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

        } else if (detail.includes('birthdate') || detail.includes('datetime') || detail.includes('date')) {
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
          err?.response?.data?.detail || err?.response?.data?.message
        );
        setErrorMessage(msg || t('otpVerificationFailed'));
        setErrorType('generic');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    } else {
      router.back();
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const getInputClassName = (digit: string) => {
    const hasOtpError = errorType === 'invalid_otp' || errorType === 'expired_otp';
    if (hasOtpError) return 'border-error-500 bg-error-50 text-error-700';
    if (digit) return 'border-primary-600 bg-primary-50 text-primary-700';
    return 'border-neutral-300 bg-white text-neutral-900';
  };

  const errorConfig = {
    invalid_otp: {
      containerClass: 'bg-error-50 border-error-400',
      textClass: 'text-error-800',
      iconColor: '#DC2626',
      Icon: AlertCircle,
    },
    expired_otp: {
      containerClass: 'bg-amber-50 border-amber-400',
      textClass: 'text-amber-800',
      iconColor: '#D97706',
      Icon: Clock,
    },
    server: {
      containerClass: 'bg-amber-50 border-amber-400',
      textClass: 'text-amber-800',
      iconColor: '#D97706',
      Icon: ShieldAlert,
    },
    validation: {
      containerClass: 'bg-orange-50 border-orange-400',
      textClass: 'text-orange-800',
      iconColor: '#EA580C',
      Icon: AlertCircle,
    },
    generic: {
      containerClass: 'bg-error-50 border-error-400',
      textClass: 'text-error-800',
      iconColor: '#DC2626',
      Icon: AlertCircle,
    },
  };

  const activeError = errorType ? errorConfig[errorType] : null;
  const isAboveCardError = errorType === 'server' || errorType === 'validation';
  const isInsideCardError = errorType === 'invalid_otp' || errorType === 'expired_otp' || errorType === 'generic';

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
              <Text className="text-neutral-800 text-base font-medium ml-2">
                {t('back')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 flex-1">
            {/* Icon + title */}
            <View className="items-center mb-8">
              <View className="bg-primary-600 rounded-full p-4 mb-4">
                <Mail size={32} color="#FFFFFF" />
              </View>
              <Text className="text-neutral-900 text-2xl font-bold text-center mb-2">
                {t('verifyYourEmail')}
              </Text>
              <Text className="text-neutral-600 text-base text-center leading-6">
                {t('otpSentMessage')}
              </Text>
              <Text className="text-primary-600 text-base font-semibold text-center mt-1">
                {maskEmail(email)}
              </Text>
            </View>

            {/* Network Error banner */}
            {networkError ? (
              <View className="bg-error-50 border border-error-400 rounded-xl p-4 mb-4 flex-row items-start">
                <WifiOff size={18} color="#DC2626" />
                <Text className="text-sm text-error-800 flex-1 ml-2.5 leading-5">{networkError}</Text>
              </View>
            ) : null}

            {/* Above-card errors (server / validation) */}
            {errorMessage && isAboveCardError && activeError ? (
              <View className={`border rounded-xl p-4 mb-4 flex-row items-start ${activeError.containerClass}`}>
                <activeError.Icon size={18} color={activeError.iconColor} />
                <Text className={`text-sm ml-2.5 flex-1 leading-5 ${activeError.textClass}`}>
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
                    keyboardType="number-pad"
                    maxLength={1}
                    className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${getInputClassName(digit)}`}
                    style={{ textAlignVertical: 'center' }}
                  />
                ))}
              </View>

              {/* Inside-card errors (invalid_otp / expired_otp / generic) */}
              {errorMessage && isInsideCardError && activeError ? (
                <View className={`flex-row items-start rounded-xl p-3.5 mb-4 border border-red-500 ${activeError.containerClass}`}>
                  <activeError.Icon size={16} color={activeError.iconColor} style={{ marginTop: 1 }} />
                  <Text className={`text-sm ml-2 flex-1 leading-5 ${activeError.textClass}`}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* Resend */}
              <View className="items-center">
                <Text className="text-neutral-600 text-sm mb-2">
                  {t("didn'tReceiveCode")}
                </Text>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                    <Text className="text-primary-600 text-sm font-semibold">
                      {t('resendOTP')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-neutral-500 text-sm">
                    {t('resendIn')} {resendTimer}s
                  </Text>
                )}
              </View>
            </View>

            {/* Info notice */}
            <View className="bg-primary-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <View className="bg-primary-600 rounded-full p-1 mr-3 mt-0.5">
                  <CheckCircle size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary-900 text-sm font-semibold mb-1">
                    {t('importantNotice')}
                  </Text>
                  <Text className="text-primary-800 text-sm leading-5">
                    {t('otpVerificationNotice')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={isVerifying || otp.join('').length !== 6}
              className={`rounded-xl py-4 items-center shadow-sm mb-6 ${
                isVerifying || otp.join('').length !== 6
                  ? 'bg-neutral-300'
                  : 'bg-primary-600'
              }`}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {t('verifyOTP')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}