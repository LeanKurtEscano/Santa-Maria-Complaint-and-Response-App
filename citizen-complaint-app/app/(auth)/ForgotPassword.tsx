import React, { useState } from 'react';
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
import { ArrowLeft, Mail, AlertCircle, WifiOff, ShieldAlert } from 'lucide-react-native';
import { userApiClient } from '@/lib/client/user';
import { THEME } from '@/constants/theme';
type ErrorType = 'not_found' | 'server' | 'validation' | 'generic' | null;

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [networkError, setNetworkError] = useState('');

  const clearErrors = () => {
    setErrorMessage('');
    setErrorType(null);
    setNetworkError('');
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errorType) clearErrors();
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage(t('forgotPasswordEmailRequired') || 'Please enter your email address.');
      setErrorType('validation');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setErrorMessage(t('forgotPasswordEmailInvalid') || 'Please enter a valid email address.');
      setErrorType('validation');
      return;
    }

    setIsLoading(true);
    clearErrors();

    try {
      await userApiClient.post('/request-reset-password', { email: email.trim() });

     router.replace({ pathname: '/(auth)/Otp', params: { email: email, apiRoute: '/verify-reset-password-otp' } });
    } catch (err: any) {
      const status = err?.response?.status;

      if (
        err?.code === 'ECONNABORTED' ||
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error'
      ) {
        setNetworkError(
          t('forgotPasswordNetworkError') ||
          'No internet connection. Please check your network and try again.'
        );
      } else if (err?.code === 'ETIMEDOUT') {
        setNetworkError(
          t('forgotPasswordTimeout') ||
          'Request timed out. Please try again.'
        );
      } else if (status === 404) {
        setErrorMessage(
          t('forgotPasswordNotFound') ||
          'No account found with this email address.'
        );
        setErrorType('not_found');
      } else if (status === 422) {
        setErrorMessage(
          err?.response?.data?.detail ||
          t('forgotPasswordValidationError') ||
          'Invalid email format.'
        );
        setErrorType('validation');
      } else if (status >= 500) {
        setErrorMessage(
          t('forgotPasswordServerError') ||
          'Something went wrong on our end. Please try again later.'
        );
        setErrorType('server');
      } else {
        setErrorMessage(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          t('forgotPasswordFailed') ||
          'Failed to send reset code. Please try again.'
        );
        setErrorType('generic');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const errorConfig: Record<
    NonNullable<ErrorType>,
    { containerClass: string; textClass: string; iconColor: string; Icon: any }
  > = {
    not_found: {
      containerClass: 'bg-error-50 border-error-400',
      textClass: 'text-error-800',
      iconColor: '#DC2626',
      Icon: AlertCircle,
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

  const inputBorderClass = errorType === 'not_found' || errorType === 'validation'
    ? 'border-error-500 bg-error-50'
    : email
    ? 'border-primary-600 bg-primary-50'
    : 'border-neutral-300 bg-white';

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
              onPress={() => router.back()}
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
            {/* Icon + Title */}
            <View className="items-center mb-8">
              <View style={{ backgroundColor: THEME.primary }} className="rounded-full p-4 mb-4">
                <Mail size={32} color="#FFFFFF" />
              </View>
              <Text className="text-neutral-900 text-2xl font-bold text-center mb-2">
                {t('forgotPasswordTitle') || 'Forgot Password?'}
              </Text>
              <Text className="text-neutral-600 text-base text-center leading-6">
                {t('forgotPasswordSubtitle') ||
                  "Enter your email address and we'll send you a verification code to reset your password."}
              </Text>
            </View>

            {/* Network Error */}
            {networkError ? (
              <View className="bg-error-50 border border-error-400 rounded-xl p-4 mb-4 flex-row items-start">
                <WifiOff size={18} color="#DC2626" />
                <Text className="text-sm text-error-800 flex-1 ml-2.5 leading-5">
                  {networkError}
                </Text>
              </View>
            ) : null}

            {/* Server error above card */}
            {errorMessage && errorType === 'server' && activeError ? (
              <View className={`border rounded-xl p-4 mb-4 flex-row items-start ${activeError.containerClass}`}>
                <activeError.Icon size={18} color={activeError.iconColor} />
                <Text className={`text-sm ml-2.5 flex-1 leading-5 ${activeError.textClass}`}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Email Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
              <Text className="text-neutral-700 text-sm font-medium mb-2">
                {t('emailAddress') || 'Email Address'}
              </Text>

              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t('emailPlaceholder') || 'Enter your email address'}
                placeholderTextColor="#9CA3AF"
                className={`border-2 rounded-xl px-4 py-3.5 text-base text-neutral-900 mb-4 ${inputBorderClass}`}
                editable={!isLoading}
              />

              {/* Inline errors (not_found / validation / generic) */}
              {errorMessage && errorType !== 'server' && activeError ? (
                <View className={`flex-row items-start rounded-xl p-3.5 mb-2 border border-red-500 ${activeError.containerClass}`}>
                  <activeError.Icon size={16} color={activeError.iconColor} style={{ marginTop: 1 }} />
                  <Text className={`text-sm ml-2 flex-1 leading-5 ${activeError.textClass}`}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || !email.trim()}
              style={!(isLoading || !email.trim()) ? { backgroundColor: THEME.primary } : undefined}
              className={`rounded-xl py-4 items-center shadow-sm mb-6 ${
                isLoading || !email.trim() ? 'bg-neutral-300' : ''
              }`}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {t('sendResetCode') || 'Send Reset Code'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to login */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={() => router.push('/(auth)')}
                activeOpacity={0.7}
              >
                <Text className="text-neutral-600 text-sm">
                  {t('rememberPassword') || 'Remember your password? '}
                  <Text style={{ color: THEME.primary }} className="font-semibold">
                    {t('signIn') || 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}