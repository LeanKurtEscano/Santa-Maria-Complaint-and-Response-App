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
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authApiClient } from '@/lib/client/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import convertImageToBase64 from '@/utils/general/image';

export default function RegisterScreen({ navigation }: any) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'idFrontImage' | 'idBackImage' | 'selfieImage' | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  });

  // Helper functions for date limits
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

  // Load saved registration data on component mount
  useEffect(() => {
    loadSavedRegistrationData();
  }, []);

  const loadSavedRegistrationData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('registrationFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Restore form values
        reset(parsedData);
        
        // Restore age if available
        if (parsedData.age) {
          setAge(parsedData.age);
        }
        
        // Restore selected date if dateOfBirth exists
        if (parsedData.dateOfBirth) {
          const [month, day, year] = parsedData.dateOfBirth.split('/');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          setSelectedDate(date);
        }
        
        console.log('Loaded saved registration data');
      }
    } catch (error) {
      console.error('Error loading saved registration data:', error);
    }
  };

  const saveFormData = async () => {
    try {
      const currentData = watch();
      const dataToSave = {
        ...currentData,
        age: age,
      };
      await AsyncStorage.setItem('registrationFormData', JSON.stringify(dataToSave));
      console.log('Form data saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

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
      setSelectedDate(selectedDate);
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

  const storeRegistrationData = async (data: RegistrationFormData) => {
    const [idFrontBase64, idBackBase64, selfieBase64] = await Promise.all([
      data.idFrontImage ? convertImageToBase64(data.idFrontImage) : null,
      data.idBackImage ? convertImageToBase64(data.idBackImage) : null,
      data.selfieImage ? convertImageToBase64(data.selfieImage) : null,
    ]);
    try {
      const registrationData = {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        suffix: data.suffix,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        barangay: data.barangay,
        streetAddress: data.streetAddress,
        zone: data.zone,
        idType: data.idType,
        idNumber: data.idNumber,
        idFrontImage: idFrontBase64,
        idBackImage: idBackBase64,
        selfieImage: selfieBase64,
        agreedToTerms: data.agreedToTerms,
        age: age,
      };

      await AsyncStorage.setItem('registrationData', JSON.stringify(registrationData));
      console.log('Registration data stored successfully in AsyncStorage');
    } catch (error) {
      console.error('Error storing registration data:', error);
      throw error;
    }
  };

  const clearSavedFormData = async () => {
    try {
      await AsyncStorage.removeItem('registrationFormData');
      console.log('Saved form data cleared');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setNetworkError(null);

    const validationErrors: { [key: string]: string } = {};

    if (!data.firstName) validationErrors.firstName = t('required');
    if (!data.lastName) validationErrors.lastName = t('required');
    if (!data.dateOfBirth) validationErrors.dateOfBirth = t('required');
    if (!data.gender) validationErrors.gender = t('required');

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

    if (!data.barangay) validationErrors.barangay = t('required');
    if (!data.streetAddress) validationErrors.streetAddress = t('required');

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

    // Save form data before submitting
    await saveFormData();

    setIsLoading(true);

    try {
      // Send only email to backend
      const response = await authApiClient.post('/register', {
        email: data.email,
      });

      console.log('Registration API response:', response.data);

      // Store all registration data in AsyncStorage after successful API call
      await storeRegistrationData(data);

      // Set submitted email for navigation
      setSubmittedEmail(data.email);

      // Navigate to OTP screen
      router.replace({
        pathname: "/(auth)/Otp",
        params: { email: data.email },
      });

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error?.response?.status === 400) {
        setError('email', {
          type: 'server',
          message: error?.response?.data?.detail || 'Email already registered',
        });
        // Navigate back to step 2 (Contact Info) where email field is
        setStep(2);
      }
      // Handle network errors
      else if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        setNetworkError('Network error. Please check your connection and try again.');
      }
      // Handle timeout errors
      else if (error?.code === 'ETIMEDOUT') {
        setNetworkError('Request timed out. Please try again.');
      }
      // Handle validation errors from server
      else if (error?.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, message]) => {
          setError(key as keyof RegistrationFormData, {
            type: 'server',
            message: message as string,
          });
        });
      }
      // Handle general error
      else {
        setError('root.general', {
          type: 'server',
          message: error?.response?.data?.message || error?.message || 'Registration failed',
        });
      }
    } finally {
      setIsLoading(false);
    }
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.firstName ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.lastName ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${errors.dateOfBirth ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                }`}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'
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
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={getMaxDate()}
          minimumDate={getMinDate()}
          textColor="#000000"
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide">
          <TouchableOpacity
            className="flex-1 justify-end bg-black/50"
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl p-6 pb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-neutral-900">
                    {t('Select Date of Birth')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="p-2"
                    activeOpacity={0.7}
                  >
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

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
                  className="bg-primary-600 rounded-xl py-4 items-center mt-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-base">Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
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
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${errors.gender ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                }`}
              activeOpacity={0.7}
            >
              <User size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'
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
                  className={`py-4 border-b border-neutral-200 ${watch('gender') === option.value ? 'bg-primary-50' : ''
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.email ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                }`}
            >
              <Mail size={20} color={errors.email ? '#EF4444' : '#6B7280'} />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900 py-2.5"
                onBlur={onBlur}
                onChangeText={(text) => {
                  onChange(text);
                  clearErrors('email');
                  setNetworkError(null);
                }}
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
          <View className="flex-row items-center mt-2 px-1">
            <View className="mr-1.5 flex-shrink-0">
              <AlertCircle size={14} color="#EF4444" />
            </View>
            <Text className="text-error-600 text-xs flex-1">{errors.email.message}</Text>
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.phoneNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.password ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.confirmPassword ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${errors.barangay ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                }`}
              activeOpacity={0.7}
            >
              <MapPin size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'
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
                  className={`py-4 border-b border-neutral-200 ${watch('barangay') === brgy ? 'bg-primary-50' : ''
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.streetAddress ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
              className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${errors.idType ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                }`}
              activeOpacity={0.7}
            >
              <CreditCard size={20} color="#6B7280" />
              <Text
                className={`flex-1 ml-3 text-base ${value ? 'text-neutral-900' : 'text-neutral-400'
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
                  className={`py-4 border-b border-neutral-200 ${watch('idType') === type ? 'bg-primary-50' : ''
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
              className={`flex-row items-center border-2 rounded-xl px-4 py-1 bg-white ${errors.idNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
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
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.idFrontImage
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
                  className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.selfieImage
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
                className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${value
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
          disabled={isLoading}
          className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          {isLoading ? (
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
              className={`px-3.5 py-2 rounded-lg ${i18n.language === 'en' ? 'bg-primary-600' : 'bg-neutral-100'
                }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-medium ${i18n.language === 'en' ? 'text-white' : 'text-neutral-700'
                  }`}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => changeLanguage('tl')}
              className={`px-3.5 py-2 rounded-lg ${i18n.language === 'tl' ? 'bg-primary-600' : 'bg-neutral-100'
                }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-medium ${i18n.language === 'tl' ? 'text-white' : 'text-neutral-700'
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
                className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary-600' : 'bg-neutral-200'
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

