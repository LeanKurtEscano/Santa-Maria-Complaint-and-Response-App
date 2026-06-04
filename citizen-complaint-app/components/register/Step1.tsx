import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Controller, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  User,
  ChevronDown,
  X,
  Check,
  Calendar,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RegistrationFormData } from '@/types/auth/register';
import { THEME } from '@/constants/theme';
import { TAGALOG_MONTHS } from '@/constants/localization/date';
import {
  validateFirstName,
  validateMiddleName,
  validateLastName,
} from '@/utils/validation/register';
import ErrorMessage from './ErrorMessage';

const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV'];

interface Step1Props {
  form: UseFormReturn<RegistrationFormData>;
  onNext: () => void;
  age: number | null;
  setAge: (age: number | null) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  saveFormData: () => Promise<void>;
}

const Step1PersonalInfo = ({
  form,
  onNext,
  age,
  setAge,
  selectedDate,
  setSelectedDate,
  saveFormData,
}: Step1Props) => {
  const { t, i18n } = useTranslation();
  const { control, formState: { errors }, watch, setValue, setError, clearErrors } = form;

  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSuffixModal, setShowSuffixModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getMinDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 85);
    return date;
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 12);
    return date;
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setAge(calculateAge(date));
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
      setValue('dateOfBirth', formattedDate);
      clearErrors('dateOfBirth');
      saveFormData();
    }
  };

  const toProperCase = (text: string): string =>
    text.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
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

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
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
                onPress={() => {
                  setValue('gender', option.value);
                  clearErrors('gender');
                  setShowGenderModal(false);
                  saveFormData();
                }}
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
        onPress={onNext}
        style={{ backgroundColor: THEME.primary }}
        className="rounded-xl py-4 items-center shadow-sm"
        activeOpacity={0.85}
      >
        <Text className="text-white font-semibold text-base">{t('continue')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Step1PersonalInfo;