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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { useSubmitForm } from '@/hooks/general/useSubmitForm';
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
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen({ navigation }: any) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<
    'idFrontImage' | 'idBackImage' | 'selfieImage' | null
  >(null);
  const [age, setAge] = useState<number | null>(null);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
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

  const registerMutation = useSubmitForm({
    url: '/auth/register',
    method: 'post',
    onSuccess: (data) => {
      console.log('Registration successful:', data);
      navigation.navigate('Login');
    },
  });

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const calculatedAge = calculateAge(selectedDate);
      setAge(calculatedAge);

      // Format date as MM/DD/YYYY
      const formattedDate = `${String(selectedDate.getMonth() + 1).padStart(
        2,
        '0'
      )}/${String(selectedDate.getDate()).padStart(2, '0')}/${selectedDate.getFullYear()}`;

      setValue('dateOfBirth', formattedDate);
      clearErrors('dateOfBirth');
    }
  };

  const handleImagePick = async (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
    setCurrentImageField(field);
    setShowImagePickerModal(true);
  };

  const pickFromCamera = async () => {
    if (!currentImageField) return;

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Camera permission is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setValue(currentImageField, result.assets[0].uri);
      clearErrors(currentImageField);
    }

    setShowImagePickerModal(false);
    setCurrentImageField(null);
  };

  const pickFromLibrary = async () => {
    if (!currentImageField) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setValue(currentImageField, result.assets[0].uri);
      clearErrors(currentImageField);
    }

    setShowImagePickerModal(false);
    setCurrentImageField(null);
  };

  const removeImage = (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
    setValue(field, undefined);
  };

  const getFileName = (uri: string | undefined) => {
    if (!uri) return '';
    const parts = uri.split('/');
    return parts[parts.length - 1];
  };

  const onSubmit = (data: RegistrationFormData) => {
    // Manual validation
    const validationErrors: { [key: string]: string } = {};

    // Personal Info
    if (!data.firstName) validationErrors.firstName = t('required');
    if (!data.lastName) validationErrors.lastName = t('required');
    if (!data.dateOfBirth) validationErrors.dateOfBirth = t('required');
    if (!data.gender) validationErrors.gender = t('required');

    // Contact
    if (!data.email) {
      validationErrors.email = t('required');
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      validationErrors.email = t('invalidEmail');
    }

    if (!data.phoneNumber) validationErrors.phoneNumber = t('required');

    if (!data.password) {
      validationErrors.password = t('required');
    } else if (data.password.length < 8) {
      validationErrors.password = t('minLength', { count: 8 });
    }

    if (data.password !== data.confirmPassword) {
      validationErrors.confirmPassword = t('passwordMismatch');
    }

    // Address
    if (!data.barangay) validationErrors.barangay = t('required');
    if (!data.streetAddress) validationErrors.streetAddress = t('required');

    // ID Verification
    if (!data.idType) validationErrors.idType = t('required');
    if (!data.idNumber) validationErrors.idNumber = t('required');
    if (!data.idFrontImage) validationErrors.idFrontImage = t('required');
    if (!data.selfieImage) validationErrors.selfieImage = t('required');

    // Terms
    if (!data.agreedToTerms) {
      validationErrors.agreedToTerms = t('required');
    }

    // Set errors if any
    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([key, message]) => {
        setError(key as keyof RegistrationFormData, {
          type: 'manual',
          message,
        });
      });
      return;
    }

    registerMutation.mutate(data, {
      onError: (error: any) => {
        if (error?.type === 'validation' && error.errors) {
          Object.entries(error.errors).forEach(([key, message]) => {
            setError(key as keyof RegistrationFormData, {
              type: 'server',
              message: message as string,
            });
          });
        } else {
          setError('root.general', {
            type: 'server',
            message: error?.general || 'Registration failed',
          });
        }
      },
    });
  };

  const renderStep1 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-6">{t('personalInfo')}</Text>

      {/* First Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('firstName')} *
        </Text>
        <Controller
          control={control}
          name="firstName"
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.firstName ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Juan"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
        {errors.firstName && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.firstName.message}</Text>
          </View>
        )}
      </View>

      {/* Middle Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('middleName')}</Text>
        <Controller
          control={control}
          name="middleName"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-1 bg-white">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Santos"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
      </View>

      {/* Last Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('lastName')} *
        </Text>
        <Controller
          control={control}
          name="lastName"
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.lastName ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Dela Cruz"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
        {errors.lastName && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.lastName.message}</Text>
          </View>
        )}
      </View>

      {/* Suffix */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('suffix')}</Text>
        <Controller
          control={control}
          name="suffix"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-1 bg-white">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Jr., Sr., III"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        />
      </View>

      {/* Date of Birth */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('dateOfBirth')} *
        </Text>
        <Controller
          control={control}
          name="dateOfBirth"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                errors.dateOfBirth ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${
                  value ? 'text-neutral-900' : 'text-neutral-400'
                }`}
              >
                {value || 'MM/DD/YYYY'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        {errors.dateOfBirth && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.dateOfBirth.message}</Text>
          </View>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            watch('dateOfBirth')
              ? new Date(watch('dateOfBirth'))
              : new Date(2000, 0, 1)
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-6">
              <Text className="text-xl font-bold text-neutral-900 mb-4">
                {t('Select Date of Birth')}
              </Text>
              <DateTimePicker
                value={
                  watch('dateOfBirth')
                    ? new Date(watch('dateOfBirth'))
                    : new Date(2000, 0, 1)
                }
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="bg-primary-600 rounded-xl py-4 items-center mt-4"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Age (Auto-calculated, Disabled) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">{t('age')}</Text>
        <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-3.5 bg-neutral-50">
          <Calendar size={20} color="#6B7280" />
          <Text className="flex-1 ml-3 text-base text-neutral-500">
            {age !== null ? `${age} years old` : 'Age will be calculated'}
          </Text>
        </View>
        <Text className="text-xs text-neutral-500 mt-1">
          Age is automatically calculated from your date of birth
        </Text>
      </View>

      {/* Gender */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('gender')} *
        </Text>
        <Controller
          control={control}
          name="gender"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowGenderModal(true)}
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                errors.gender ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
              activeOpacity={0.7}
            >
              <User size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${
                  value ? 'text-neutral-900' : 'text-neutral-400'
                }`}
              >
                {value ? t(value) : t('Select Gender')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        {errors.gender && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.gender.message}</Text>
          </View>
        )}
      </View>

      {/* Gender Modal */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              {t('Select Gender')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowGenderModal(false)}
              className="absolute top-6 right-6"
              activeOpacity={0.7}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <View>
              {[
                { label: t('male'), value: 'male' },
                { label: t('female'), value: 'female' },
                { label: t('other'), value: 'other' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setValue('gender', option.value);
                    clearErrors('gender');
                    setShowGenderModal(false);
                  }}
                  className={`py-4 border-b border-neutral-200 ${
                    watch('gender') === option.value ? 'bg-primary-50' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className="text-base text-neutral-900">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={() => setStep(2)}
        className="bg-primary-600 rounded-xl py-4 items-center shadow-sm"
        activeOpacity={0.85}
      >
        <Text className="text-white font-semibold text-base">{t('continue')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-6">{t('contactInfo')}</Text>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('email')} *
        </Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: t('required'),
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: t('invalidEmail'),
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.email ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="juan.delacruz@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}
        />
        {errors.email && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.email.message}</Text>
          </View>
        )}
      </View>

      {/* Phone Number */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('phoneNumber')} *
        </Text>
        <Controller
          control={control}
          name="phoneNumber"
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.phoneNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
              <Phone size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="+63 912 345 6789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          )}
        />
        {errors.phoneNumber && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.phoneNumber.message}</Text>
          </View>
        )}
      </View>

      {/* Password */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('password')} *
        </Text>
        <Controller
          control={control}
          name="password"
          rules={{
            required: t('required'),
            minLength: {
              value: 8,
              message: t('minLength', { count: 8 }),
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.password ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          )}
        />
        {errors.password && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.password.message}</Text>
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('confirmPassword')} *
        </Text>
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: t('required'),
            validate: (value) => value === password || t('passwordMismatch'),
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.confirmPassword ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          )}
        />
        {errors.confirmPassword && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">
              {errors.confirmPassword.message}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setStep(1)}
          className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStep(3)}
          className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-6">{t('addressInfo')}</Text>

      {/* Barangay */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('barangay')} *
        </Text>
        <Controller
          control={control}
          name="barangay"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowBarangayModal(true)}
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                errors.barangay ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
              activeOpacity={0.7}
            >
              <MapPin size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${
                  value ? 'text-neutral-900' : 'text-neutral-400'
                }`}
              >
                {value || t('selectBarangay')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        {errors.barangay && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.barangay.message}</Text>
          </View>
        )}
      </View>

      {/* Barangay Modal */}
      <Modal
        visible={showBarangayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBarangayModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              {t('selectBarangay')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowBarangayModal(false)}
              className="absolute top-6 right-6"
              activeOpacity={0.7}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <ScrollView>
              {BARANGAYS.map((brgy) => (
                <TouchableOpacity
                  key={brgy}
                  onPress={() => {
                    setValue('barangay', brgy);
                    clearErrors('barangay');
                    setShowBarangayModal(false);
                  }}
                  className={`py-4 border-b border-neutral-200 ${
                    watch('barangay') === brgy ? 'bg-primary-50' : ''
                  }`}
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
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('streetAddress')} *
        </Text>
        <Controller
          control={control}
          name="streetAddress"
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.streetAddress ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
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
        {errors.streetAddress && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">
              {errors.streetAddress.message}
            </Text>
          </View>
        )}
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
        <TouchableOpacity
          onPress={() => setStep(2)}
          className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStep(4)}
          className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text className="text-2xl font-bold text-neutral-900 mb-2">{t('idVerification')}</Text>
      <Text className="text-sm text-neutral-600 mb-6">{t('idVerificationNote')}</Text>

      {/* ID Type */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('idType')} *
        </Text>
        <Controller
          control={control}
          name="idType"
          rules={{ required: t('required') }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              onPress={() => setShowIdTypeModal(true)}
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                errors.idType ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
              activeOpacity={0.7}
            >
              <CreditCard size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${
                  value ? 'text-neutral-900' : 'text-neutral-400'
                }`}
              >
                {value ? t(value) : t('selectIdType')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        />
        {errors.idType && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.idType.message}</Text>
          </View>
        )}
      </View>

      {/* ID Type Modal */}
      <Modal
        visible={showIdTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIdTypeModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              {t('selectIdType')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowIdTypeModal(false)}
              className="absolute top-6 right-6"
              activeOpacity={0.7}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <ScrollView>
              {ID_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setValue('idType', type);
                    clearErrors('idType');
                    setShowIdTypeModal(false);
                  }}
                  className={`py-4 border-b border-neutral-200 ${
                    watch('idType') === type ? 'bg-primary-50' : ''
                  }`}
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
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('idNumber')} *
        </Text>
        <Controller
          control={control}
          name="idNumber"
          rules={{ required: t('required') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${
                errors.idNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
              }`}
            >
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
        {errors.idNumber && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.idNumber.message}</Text>
          </View>
        )}
      </View>

      {/* ID Front Image */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('uploadIdFront')} *
        </Text>
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
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>
                        {getFileName(value)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeImage('idFrontImage')}
                      className="bg-error-100 rounded-lg p-2"
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('idFrontImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${
                    errors.idFrontImage
                      ? 'border-error-500 bg-error-50'
                      : 'border-neutral-300 bg-neutral-50'
                  }`}
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
        {errors.idFrontImage && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.idFrontImage.message}</Text>
          </View>
        )}
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
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>
                        {getFileName(value)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeImage('idBackImage')}
                      className="bg-error-100 rounded-lg p-2"
                      activeOpacity={0.7}
                    >
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
        <Text className="text-sm font-medium text-neutral-700 mb-2">
          {t('uploadSelfie')} *
        </Text>
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
                      <Text className="ml-2 text-sm text-neutral-700 flex-1" numberOfLines={1}>
                        {getFileName(value)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeImage('selfieImage')}
                      className="bg-error-100 rounded-lg p-2"
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleImagePick('selfieImage')}
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${
                    errors.selfieImage
                      ? 'border-error-500 bg-error-50'
                      : 'border-neutral-300 bg-neutral-50'
                  }`}
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
        {errors.selfieImage && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.selfieImage.message}</Text>
          </View>
        )}
      </View>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowImagePickerModal(false);
          setCurrentImageField(null);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-xl font-bold text-neutral-900 mb-4">Choose Image Source</Text>
            <TouchableOpacity
              onPress={() => {
                setShowImagePickerModal(false);
                setCurrentImageField(null);
              }}
              className="absolute top-6 right-6"
              activeOpacity={0.7}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFromCamera}
              className="flex-row items-center bg-primary-50 rounded-xl p-4 mb-3"
              activeOpacity={0.7}
            >
              <Camera size={24} color="#2563EB" />
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-neutral-900">Take Photo</Text>
                <Text className="text-sm text-neutral-600">Use your camera to capture</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFromLibrary}
              className="flex-row items-center bg-neutral-50 rounded-xl p-4"
              activeOpacity={0.7}
            >
              <ImageIcon size={24} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-neutral-900">
                  Choose from Gallery
                </Text>
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
            <TouchableOpacity
              onPress={() => onChange(!value)}
              className="flex-row items-start mb-6"
              activeOpacity={0.7}
            >
              <View
                className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                  value
                    ? 'bg-primary-600 border-primary-600'
                    : errors.agreedToTerms
                    ? 'border-error-500'
                    : 'border-neutral-300'
                }`}
              >
                {value && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text className="text-sm text-neutral-700 flex-1">{t('agreeTerms')}</Text>
            </TouchableOpacity>
          )}
        />
        {errors.agreedToTerms && (
          <View className="flex-row items-center mt-2">
            <AlertCircle size={14} color="#EF4444" />
            <Text className="text-error-600 text-xs ml-1">{errors.agreedToTerms.message}</Text>
          </View>
        )}
      </View>

      {/* General Error */}
      {errors.root?.general && (
        <View className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
          <View className="flex-row items-center">
            <AlertCircle size={20} color="#EF4444" />
            <Text className="text-error-700 font-medium ml-2">
              {errors.root.general.message}
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setStep(3)}
          className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
          activeOpacity={0.7}
        >
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={registerMutation.isPending}
          className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">{t('submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <TouchableOpacity
              onPress={() => changeLanguage('en')}
              className={`px-3.5 py-2 rounded-lg ${
                i18n.language === 'en' ? 'bg-primary-600' : 'bg-neutral-100'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-medium ${
                  i18n.language === 'en' ? 'text-white' : 'text-neutral-700'
                }`}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => changeLanguage('tl')}
              className={`px-3.5 py-2 rounded-lg ${
                i18n.language === 'tl' ? 'bg-primary-600' : 'bg-neutral-100'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-medium ${
                  i18n.language === 'tl' ? 'text-white' : 'text-neutral-700'
                }`}
              >
                TL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Text className="text-3xl font-bold text-neutral-900 mb-8">{t('register')}</Text>

          {/* Progress Indicator */}
          <View className="flex-row mb-8 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                className={`flex-1 h-1.5 rounded-full ${
                  s <= step ? 'bg-primary-600' : 'bg-neutral-200'
                }`}
              />
            ))}
          </View>

          {/* Form Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Back to Login */}
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