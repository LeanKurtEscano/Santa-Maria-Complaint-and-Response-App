import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RegistrationFormData } from '@/types/auth/register';
import { authApiClient } from '@/lib/client/user';
import {
  validateFirstName,
  validateMiddleName,
  validateLastName,
  validateContactNumber,
  validateEmail,
  validatePassword,
} from '@/utils/validation/register';
import { THEME } from '@/constants/theme';

import Step1PersonalInfo from '@/components/register/Step1';
import Step2ContactInfo from '@/components/register/Step2';
import Step3IdVerification from '@/components/register/Step3';

export default function RegisterScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState(1);
  const [age, setAge] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | undefined>(undefined);

  const form = useForm<RegistrationFormData>({
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      barangay: '',
      streetAddress: '',
      zone: '',
      idType: '',
      idNumber: '',
      agreedToTerms: false,
    },
    mode: 'onBlur',
  });

  const { handleSubmit, watch, setValue, setError, clearErrors, reset } = form;

  useEffect(() => {
    loadSavedRegistrationData();
  }, []);

  const loadSavedRegistrationData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('registrationFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Never restore image fields from the form draft — images are stored
        // separately in 'registrationData' as base64. Restoring them here would
        // bloat AsyncStorage and cause stale URI issues.
        const { idFrontImage, idBackImage, selfieImage, ...dataWithoutImages } = parsedData;
        reset(dataWithoutImages);
        if (parsedData.age) setAge(parsedData.age);
        if (parsedData.dateOfBirth) {
          const [month, day, year] = parsedData.dateOfBirth.split('/');
          setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
        }
      }
    } catch (error) {}
  };

  const saveFormData = async () => {
    try {
      const currentData = watch();
      // Never persist image fields in the form draft — they are large base64
      // strings stored separately in 'registrationData'.
      const { idFrontImage, idBackImage, selfieImage, ...dataWithoutImages } = currentData as any;
      await AsyncStorage.setItem(
        'registrationFormData',
        JSON.stringify({ ...dataWithoutImages, age }),
      );
    } catch (error) {}
  };

  const changeLanguage = (lang: string) => i18n.changeLanguage(lang);

  /**
   * Stores the complete registration payload in AsyncStorage so it can be
   * retrieved and submitted after OTP verification.
   *
   * IMPORTANT: Images are already base64 data URIs at this point (converted in
   * Step3's processAndStoreImage). We store them as-is — NO re-conversion.
   * Re-converting would call fetch() on a data: URI which fails on Android.
   */
 const storeRegistrationData = async (data: RegistrationFormData) => {
  try {
    await AsyncStorage.setItem(
      'registrationData',
      JSON.stringify({
        ...data,
        age,
        idFrontImage: data.idFrontImage || null,
        idBackImage: data.idBackImage || null,
        selfieImage: data.selfieImage || null,
      }),
    );
  } catch (error) {
    console.error('Failed to store registration data:', error);
    throw new Error('STORAGE_FULL');
  }
};

  const clearSavedFormData = async () => {
    try {
      await AsyncStorage.removeItem('registrationFormData');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };

  // ── Step navigation with validation ──────────────────────────────────────

  const goToStep2 = () => {
    const data = watch();
    const step1Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    const firstNameError = validateFirstName(data.firstName, t);
    if (firstNameError) step1Errors.push({ field: 'firstName', message: firstNameError });
    if (data.middleName) {
      const middleNameError = validateMiddleName(data.middleName, t);
      if (middleNameError) step1Errors.push({ field: 'middleName', message: middleNameError });
    }
    const lastNameError = validateLastName(data.lastName, t);
    if (lastNameError) step1Errors.push({ field: 'lastName', message: lastNameError });
    if (!data.dateOfBirth) step1Errors.push({ field: 'dateOfBirth', message: t('required') });
    if (!data.gender) step1Errors.push({ field: 'gender', message: t('required') });

    if (step1Errors.length > 0) {
      step1Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    const data = watch();
    const step2Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    const emailError = validateEmail(data.email, t);
    if (emailError) step2Errors.push({ field: 'email', message: emailError });

    const stripped = data.phoneNumber.startsWith('0')
      ? data.phoneNumber.slice(1)
      : data.phoneNumber;
    const phoneError = validateContactNumber(stripped, t);
    if (phoneError) step2Errors.push({ field: 'phoneNumber', message: phoneError });

    const passwordError = validatePassword(data.password, t);
    if (passwordError) step2Errors.push({ field: 'password', message: passwordError });
    if (data.password !== data.confirmPassword) {
      step2Errors.push({ field: 'confirmPassword', message: t('passwordMismatch') });
    }

    if (step2Errors.length > 0) {
      step2Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      return;
    }
    setStep(3);
  };

  // ── Final submit ──────────────────────────────────────────────────────────

  const onSubmit = async (data: RegistrationFormData) => {
    setNetworkError(null);

    // handleSubmit's data argument does not reliably include values set via
    // setValue() in child components (like images set in Step3). We merge with
    // watch() to ensure image fields are always present.
    const currentFormValues = watch();
    const mergedData: RegistrationFormData = {
      ...data,
      idFrontImage: currentFormValues.idFrontImage || data.idFrontImage || '',
      idBackImage: currentFormValues.idBackImage || data.idBackImage || '',
      selfieImage: currentFormValues.selfieImage || data.selfieImage || '',
    };

    const step3Errors: { field: keyof RegistrationFormData; message: string }[] = [];
    if (!mergedData.idType) step3Errors.push({ field: 'idType', message: t('required') });
    if (!mergedData.idNumber) step3Errors.push({ field: 'idNumber', message: t('required') });
    if (!mergedData.idFrontImage) step3Errors.push({ field: 'idFrontImage', message: t('required') });
    if (!mergedData.selfieImage) step3Errors.push({ field: 'selfieImage', message: t('required') });
    if (!mergedData.agreedToTerms) step3Errors.push({ field: 'agreedToTerms', message: t('required') });

    if (!recaptchaVerified) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      return;
    }

    if (step3Errors.length > 0) {
      step3Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      return;
    }

    setIsLoading(true);
    try {
      // Store the full registration data (including base64 images) BEFORE
      // calling the API, so OTP screen can retrieve it regardless of outcome.
      // Use mergedData which is guaranteed to have images from watch().
      await storeRegistrationData(mergedData);

      const response = await authApiClient.post('/register', {
        email: data.email,
        phone_number: data.phoneNumber,
      });
      if (!response || !response.data) throw new Error('Invalid response from server');

      await clearSavedFormData();

      router.replace({
        pathname: '/(auth)/Otp',
        params: {
          email: data.email,
          apiRoute: '/verify-otp',
          otpResendRoute: '/resend-otp',
        },
      });
    } catch (error: any) {

      console.error('Registration error:', error);

      if (error?.message === 'STORAGE_FULL') {
    setNetworkError(
      'Unable to save your registration data on this device. Please try retaking your ID photos or restart the app.',
    );
  } 
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail || '';
        if (detail.toLowerCase().includes('phone')) {
          setError('phoneNumber', {
            type: 'server',
            message: detail || 'Phone number already registered',
          });
        } else {
          setError('email', {
            type: 'server',
            message: detail || 'Email already registered',
          });
        }
        setStep(2);
      } else if (
        error?.code === 'ECONNABORTED' ||
        error?.code === 'ERR_NETWORK' ||
        error?.message === 'Network Error' ||
        error?.message?.includes('Network request failed')
      ) {
        setNetworkError('Network error. Please check your connection and try again.');
      } else if (error?.code === 'ETIMEDOUT') {
        setNetworkError('Request timed out. Please try again.');
      } else if (error?.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, message]) =>
          setError(key as keyof RegistrationFormData, {
            type: 'server',
            message: message as string,
          }),
        );
      } else {
        setNetworkError(
          error?.response?.data?.message ||
            error?.message ||
            'Registration failed. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Language Selector */}
          <View className="flex-row justify-end mb-6 gap-2">
            {['en', 'tl'].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => changeLanguage(lang)}
                style={i18n.language === lang ? { backgroundColor: THEME.primary } : {}}
                className={`px-3.5 py-2 rounded-lg ${
                  i18n.language !== lang ? 'bg-neutral-100' : ''
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-medium ${
                    i18n.language === lang ? 'text-white' : 'text-neutral-700'
                  }`}
                >
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-3xl font-bold text-neutral-900 mb-8">{t('register')}</Text>

          {/* Progress Indicator */}
          <View className="flex-row mb-8 gap-2">
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={s <= step ? { backgroundColor: THEME.primary } : {}}
                className={`flex-1 h-1.5 rounded-full ${s > step ? 'bg-neutral-200' : ''}`}
              />
            ))}
          </View>

          {step === 1 && (
            <Step1PersonalInfo
              form={form}
              onNext={goToStep2}
              age={age}
              setAge={setAge}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              saveFormData={saveFormData}
            />
          )}

          {step === 2 && (
            <Step2ContactInfo
              form={form}
              onNext={goToStep3}
              onBack={() => setStep(1)}
              networkError={networkError}
              setNetworkError={setNetworkError}
              saveFormData={saveFormData}
            />
          )}

          {step === 3 && (
            <Step3IdVerification
              form={form}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit(onSubmit)}
              isLoading={isLoading}
              recaptchaVerified={recaptchaVerified}
              setRecaptchaVerified={setRecaptchaVerified}
              recaptchaError={recaptchaError}
              setRecaptchaError={setRecaptchaError}
              saveFormData={saveFormData}
            />
          )}

          {/* Login Link */}
          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-neutral-600 text-sm">{t('haveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)')} activeOpacity={0.7}>
              <Text style={{ color: THEME.primary }} className="font-semibold text-sm">
                {t('login')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}