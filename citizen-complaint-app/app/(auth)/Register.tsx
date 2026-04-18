import React, { useState, useEffect, use } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { RegistrationFormData } from '@/types/auth/register';
import { BARANGAYS } from '@/constants/auth/registration';
import { ID_TYPES } from '@/constants/auth/registration';
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  CreditCard,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Calendar,
  FileText,
  WifiOff,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authApiClient } from '@/lib/client/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import convertImageToBase64 from '@/utils/general/image';
import {
  validateFirstName,
  validateMiddleName,
  validateLastName,
  validateContactNumber,
  validateEmail,
  validatePassword,
} from '@/utils/validation/register';
import { TAGALOG_MONTHS } from '@/constants/localization/date';
import { useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import TermsAndAgreementModal from '@/components/modals/TermsAndAgreement';

const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV'];

// ─── reCAPTCHA Component ───────────────────────────────────────────────────
interface RecaptchaProps {
  verified: boolean;
  onVerify: () => void;
  error?: string;
}

const Recaptcha = ({ verified, onVerify, error }: RecaptchaProps) => {
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(false);

  const handlePress = () => {
    if (verified) return;
    setShowModal(true);
  };

  const handleVerify = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setShowModal(false);
      onVerify();
    }, 1000);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.recaptchaBox,
          error ? styles.recaptchaBoxError : styles.recaptchaBoxDefault,
        ]}
      >
        <View
          style={[
            styles.recaptchaCheckbox,
            verified ? styles.recaptchaCheckboxChecked : styles.recaptchaCheckboxUnchecked,
          ]}
        >
          {verified && <Check size={14} color="#FFFFFF" />}
        </View>
        <Text style={styles.recaptchaLabel}>I'm not a robot</Text>
        <View style={styles.recaptchaBrand}>
          <Shield size={22} color={THEME.primary} />
          <Text style={[styles.recaptchaBrandText, { color: THEME.primary }]}>reCAPTCHA</Text>
          <Text style={styles.recaptchaPrivacy}>Privacy - Terms</Text>
        </View>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorRow}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recaptchaModal}>
            <View style={[styles.recaptchaModalHeader, { backgroundColor: THEME.primary }]}>
              <ShieldCheck size={24} color="#FFFFFF" />
              <Text style={styles.recaptchaModalTitle}>Security Check</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.recaptchaModalClose}
                activeOpacity={0.7}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.recaptchaModalBody}>
              <Text style={styles.recaptchaModalSubtitle}>
                Please confirm you are not a robot
              </Text>
              <TouchableOpacity
                onPress={handleVerify}
                disabled={checking}
                activeOpacity={0.85}
                style={[styles.recaptchaVerifyBtn, { backgroundColor: THEME.primary }]}
              >
                {checking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.recaptchaVerifyBtnContent}>
                    <ShieldCheck size={20} color="#FFFFFF" />
                    <Text style={styles.recaptchaVerifyBtnText}>I'm not a robot</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.recaptchaFooter}>
                <Shield size={14} color="#9CA3AF" />
                <Text style={styles.recaptchaFooterText}>Protected by reCAPTCHA</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  recaptchaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  recaptchaBoxDefault: { borderColor: '#E5E7EB' },
  recaptchaBoxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  recaptchaCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recaptchaCheckboxUnchecked: { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  recaptchaCheckboxChecked: { borderColor: THEME.primary, backgroundColor: THEME.primary },
  recaptchaLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  recaptchaBrand: { alignItems: 'center' },
  recaptchaBrandText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  recaptchaPrivacy: { fontSize: 8, color: '#9CA3AF', marginTop: 1 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 24,
  },
  recaptchaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  recaptchaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  recaptchaModalTitle: { flex: 1, color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  recaptchaModalClose: { padding: 4 },
  recaptchaModalBody: { padding: 24, alignItems: 'center' },
  recaptchaModalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  recaptchaVerifyBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  recaptchaVerifyBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recaptchaVerifyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  recaptchaFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recaptchaFooterText: { fontSize: 12, color: '#9CA3AF' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorText: { color: '#EF4444', fontSize: 12, marginLeft: 4 },
});

export default function RegisterScreen({ navigation }: any) {
  const router = useRouter();
  const { apiRoute } = useLocalSearchParams();
  const { t, i18n } = useTranslation();

  // ── Derive registration mode from apiRoute ────────────────────────────────
  // isPhoneMode = true  → show phone only, hide email
  // isPhoneMode = false → show email only, hide phone
  const isPhoneMode = apiRoute === '/register-phone-number';

  const [step, setStep] = useState(1);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showSuffixModal, setShowSuffixModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'idFrontImage' | 'idBackImage' | 'selfieImage' | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  });
  const [showTermsModal, setShowTermsModal] = useState(false);

  const getMinDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 85);
    return date;
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
  } = useForm<RegistrationFormData>({
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

  const password = watch('password');

  useEffect(() => {
    loadSavedRegistrationData();
  }, []);

  const loadSavedRegistrationData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('registrationFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const { idFrontImage, idBackImage, selfieImage, ...dataWithoutImages } = parsedData;
        reset(dataWithoutImages);
        if (parsedData.age) setAge(parsedData.age);
        if (parsedData.dateOfBirth) {
          const [month, day, year] = parsedData.dateOfBirth.split('/');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          setSelectedDate(date);
        }
      }
    } catch (error) {}
  };

  const saveFormData = async () => {
    try {
      const currentData = watch();
      await AsyncStorage.setItem('registrationFormData', JSON.stringify({ ...currentData, age }));
    } catch (error) {}
  };

  const changeLanguage = (lang: string) => i18n.changeLanguage(lang);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setAge(calculateAge(selectedDate));
      const formattedDate = `${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${String(selectedDate.getDate()).padStart(2, '0')}/${selectedDate.getFullYear()}`;
      setValue('dateOfBirth', formattedDate);
      clearErrors('dateOfBirth');
      saveFormData();
    }
  };

  const toProperCase = (text: string): string =>
    text.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const handlePhoneNumberChange = (text: string, onChange: (val: string) => void) => {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('63')) digits = '0' + digits.slice(2);
    if (digits.length > 11) digits = digits.slice(0, 11);
    onChange(digits);
  };

  const handleImagePick = async (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
    setCurrentImageField(field);
    setShowImagePickerModal(true);
  };

  const pickFromCamera = async () => {
    if (!currentImageField) return;
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) { alert('Camera permission is required!'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setValue(currentImageField, result.assets[0].uri); clearErrors(currentImageField); await saveFormData(); }
    setShowImagePickerModal(false);
    setCurrentImageField(null);
  };

  const pickFromLibrary = async () => {
    if (!currentImageField) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setValue(currentImageField, result.assets[0].uri); clearErrors(currentImageField); await saveFormData(); }
    setShowImagePickerModal(false);
    setCurrentImageField(null);
  };

  const removeImage = async (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
    setValue(field, '' as any, { shouldValidate: false, shouldDirty: true });
    clearErrors(field);
    await saveFormData();
  };

  const getFileName = (uri: string | undefined) => {
    if (!uri) return '';
    return uri.split('/').pop() ?? '';
  };

  const storeRegistrationData = async (data: RegistrationFormData) => {
    const [idFrontBase64, idBackBase64, selfieBase64] = await Promise.all([
      data.idFrontImage ? convertImageToBase64(data.idFrontImage) : null,
      data.idBackImage ? convertImageToBase64(data.idBackImage) : null,
      data.selfieImage ? convertImageToBase64(data.selfieImage) : null,
    ]);
    try {
      await AsyncStorage.setItem('registrationData', JSON.stringify({
        ...data,
        idFrontImage: idFrontBase64,
        idBackImage: idBackBase64,
        selfieImage: selfieBase64,
        age,
      }));
    } catch (error) {
      throw error;
    }
  };

  const clearSavedFormData = async () => {
    try { await AsyncStorage.removeItem('registrationFormData'); } catch (error) { console.error('Error clearing saved form data:', error); }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setNetworkError(null);

    // ── Step 1 validation ────────────────────────────────────────────────
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
      setStep(1);
      return;
    }

    // ── Step 2 validation ────────────────────────────────────────────────
    const step2Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    // Only validate email if it's email mode
    if (!isPhoneMode) {
      const emailError = validateEmail(data.email, t);
      if (emailError) step2Errors.push({ field: 'email', message: emailError });
    }

    // Only validate phone if it's phone mode
    if (isPhoneMode) {
      const stripped = data.phoneNumber.startsWith('0') ? data.phoneNumber.slice(1) : data.phoneNumber;
      const phoneError = validateContactNumber(stripped, t);
      if (phoneError) step2Errors.push({ field: 'phoneNumber', message: phoneError });
    }

    const passwordError = validatePassword(data.password, t);
    if (passwordError) step2Errors.push({ field: 'password', message: passwordError });
    if (data.password !== data.confirmPassword) {
      step2Errors.push({ field: 'confirmPassword', message: t('passwordMismatch') });
    }
    if (step2Errors.length > 0) {
      step2Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      setStep(2);
      return;
    }

    // ── Step 3 validation ────────────────────────────────────────────────
    const step3Errors: { field: keyof RegistrationFormData; message: string }[] = [];
    if (!data.idType) step3Errors.push({ field: 'idType', message: t('required') });
    if (!data.idNumber) step3Errors.push({ field: 'idNumber', message: t('required') });
    if (!data.idFrontImage) step3Errors.push({ field: 'idFrontImage', message: t('required') });
    if (!data.selfieImage) step3Errors.push({ field: 'selfieImage', message: t('required') });
    if (!data.agreedToTerms) step3Errors.push({ field: 'agreedToTerms', message: t('required') });

    if (!recaptchaVerified) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      setStep(3);
      return;
    }

    if (step3Errors.length > 0) {
      step3Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      setStep(3);
      return;
    }

    setIsLoading(true);
    try {
      await saveFormData();

      // ── Use the correct API route based on mode ───────────────────────
      const endpoint = isPhoneMode ? '/register-phone-number' : '/register';
      const payload = isPhoneMode
        ? { phone_number: data.phoneNumber }
        : { email: data.email, phone_number: data.phoneNumber };

      const response = await authApiClient.post(endpoint, payload);
      if (!response || !response.data) throw new Error('Invalid response from server');

      await storeRegistrationData(data);
      setSubmittedEmail(data.email);
      await clearSavedFormData();
      


 
      if(isPhoneMode) {

        router.replace({
        pathname: '/(auth)/Otp',
        params: {
          phone: data.phoneNumber ,
          apiRoute: '/verify-phone-number-otp',
          otpResendRoute: '/resend-phone-otp',
        },
      });

      } else {

        router.replace({
        pathname: '/(auth)/Otp',
        params: {
          email: data.email,
          
          apiRoute: '/verify-otp',
          otpResendRoute: '/resend-otp',
        },
      });

      }
      
    } catch (error: any) {
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail || '';
        if (isPhoneMode || detail.toLowerCase().includes('phone')) {
          setError('phoneNumber', { type: 'server', message: detail || 'Phone number already registered' });
        } else {
          setError('email', { type: 'server', message: detail || 'Email already registered' });
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
          setError(key as keyof RegistrationFormData, { type: 'server', message: message as string })
        );
      } else {
        setNetworkError(error?.response?.data?.message || error?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Reusable error row ────────────────────────────────────────────────────
  const ErrorMessage = ({ message }: { message?: string }) =>
    message ? (
      <View className="flex-row items-center mt-2">
        <AlertCircle size={14} color="#EF4444" />
        <Text className="text-error-600 text-xs ml-1">{message}</Text>
      </View>
    ) : null;

  // ─── Step 1: Personal Info ─────────────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-6">{t('personalInfo')}</Text>

      {/* First Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('firstName')} *</Text>
        <Controller
          control={control}
          name="firstName"
          rules={{ required: t('required'), validate: (value) => validateFirstName(value, t) || true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.firstName ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={() => {
                  onBlur();
                  const err = validateFirstName(value, t);
                  if (err) setError('firstName', { type: 'manual', message: err });
                  else clearErrors('firstName');
                }}
                onChangeText={(text) => { onChange(toProperCase(text)); clearErrors('firstName'); }}
                value={value}
                placeholder="Juan"
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
        <ErrorMessage message={errors.firstName?.message} />
      </View>

      {/* Middle Name (optional) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('middleName')}{' '}
          <Text className="text-black font-normal text-md">(Optional)</Text>
        </Text>
        <Controller
          control={control}
          name="middleName"
          rules={{
            validate: (value) => {
              if (!value) return true;
              const err = validateMiddleName(value, t);
              return err ? err : true;
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.middleName ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={() => {
                  onBlur();
                  if (value) {
                    const err = validateMiddleName(value, t);
                    if (err) setError('middleName', { type: 'manual', message: err });
                    else clearErrors('middleName');
                  }
                }}
                onChangeText={(text) => { onChange(toProperCase(text)); clearErrors('middleName'); }}
                value={value}
                placeholder="Santos"
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
        <ErrorMessage message={errors.middleName?.message} />
      </View>

      {/* Last Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('lastName')} *</Text>
        <Controller
          control={control}
          name="lastName"
          rules={{ required: t('required'), validate: (value) => validateLastName(value, t) || true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.lastName ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={() => {
                  onBlur();
                  const err = validateLastName(value, t);
                  if (err) setError('lastName', { type: 'manual', message: err });
                  else clearErrors('lastName');
                }}
                onChangeText={(text) => { onChange(toProperCase(text)); clearErrors('lastName'); }}
                value={value}
                placeholder="Dela Cruz"
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
        <ErrorMessage message={errors.lastName?.message} />
      </View>

      {/* Suffix */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('suffix')}</Text>
        <Controller
          control={control}
          name="suffix"
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowSuffixModal(true)}
              className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-3.5 bg-white"
              activeOpacity={0.7}
            >
              <User size={20} color="#6B7280" />
              <Text className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {value || 'None'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Suffix Modal */}
      <Modal visible={showSuffixModal} transparent animationType="slide" onRequestClose={() => setShowSuffixModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">Select Suffix</Text>
            <TouchableOpacity onPress={() => setShowSuffixModal(false)} className="absolute top-6 right-6" activeOpacity={0.7}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setValue('suffix', ''); setShowSuffixModal(false); saveFormData(); }}
              className={`py-4 border-b border-neutral-200 ${watch('suffix') === '' ? 'bg-primary-50' : ''}`}
              activeOpacity={0.7}
            >
              <Text className="text-base text-neutral-500 italic">None</Text>
            </TouchableOpacity>
            {SUFFIX_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => { setValue('suffix', option); setShowSuffixModal(false); saveFormData(); }}
                className={`py-4 border-b border-neutral-200 flex-row justify-between items-center ${watch('suffix') === option ? 'bg-primary-50' : ''}`}
                activeOpacity={0.7}
              >
                <Text className="text-base text-neutral-900">{option}</Text>
                {watch('suffix') === option && <Check size={18} color={THEME.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Date of Birth */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('dateOfBirth')} *</Text>
        <Controller
          control={control}
          name="dateOfBirth"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${errors.dateOfBirth ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="#6B7280" />
              <Text className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {value || 'MM/DD/YYYY'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        <ErrorMessage message={errors.dateOfBirth?.message} />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={getMaxDate()}
          minimumDate={getMinDate()}
          textColor="#000000"
        />
      )}

      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide">
          <TouchableOpacity className="flex-1 justify-end bg-black/50" activeOpacity={1} onPress={() => setShowDatePicker(false)}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl p-6 pb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-neutral-900">
                    {i18n.language === 'tl' ? 'Pumili ng Petsa ng Kapanganakan' : 'Select Date of Birth'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} className="p-2" activeOpacity={0.7}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                {i18n.language === 'tl' && (
                  <View className="flex-row justify-center items-center mb-3 bg-primary-50 rounded-xl py-2 px-4">
                    <Text style={{ color: THEME.primary }} className="text-base font-semibold">
                      {TAGALOG_MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                    </Text>
                  </View>
                )}
                <View style={{ backgroundColor: 'white' }}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={getMaxDate()}
                    minimumDate={getMinDate()}
                    textColor="#000000"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={{ backgroundColor: THEME.primary }}
                  className="rounded-xl py-4 items-center mt-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-base">
                    {i18n.language === 'tl' ? 'Tapos Na' : 'Done'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Age (auto-calculated) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('age')}</Text>
        <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-3.5 bg-neutral-50">
          <Calendar size={20} color="#6B7280" />
          <Text className="flex-1 ml-3 text-base text-neutral-500">
            {age !== null ? `${age} years old` : 'Age will be calculated'}
          </Text>
        </View>
        <Text className="text-xs text-neutral-500 mt-1">Age is automatically calculated from your date of birth</Text>
      </View>

      {/* Gender */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('gender')} *</Text>
        <Controller
          control={control}
          name="gender"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowGenderModal(true)}
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${errors.gender ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}
              activeOpacity={0.7}
            >
              <User size={20} color="#6B7280" />
              <Text className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {value ? t(value) : t('Select Gender')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        <ErrorMessage message={errors.gender?.message} />
      </View>

      {/* Gender Modal */}
      <Modal visible={showGenderModal} transparent animationType="slide" onRequestClose={() => setShowGenderModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">{t('Select Gender')}</Text>
            <TouchableOpacity onPress={() => setShowGenderModal(false)} className="absolute top-6 right-6" activeOpacity={0.7}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            {[{ label: t('male'), value: 'male' }, { label: t('female'), value: 'female' }].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => { setValue('gender', option.value); clearErrors('gender'); setShowGenderModal(false); saveFormData(); }}
                className={`py-4 border-b border-neutral-200 flex-row justify-between items-center ${watch('gender') === option.value ? 'bg-primary-50' : ''}`}
                activeOpacity={0.7}
              >
                <Text className="text-base text-neutral-900">{option.label}</Text>
                {watch('gender') === option.value && <Check size={18} color={THEME.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={() => setStep(2)}
        style={{ backgroundColor: THEME.primary }}
        className="rounded-xl py-4 items-center shadow-sm"
        activeOpacity={0.85}
      >
        <Text className="text-white font-semibold text-base">{t('continue')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Step 2: Contact Info ──────────────────────────────────────────────────
  const renderStep2 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-6">{t('contactInfo')}</Text>

      {networkError && (
        <View className="bg-error-50 border border-error-500 rounded-xl p-4 mb-6 flex-row items-start">
          <WifiOff size={20} color="#EF4444" />
          <Text className="text-sm text-error-600 flex-1 ml-3 leading-5">{networkError}</Text>
        </View>
      )}

      {/* ── Email — shown only in email mode ── */}
      {!isPhoneMode && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">{t('email')} *</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: t('required'),
              validate: (value) => {
                const err = validateEmail(value, t);
                return err ? err : true;
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.email ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
                <Mail size={20} color={errors.email ? '#EF4444' : '#6B7280'} />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                  onBlur={() => {
                    onBlur();
                    const err = validateEmail(value, t);
                    if (err) setError('email', { type: 'manual', message: err });
                    else clearErrors('email');
                  }}
                  onChangeText={(text) => { onChange(text); clearErrors('email'); setNetworkError(null); }}
                  value={value}
                  placeholder="juan.delacruz@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          <ErrorMessage message={errors.email?.message} />
        </View>
      )}

      {/* ── Phone Number — shown only in phone mode ── */}
      {isPhoneMode && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">{t('phoneNumber')} *</Text>
          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              required: t('required'),
              validate: (value) => {
                const stripped = value.startsWith('0') ? value.slice(1) : value;
                const err = validateContactNumber(stripped, t);
                return err || true;
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.phoneNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
                <Phone size={20} color="#6B7280" />
                <View className="ml-3 mr-1 border-r border-neutral-300 pr-3">
                  <Text className="text-base text-neutral-700 py-2.5">+63</Text>
                </View>
                <TextInput
                  className="flex-1 ml-2 text-base text-neutral-900 py-2.5"
                  onBlur={() => {
                    onBlur();
                    const stripped = value.startsWith('0') ? value.slice(1) : value;
                    const err = validateContactNumber(stripped, t);
                    if (err) setError('phoneNumber', { type: 'manual', message: err });
                    else clearErrors('phoneNumber');
                  }}
                  onChangeText={(text) => handlePhoneNumberChange(text, onChange)}
                  value={value}
                  placeholder="9123456789"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            )}
          />
          <Text className="text-xs text-neutral-500 mt-1">Enter your 11-digit number (e.g. 09123456789)</Text>
          <ErrorMessage message={errors.phoneNumber?.message} />
        </View>
      )}

      {/* Password */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('password')} *</Text>
        <Controller
          control={control}
          name="password"
          rules={{ required: t('required'), validate: (value) => validatePassword(value, t) || true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.password ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                  maxLength={128}
                  onBlur={() => {
                    onBlur();
                    const err = validatePassword(value, t);
                    if (err) setError('password', { type: 'manual', message: err });
                    else clearErrors('password');
                  }}
                  onChangeText={(text) => { onChange(text.replace(/\s/g, '')); clearErrors('password'); }}
                  value={value}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1" activeOpacity={0.7}>
                  {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-neutral-500 mt-1">{t('registerValidation.passwordHint')}</Text>
            </>
          )}
        />
        <ErrorMessage message={errors.password?.message} />
      </View>

      {/* Confirm Password */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('confirmPassword')} *</Text>
        <Controller
          control={control}
          name="confirmPassword"
          rules={{ required: t('required'), validate: (value) => value === password || t('passwordMismatch') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.confirmPassword ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1" activeOpacity={0.7}>
                {showConfirmPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          )}
        />
        <ErrorMessage message={errors.confirmPassword?.message} />
      </View>

      {/* Barangay modal */}
      <Modal visible={showBarangayModal} transparent animationType="slide" onRequestClose={() => setShowBarangayModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
            <Text className="text-xl font-bold text-neutral-900 mb-4">{t('selectBarangay')}</Text>
            <TouchableOpacity onPress={() => setShowBarangayModal(false)} className="absolute top-6 right-6" activeOpacity={0.7}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <ScrollView>
              {BARANGAYS.map((brgy) => (
                <TouchableOpacity
                  key={brgy}
                  onPress={() => { setValue('barangay', brgy); clearErrors('barangay'); setShowBarangayModal(false); saveFormData(); }}
                  className={`py-4 border-b border-neutral-200 flex-row justify-between items-center ${watch('barangay') === brgy ? 'bg-primary-50' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-neutral-900">{brgy}</Text>
                  {watch('barangay') === brgy && <Check size={18} color={THEME.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="flex-row gap-3">
        <TouchableOpacity onPress={() => setStep(1)} className="flex-1 bg-neutral-100 rounded-xl py-4 items-center" activeOpacity={0.7}>
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStep(3)}
          style={{ backgroundColor: THEME.primary }}
          className="flex-1 rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 3: ID Verification ───────────────────────────────────────────────
  const renderStep3 = () => (
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
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${errors.idType ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}
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

      <Modal visible={showIdTypeModal} transparent animationType="slide" onRequestClose={() => setShowIdTypeModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
            <Text className="text-xl font-bold text-neutral-900 mb-4">{t('selectIdType')}</Text>
            <TouchableOpacity onPress={() => setShowIdTypeModal(false)} className="absolute top-6 right-6" activeOpacity={0.7}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <ScrollView>
              {ID_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => { setValue('idType', type); clearErrors('idType'); setShowIdTypeModal(false); saveFormData(); }}
                  className={`py-4 border-b border-neutral-200 flex-row justify-between items-center ${watch('idType') === type ? 'bg-primary-50' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-neutral-900">{t(type)}</Text>
                  {watch('idType') === type && <Check size={18} color={THEME.primary} />}
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
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.idNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <FileText size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="A00-000-000000"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
        <ErrorMessage message={errors.idNumber?.message} />
      </View>

      {/* ID Front Image */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('uploadIdFront')} *</Text>
        <Controller
          control={control}
          name="idFrontImage"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <>
              {value && value !== '' ? (
                <View className={`border-2 rounded-xl p-4 bg-white ${errors.idFrontImage ? 'border-error-500' : 'border-neutral-200'}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <ImageIcon size={20} color="#10B981" />
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>{getFileName(value)}</Text>
                    </View>
                    <View className="flex-row" style={{ gap: 8 }}>
                      <TouchableOpacity onPress={() => handleImagePick('idFrontImage')} className="bg-primary-100 rounded-lg p-2" activeOpacity={0.7}>
                        <Camera size={16} color={THEME.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeImage('idFrontImage')} className="bg-error-100 rounded-lg p-2" activeOpacity={0.7}>
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('idFrontImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.idFrontImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'}`}
                  activeOpacity={0.7}
                >
                  <Camera size={32} color="#9CA3AF" />
                  <Text style={{ color: THEME.primary }} className="font-medium mt-2">{t('tapToUpload')}</Text>
                  <Text className="text-neutral-500 text-xs mt-1">Front side of your ID</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        />
        <ErrorMessage message={errors.idFrontImage?.message} />
      </View>

      {/* ID Back Image */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('uploadIdBack')}</Text>
        <Controller
          control={control}
          name="idBackImage"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <>
              {value && value !== '' ? (
                <View className={`border-2 rounded-xl p-4 bg-white ${errors.idBackImage ? 'border-error-500' : 'border-neutral-200'}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <ImageIcon size={20} color="#10B981" />
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>{getFileName(value)}</Text>
                    </View>
                    <View className="flex-row" style={{ gap: 8 }}>
                      <TouchableOpacity onPress={() => handleImagePick('idBackImage')} className="bg-primary-100 rounded-lg p-2" activeOpacity={0.7}>
                        <Camera size={16} color={THEME.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeImage('idBackImage')} className="bg-error-100 rounded-lg p-2" activeOpacity={0.7}>
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('idBackImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.idBackImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'}`}
                  activeOpacity={0.7}
                >
                  <Camera size={32} color="#9CA3AF" />
                  <Text style={{ color: THEME.primary }} className="font-medium mt-2">{t('tapToUpload')}</Text>
                  <Text className="text-neutral-500 text-xs mt-1">Back side of your ID</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        />
        <ErrorMessage message={errors.idBackImage?.message} />
      </View>

      {/* Selfie with ID */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('uploadSelfie')} *</Text>
        <Controller
          control={control}
          name="selfieImage"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <>
              {value && value !== '' ? (
                <View className={`border-2 rounded-xl p-4 bg-white ${errors.selfieImage ? 'border-error-500' : 'border-neutral-200'}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <ImageIcon size={20} color="#10B981" />
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>{getFileName(value)}</Text>
                    </View>
                    <View className="flex-row" style={{ gap: 8 }}>
                      <TouchableOpacity onPress={() => handleImagePick('selfieImage')} className="bg-primary-100 rounded-lg p-2" activeOpacity={0.7}>
                        <Camera size={16} color={THEME.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeImage('selfieImage')} className="bg-error-100 rounded-lg p-2" activeOpacity={0.7}>
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('selfieImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.selfieImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'}`}
                  activeOpacity={0.7}
                >
                  <Camera size={32} color="#9CA3AF" />
                  <Text style={{ color: THEME.primary }} className="font-medium mt-2">{t('tapToUpload')}</Text>
                  <Text className="text-neutral-500 text-xs mt-1">Selfie holding your ID</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        />
        <ErrorMessage message={errors.selfieImage?.message} />
      </View>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowImagePickerModal(false); setCurrentImageField(null); }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-xl font-bold text-neutral-900 mb-4">Choose Image Source</Text>
            <TouchableOpacity onPress={() => { setShowImagePickerModal(false); setCurrentImageField(null); }} className="absolute top-6 right-6" activeOpacity={0.7}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickFromCamera} className="flex-row items-center bg-primary-50 rounded-xl p-4 mb-3" activeOpacity={0.7}>
              <Camera size={24} color={THEME.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-neutral-900">Take Photo</Text>
                <Text className="text-sm text-neutral-600">Use your camera to capture</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickFromLibrary} className="flex-row items-center bg-neutral-50 rounded-xl p-4" activeOpacity={0.7}>
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
                onPress={() => { if (value) { onChange(false); } else { setShowTermsModal(true); } }}
                className="flex-row items-start mb-2"
                activeOpacity={0.7}
              >
                <View
                  style={value ? { backgroundColor: THEME.primary, borderColor: THEME.primary } : {}}
                  className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${!value ? (errors.agreedToTerms ? 'border-error-500' : 'border-neutral-300') : ''}`}
                >
                  {value && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text className="text-sm text-neutral-700 flex-1">{t('agreeTerms')}</Text>
              </TouchableOpacity>

              <TermsAndAgreementModal
                visible={showTermsModal}
                onAccept={() => { onChange(true); clearErrors('agreedToTerms'); setShowTermsModal(false); saveFormData(); }}
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
            onVerify={() => { setRecaptchaVerified(true); setRecaptchaError(undefined); }}
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
          <TouchableOpacity onPress={() => setStep(2)} className="flex-1 bg-neutral-100 rounded-xl py-4 items-center" activeOpacity={0.7}>
            <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            style={{ backgroundColor: THEME.primary }}
            className="flex-1 rounded-xl py-4 items-center shadow-sm"
            activeOpacity={0.85}
          >
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-semibold text-base">{t('submit')}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          {/* Language Selector */}
          <View className="flex-row justify-end mb-6 gap-2">
            {['en', 'tl'].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => changeLanguage(lang)}
                style={i18n.language === lang ? { backgroundColor: THEME.primary } : {}}
                className={`px-3.5 py-2 rounded-lg ${i18n.language !== lang ? 'bg-neutral-100' : ''}`}
                activeOpacity={0.7}
              >
                <Text className={`font-medium ${i18n.language === lang ? 'text-white' : 'text-neutral-700'}`}>
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

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-neutral-600 text-sm">{t('haveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)')} activeOpacity={0.7}>
              <Text style={{ color: THEME.primary }} className="font-semibold text-sm">{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}