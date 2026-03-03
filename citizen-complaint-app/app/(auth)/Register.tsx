import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authApiClient } from '@/lib/client/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import convertImageToBase64 from '@/utils/general/image';
import {
  validateFirstName,
  validateLastName,
  validateContactNumber,
  validateEmail,
} from '@/utils/validation/register';
import { TAGALOG_MONTHS } from '@/constants/localization/date';
const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV'];

export default function RegisterScreen({ navigation }: any) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  });

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
    } catch (error) {
      console.error('Error loading saved registration data:', error);
    }
  };

  const saveFormData = async () => {
    try {
      const currentData = watch();
      await AsyncStorage.setItem('registrationFormData', JSON.stringify({ ...currentData, age }));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
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

  // Auto-capitalize each word as the user types (e.g. "juan dela cruz" → "Juan Dela Cruz")
  const toProperCase = (text: string): string => {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Phone number handler — strips leading 63 → 0, keeps 11 digits
  const handlePhoneNumberChange = (text: string, onChange: (val: string) => void) => {
    // Remove any non-digit characters
    let digits = text.replace(/\D/g, '');

    // If user types 63 at the start, convert to 0
    if (digits.startsWith('63')) {
      digits = '0' + digits.slice(2);
    }

    // Limit to 11 digits (09XXXXXXXXX)
    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }

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
    setValue(field, undefined);
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
      await AsyncStorage.setItem('registrationData', JSON.stringify({ ...data, idFrontImage: idFrontBase64, idBackImage: idBackBase64, selfieImage: selfieBase64, age }));
    } catch (error) {
      console.error('Error storing registration data:', error);
      throw error;
    }
  };

  const clearSavedFormData = async () => {
    try { await AsyncStorage.removeItem('registrationFormData'); } catch (error) { console.error('Error clearing saved form data:', error); }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setNetworkError(null);

    // ── Step 1 validation ─────────────────────────────────────────────────
    const step1Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    const firstNameError = validateFirstName(data.firstName);
    if (firstNameError) step1Errors.push({ field: 'firstName', message: firstNameError });

    const lastNameError = validateLastName(data.lastName);
    if (lastNameError) step1Errors.push({ field: 'lastName', message: lastNameError });

    if (!data.dateOfBirth) step1Errors.push({ field: 'dateOfBirth', message: t('required') });
    if (!data.gender) step1Errors.push({ field: 'gender', message: t('required') });

    if (step1Errors.length > 0) {
      step1Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      setStep(1);
      return;
    }

    // ── Step 2 validation ─────────────────────────────────────────────────
    const step2Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    const emailError = validateEmail(data.email);
    if (emailError) step2Errors.push({ field: 'email', message: emailError });

    const stripped = data.phoneNumber.startsWith('0') ? data.phoneNumber.slice(1) : data.phoneNumber;
    const phoneError = validateContactNumber(stripped);
    if (phoneError) step2Errors.push({ field: 'phoneNumber', message: phoneError });

    if (!data.password) {
      step2Errors.push({ field: 'password', message: t('required') });
    } else if (data.password.length < 8) {
      step2Errors.push({ field: 'password', message: t('minLength', { count: 8 }) });
    }

    if (data.password !== data.confirmPassword) {
      step2Errors.push({ field: 'confirmPassword', message: t('passwordMismatch') });
    }

    if (step2Errors.length > 0) {
      step2Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      setStep(2);
      return;
    }

    // ── Step 3 validation ─────────────────────────────────────────────────
    const step3Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    if (!data.barangay) step3Errors.push({ field: 'barangay', message: t('required') });
    if (!data.streetAddress) step3Errors.push({ field: 'streetAddress', message: t('required') });

    if (step3Errors.length > 0) {
      step3Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      setStep(3);
      return;
    }

    // ── Step 4 validation ─────────────────────────────────────────────────
    const step4Errors: { field: keyof RegistrationFormData; message: string }[] = [];

    if (!data.idType) step4Errors.push({ field: 'idType', message: t('required') });
    if (!data.idNumber) step4Errors.push({ field: 'idNumber', message: t('required') });
    if (!data.idFrontImage) step4Errors.push({ field: 'idFrontImage', message: t('required') });
    if (!data.selfieImage) step4Errors.push({ field: 'selfieImage', message: t('required') });
    if (!data.agreedToTerms) step4Errors.push({ field: 'agreedToTerms', message: t('required') });

    if (step4Errors.length > 0) {
      step4Errors.forEach(({ field, message }) => setError(field, { type: 'manual', message }));
      setStep(4);
      return;
    }

    setIsLoading(true);
    try {
      await saveFormData();
      const response = await authApiClient.post('/register', { email: data.email });
      if (!response || !response.data) throw new Error('Invalid response from server');
      await storeRegistrationData(data);
      setSubmittedEmail(data.email);
      await clearSavedFormData();
      router.replace({ pathname: '/(auth)/Otp', params: { email: data.email } });
    } catch (error: any) {
      if (error?.response?.status === 400) {
        setError('email', { type: 'server', message: error?.response?.data?.detail || 'Email already registered' });
        setStep(2);
      } else if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error' || error?.message?.includes('Network request failed')) {
        setNetworkError('Network error. Please check your connection and try again.');
      } else if (error?.code === 'ETIMEDOUT') {
        setNetworkError('Request timed out. Please try again.');
      } else if (error?.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, message]) => setError(key as keyof RegistrationFormData, { type: 'server', message: message as string }));
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
          rules={{
            required: t('required'),
            validate: (value) => validateFirstName(value) || true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.firstName ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={() => {
                  onBlur();
                  const err = validateFirstName(value);
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
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-1 bg-white">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={(text) => onChange(toProperCase(text))}
                value={value}
                placeholder="Santos"
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
      </View>

      {/* Last Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('lastName')} *</Text>
        <Controller
          control={control}
          name="lastName"
          rules={{
            required: t('required'),
            validate: (value) => validateLastName(value) || true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.lastName ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={() => {
                  onBlur();
                  const err = validateLastName(value);
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

      {/* Suffix — picker modal */}
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

            {/* None option */}
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
                {watch('suffix') === option && <Check size={18} color="#2563EB" />}
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

          {/* Tagalog month label overlay */}
          {i18n.language === 'tl' && (
            <View className="flex-row justify-center items-center mb-3 bg-primary-50 rounded-xl py-2 px-4">
              <Text className="text-base font-semibold text-primary-700">
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

          <TouchableOpacity onPress={() => setShowDatePicker(false)} className="bg-primary-600 rounded-xl py-4 items-center mt-4" activeOpacity={0.7}>
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
            {[{ label: t('male'), value: 'male' }, { label: t('female'), value: 'female' }, { label: t('other'), value: 'other' }].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => { setValue('gender', option.value); clearErrors('gender'); setShowGenderModal(false); saveFormData(); }}
                className={`py-4 border-b border-neutral-200 ${watch('gender') === option.value ? 'bg-primary-50' : ''}`}
                activeOpacity={0.7}
              >
                <Text className="text-base text-neutral-900">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => setStep(2)} className="bg-primary-600 rounded-xl py-4 items-center shadow-sm" activeOpacity={0.85}>
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

      {/* Email */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('email')} *</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: t('required'),
            validate: (value) => {
              const err = validateEmail(value);
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
                  const err = validateEmail(value);
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

      {/* Phone Number with +63 prefix */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('phoneNumber')} *</Text>
        <Controller
          control={control}
          name="phoneNumber"
          rules={{
            required: t('required'),
            validate: (value) => {
              // Strip leading 0 for the validateContactNumber function (expects 10 digits)
              const stripped = value.startsWith('0') ? value.slice(1) : value;
              const err = validateContactNumber(stripped);
              return err || true;
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.phoneNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <Phone size={20} color="#6B7280" />
              {/* Static +63 prefix */}
              <View className="ml-3 mr-1 border-r border-neutral-300 pr-3">
                <Text className="text-base text-neutral-700 py-2.5">+63</Text>
              </View>
              <TextInput
                className="flex-1 ml-2 text-base text-neutral-900 py-2.5"
                onBlur={() => {
                  onBlur();
                  const stripped = value.startsWith('0') ? value.slice(1) : value;
                  const err = validateContactNumber(stripped);
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

      {/* Password */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('password')} *</Text>
        <Controller
          control={control}
          name="password"
          rules={{ required: t('required'), minLength: { value: 8, message: t('minLength', { count: 8 }) } }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.password ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1" activeOpacity={0.7}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
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

      <View className="flex-row gap-3">
        <TouchableOpacity onPress={() => setStep(1)} className="flex-1 bg-neutral-100 rounded-xl py-4 items-center" activeOpacity={0.7}>
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStep(3)} className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm" activeOpacity={0.85}>
          <Text className="text-white font-semibold text-base">{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 3: Address Info ──────────────────────────────────────────────────
  const renderStep3 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-6">{t('addressInfo')}</Text>

      {/* Barangay */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('barangay')} *</Text>
        <Controller
          control={control}
          name="barangay"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowBarangayModal(true)}
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${errors.barangay ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}
              activeOpacity={0.7}
            >
              <MapPin size={20} color="#6B7280" />
              <Text className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {value || t('selectBarangay')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        <ErrorMessage message={errors.barangay?.message} />
      </View>

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
                  className={`py-4 border-b border-neutral-200 ${watch('barangay') === brgy ? 'bg-primary-50' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-neutral-900">{brgy}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Street Address */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('streetAddress')} *</Text>
        <Controller
          control={control}
          name="streetAddress"
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.streetAddress ? 'border-error-500 bg-error-50' : 'border-neutral-200'}`}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="123 Rizal Street"
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
          )}
        />
        <ErrorMessage message={errors.streetAddress?.message} />
      </View>

      {/* Zone */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('zone')}</Text>
        <Controller
          control={control}
          name="zone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-1 bg-white">
              <MapPin size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Purok 1"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity onPress={() => setStep(2)} className="flex-1 bg-neutral-100 rounded-xl py-4 items-center" activeOpacity={0.7}>
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStep(4)} className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm" activeOpacity={0.85}>
          <Text className="text-white font-semibold text-base">{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 4: ID Verification ───────────────────────────────────────────────
  const renderStep4 = () => (
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
                  className={`py-4 border-b border-neutral-200 ${watch('idType') === type ? 'bg-primary-50' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-neutral-900">{t(type)}</Text>
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
              {value ? (
                <View className="border-2 border-neutral-200 rounded-xl p-4 bg-white">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <ImageIcon size={20} color="#10B981" />
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>{getFileName(value)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeImage('idFrontImage')} className="bg-error-100 rounded-lg p-2" activeOpacity={0.7}>
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('idFrontImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.idFrontImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'}`}
                  activeOpacity={0.7}
                >
                  <Camera size={32} color="#9CA3AF" />
                  <Text className="text-primary-600 font-medium mt-2">{t('tapToUpload')}</Text>
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
          render={({ field: { value } }) => (
            <>
              {value ? (
                <View className="border-2 border-neutral-200 rounded-xl p-4 bg-white">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <ImageIcon size={20} color="#10B981" />
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>{getFileName(value)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeImage('idBackImage')} className="bg-error-100 rounded-lg p-2" activeOpacity={0.7}>
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('idBackImage')}
                  className="border-2 border-dashed border-neutral-300 rounded-xl p-6 items-center bg-neutral-50"
                  activeOpacity={0.7}
                >
                  <Camera size={32} color="#9CA3AF" />
                  <Text className="text-primary-600 font-medium mt-2">{t('tapToUpload')}</Text>
                  <Text className="text-neutral-500 text-xs mt-1">Back side of your ID</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        />
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
              {value ? (
                <View className="border-2 border-neutral-200 rounded-xl p-4 bg-white">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <ImageIcon size={20} color="#10B981" />
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>{getFileName(value)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeImage('selfieImage')} className="bg-error-100 rounded-lg p-2" activeOpacity={0.7}>
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('selfieImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.selfieImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'}`}
                  activeOpacity={0.7}
                >
                  <Camera size={32} color="#9CA3AF" />
                  <Text className="text-primary-600 font-medium mt-2">{t('tapToUpload')}</Text>
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
              <Camera size={24} color="#2563EB" />
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
      <View className="mb-6">
        <Controller
          control={control}
          name="agreedToTerms"
          rules={{ required: t('required') }}
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity onPress={() => { onChange(!value); saveFormData(); }} className="flex-row items-start mb-2" activeOpacity={0.7}>
              <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${value ? 'bg-primary-600 border-primary-600' : errors.agreedToTerms ? 'border-error-500' : 'border-neutral-300'}`}>
                {value && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text className="text-sm text-neutral-700 flex-1">{t('agreeTerms')}</Text>
            </TouchableOpacity>
          )}
        />
        <ErrorMessage message={errors.agreedToTerms?.message} />
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
        <TouchableOpacity onPress={() => setStep(3)} className="flex-1 bg-neutral-100 rounded-xl py-4 items-center" activeOpacity={0.7}>
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isLoading} className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm" activeOpacity={0.85}>
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-semibold text-base">{t('submit')}</Text>}
        </TouchableOpacity>
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
                className={`px-3.5 py-2 rounded-lg ${i18n.language === lang ? 'bg-primary-600' : 'bg-neutral-100'}`}
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
            {[1, 2, 3, 4].map((s) => (
              <View key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary-600' : 'bg-neutral-200'}`} />
            ))}
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-neutral-600 text-sm">{t('haveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)')} activeOpacity={0.7}>
              <Text className="text-primary-600 font-semibold text-sm">{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}