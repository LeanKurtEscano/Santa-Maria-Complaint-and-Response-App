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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle, WifiOff, ShieldAlert, CheckCircle } from 'lucide-react-native';
import { userApiClient } from '@/lib/client/user';
import { THEME } from '@/constants/theme';

type ErrorType = 'mismatch' | 'server' | 'validation' | 'generic' | null;

export default function ResetPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [networkError, setNetworkError] = useState('');

  const clearErrors = () => {
    setErrorMessage('');
    setErrorType(null);
    setNetworkError('');
  };

  const isStrongPassword = (value: string) =>
    value.length >= 8;

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (errorType) clearErrors();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errorType) clearErrors();
  };

  const handleSubmit = async () => {
    if (!newPassword.trim()) {
      setErrorMessage(t('resetPasswordNewRequired') || 'Please enter a new password.');
      setErrorType('validation');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setErrorMessage(t('resetPasswordTooShort') || 'Password must be at least 8 characters.');
      setErrorType('validation');
      return;
    }

    if (!confirmPassword.trim()) {
      setErrorMessage(t('resetPasswordConfirmRequired') || 'Please confirm your new password.');
      setErrorType('validation');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('resetPasswordMismatch') || 'Passwords do not match.');
      setErrorType('mismatch');
      return;
    }

    setIsLoading(true);
    clearErrors();

    try {
      await userApiClient.post('/create-new-password', {
        email,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });

      router.replace('/(auth)');
    } catch (err: any) {
      const status = err?.response?.status;

      if (
        err?.code === 'ECONNABORTED' ||
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error'
      ) {
        setNetworkError(
          t('resetPasswordNetworkError') ||
          'No internet connection. Please check your network and try again.'
        );
      } else if (err?.code === 'ETIMEDOUT') {
        setNetworkError(
          t('resetPasswordTimeout') ||
          'Request timed out. Please try again.'
        );
      } else if (status === 400) {
        const detail = err?.response?.data?.detail || '';
        if (detail.toLowerCase().includes('do not match')) {
          setErrorMessage(t('resetPasswordMismatch') || 'Passwords do not match.');
          setErrorType('mismatch');
        } else if (detail.toLowerCase().includes('otp verification pending')) {
          setErrorMessage(
            t('resetPasswordOtpPending') ||
            'OTP verification is still pending. Please verify your email first.'
          );
          setErrorType('validation');
        } else {
          setErrorMessage(detail || t('resetPasswordFailed') || 'Failed to reset password.');
          setErrorType('generic');
        }
      } else if (status === 404) {
        setErrorMessage(
          t('resetPasswordUserNotFound') ||
          'No account found with this email address.'
        );
        setErrorType('generic');
      } else if (status >= 500) {
        setErrorMessage(
          t('resetPasswordServerError') ||
          'Something went wrong on our end. Please try again later.'
        );
        setErrorType('server');
      } else {
        setErrorMessage(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          t('resetPasswordFailed') ||
          'Failed to reset password. Please try again.'
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
    mismatch: {
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
  const isAboveCardError = errorType === 'server';

  const getInputBorderClass = (value: string, isError: boolean) => {
    if (isError) return 'border-error-500 bg-error-50';
    if (value) return 'border-primary-600 bg-primary-50';
    return 'border-neutral-300 bg-white';
  };

  const newPasswordError = errorType === 'validation' || errorType === 'mismatch';
  const confirmPasswordError = errorType === 'mismatch';

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
                <Lock size={32} color="#FFFFFF" />
              </View>
              <Text className="text-neutral-900 text-2xl font-bold text-center mb-2">
                {t('resetPasswordTitle') || 'Create New Password'}
              </Text>
              <Text className="text-neutral-600 text-base text-center leading-6">
                {t('resetPasswordSubtitle') ||
                  'Your new password must be different from your previous password.'}
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
            {errorMessage && isAboveCardError && activeError ? (
              <View className={`border rounded-xl p-4 mb-4 flex-row items-start ${activeError.containerClass}`}>
                <activeError.Icon size={18} color={activeError.iconColor} />
                <Text className={`text-sm ml-2.5 flex-1 leading-5 ${activeError.textClass}`}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Password Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">

              {/* New Password */}
              <Text className="text-neutral-700 text-sm font-medium mb-2">
                {t('newPassword') || 'New Password'}
              </Text>
              <View className={`flex-row items-center border-2 rounded-xl px-4 mb-4 ${getInputBorderClass(newPassword, newPasswordError)}`}>
                <TextInput
                  value={newPassword}
                  onChangeText={handleNewPasswordChange}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t('newPasswordPlaceholder') || 'Enter new password'}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 py-3.5 text-base text-neutral-900"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                  className="ml-2"
                >
                  {showNewPassword
                    ? <EyeOff size={20} color="#6B7280" />
                    : <Eye size={20} color="#6B7280" />
                  }
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text className="text-neutral-700 text-sm font-medium mb-2">
                {t('confirmNewPassword') || 'Confirm New Password'}
              </Text>
              <View className={`flex-row items-center border-2 rounded-xl px-4 mb-4 ${getInputBorderClass(confirmPassword, confirmPasswordError)}`}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t('confirmPasswordPlaceholder') || 'Confirm new password'}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 py-3.5 text-base text-neutral-900"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  className="ml-2"
                >
                  {showConfirmPassword
                    ? <EyeOff size={20} color="#6B7280" />
                    : <Eye size={20} color="#6B7280" />
                  }
                </TouchableOpacity>
              </View>

              {/* Inline errors (non-server) */}
              {errorMessage && !isAboveCardError && activeError ? (
                <View className={`flex-row items-start rounded-xl p-3.5 mb-2 border border-red-500 ${activeError.containerClass}`}>
                  <activeError.Icon size={16} color={activeError.iconColor} style={{ marginTop: 1 }} />
                  <Text className={`text-sm ml-2 flex-1 leading-5 ${activeError.textClass}`}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Password hint notice */}
            <View style={{ backgroundColor: `${THEME.primary}15` }} className="rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <View style={{ backgroundColor: THEME.primary }} className="rounded-full p-1 mr-3 mt-0.5">
                  <CheckCircle size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text style={{ color: THEME.primary }} className="text-sm font-semibold mb-1">
                    {t('passwordRequirements') || 'Password Requirements'}
                  </Text>
                  <Text className="text-neutral-700 text-sm leading-5">
                    {t('passwordRequirementsDetail') ||
                      'Must be at least 8 characters long.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
              style={
                !(isLoading || !newPassword.trim() || !confirmPassword.trim())
                  ? { backgroundColor: THEME.primary }
                  : undefined
              }
              className={`rounded-xl py-4 items-center shadow-sm mb-6 ${
                isLoading || !newPassword.trim() || !confirmPassword.trim()
                  ? 'bg-neutral-300'
                  : ''
              }`}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {t('resetPassword') || 'Reset Password'}
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