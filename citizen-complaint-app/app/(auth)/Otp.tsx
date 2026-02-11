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
import { ArrowLeft, Mail, AlertCircle, CheckCircle, WifiOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApiClient } from '@/lib/client/user';

interface OTPVerificationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      email?: string;
      phoneNumber?: string;
    };
  };
}

export default function OTPVerificationScreen({ navigation, route }: OTPVerificationScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const email = route?.params?.email || '';
  const phoneNumber = route?.params?.phoneNumber || '';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    setNetworkError('');

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

    setError('');
    setNetworkError('');

    try {
      await authApiClient.post('/register', {
        email: email,
      });

      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        setNetworkError('Network error. Please check your connection and try again.');
      } else if (err?.code === 'ETIMEDOUT') {
        setNetworkError('Request timed out. Please try again.');
      } else {
        setError(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to resend OTP. Please try again.');
      }
    }
  };

  // Helper function to convert date from MM/DD/YYYY to YYYY-MM-DD
  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return '';
    
    // Check if already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Convert from DD/MM/YYYY to YYYY-MM-DD (if that's your format)
    // Uncomment this if your dates are in DD/MM/YYYY format instead
    // if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    //   const [day, month, year] = dateString.split('/');
    //   return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    // }
    
    return dateString;
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');
    setNetworkError('');

    try {
      const registrationDataString = await AsyncStorage.getItem('registrationData');
      
      if (!registrationDataString) {
        setError('Registration data not found. Please register again.');
        setIsVerifying(false);
        return;
      }

      const registrationData = JSON.parse(registrationDataString);

      const formData = new FormData();

      // Match backend field names exactly and format birthdate
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

      // Append image files with backend field names
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Clear registration data after successful verification
      await AsyncStorage.removeItem('registrationData');

      // Navigate to home/tabs
      router.push('/(tabs)');

    } catch (err: any) {
      // Handle specific backend error messages
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        
        if (errorDetail.includes('expired') || errorDetail.includes('not found')) {
          setError('OTP expired or not found. Please request a new one.');
        } else if (errorDetail.includes('Invalid OTP')) {
          setError('Invalid OTP. Please try again.');
        } else if (errorDetail.includes('ID images')) {
          setError('All ID images (front, back, selfie with ID) are required.');
        } else if (errorDetail.includes('birthdate') || errorDetail.includes('datetime')) {
          setError('Invalid date format. Please check your birth date.');
        } else {
          setError(errorDetail || 'Verification failed. Please try again.');
        }
      }
      // Network errors
      else if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        setNetworkError('Network error. Please check your connection and try again.');
      }
      // Timeout errors
      else if (err?.code === 'ETIMEDOUT') {
        setNetworkError('Request timed out. Please try again.');
      }
      // Generic errors
      else {
        setError(err?.response?.data?.detail || err?.response?.data?.message || 'Verification failed. Please try again.');
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
          {/* Header with Back Button */}
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
            {/* Official Government Header */}
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

            {/* Network Error Alert */}
            {networkError && (
              <View className="bg-error-50 border border-error-500 rounded-xl p-4 mb-6 flex-row items-start">
                <View className="mr-3 flex-shrink-0">
                  <WifiOff size={20} color="#EF4444" />
                </View>
                <Text className="text-sm text-error-600 flex-1 leading-5">
                  {networkError}
                </Text>
              </View>
            )}

            {/* OTP Input Section */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
              <Text className="text-neutral-700 text-sm font-medium text-center mb-4">
                {t('enterVerificationCode')}
              </Text>

              {/* OTP Input Boxes */}
              <View className="flex-row justify-between mb-6">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${
                      error
                        ? 'border-error-500 bg-error-50 text-error-700'
                        : digit
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-neutral-300 bg-white text-neutral-900'
                    }`}
                    style={{ textAlignVertical: 'center' }}
                  />
                ))}
              </View>

              {/* Error Message */}
              {error && (
                <View className="flex-row items-center bg-error-50 border border-gray-100 rounded-lg p-3 mb-4">
                  <AlertCircle size={20} color="#DC2626" />
                  <Text className="text-error-700 text-sm ml-2 flex-1">{error}</Text>
                </View>
              )}

              {/* Resend OTP */}
              <View className="items-center">
                <Text className="text-neutral-600 text-sm mb-2">
                  {t("didn'tReceiveCode")}
                </Text>
                {canResend ? (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    activeOpacity={0.7}
                  >
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

            {/* Information Notice */}
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