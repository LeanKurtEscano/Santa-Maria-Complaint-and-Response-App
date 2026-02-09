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
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react-native';
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
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const email = route?.params?.email || '';
  const phoneNumber = route?.params?.phoneNumber || '';

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      await authApiClient.post('/auth/resend-otp', {
        email: email,
      });

      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = async (base64: string, filename: string): Promise<Blob> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return blob;
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
   
      const registrationDataString = await AsyncStorage.getItem('registrationData');
      
      if (!registrationDataString) {
        setError('Registration data not found. Please register again.');
        setIsVerifying(false);
        return;
      }

      const registrationData = JSON.parse(registrationDataString);

   
      const formData = new FormData();

  
      const dataObject = {
        firstName: registrationData.firstName,
        middleName: registrationData.middleName,
        lastName: registrationData.lastName,
        suffix: registrationData.suffix,
        dateOfBirth: registrationData.dateOfBirth,
        gender: registrationData.gender,
        email: registrationData.email,
        phoneNumber: registrationData.phoneNumber,
        password: registrationData.password,
        barangay: registrationData.barangay,
        streetAddress: registrationData.streetAddress,
        zone: registrationData.zone,
        idType: registrationData.idType,
        idNumber: registrationData.idNumber,
        agreedToTerms: registrationData.agreedToTerms,
        age: registrationData.age,
        otp: otpString,
      };

    
      formData.append('data', JSON.stringify(dataObject));

      // Append image files
      if (registrationData.idFrontImage) {
        const idFrontBlob = await base64ToBlob(registrationData.idFrontImage, 'id_front.jpg');
        formData.append('idFrontImage', {
          uri: registrationData.idFrontImage,
          type: 'image/jpeg',
          name: 'id_front.jpg',
        } as any);
      }

      if (registrationData.idBackImage) {
        const idBackBlob = await base64ToBlob(registrationData.idBackImage, 'id_back.jpg');
        formData.append('idBackImage', {
          uri: registrationData.idBackImage,
          type: 'image/jpeg',
          name: 'id_back.jpg',
        } as any);
      }

      if (registrationData.selfieImage) {
        const selfieBlob = await base64ToBlob(registrationData.selfieImage, 'selfie.jpg');
        formData.append('selfieImage', {
          uri: registrationData.selfieImage,
          type: 'image/jpeg',
          name: 'selfie.jpg',
        } as any);
      }

      const response = await authApiClient.post('/auth/verify-otp', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('OTP Verification Response:', response.data);

      // If successful, clear AsyncStorage
      await AsyncStorage.removeItem('registrationData');
      console.log('Registration data cleared from AsyncStorage');

     
      //router.push('/(auth)/VerificationPending');
      router.push('/(tabs)');

    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Verification failed. Please try again.');
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
                <View className="flex-row items-center bg-error-50 border border-error-200 rounded-lg p-3 mb-4">
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
            <View className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
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