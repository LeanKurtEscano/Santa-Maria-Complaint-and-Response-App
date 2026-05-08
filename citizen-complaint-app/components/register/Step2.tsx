import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Controller, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Lock, WifiOff, Eye, EyeOff, X, Check } from 'lucide-react-native';
import { RegistrationFormData } from '@/types/auth/register';
import { THEME } from '@/constants/theme';
import { BARANGAYS } from '@/constants/auth/registration';
import {
  validateEmail,
  validateContactNumber,
  validatePassword,
} from '@/utils/validation/register';
import ErrorMessage from './ErrorMessage';

interface Step2Props {
  form: UseFormReturn<RegistrationFormData>;
  onNext: () => void;
  onBack: () => void;
  networkError: string | null;
  setNetworkError: (error: string | null) => void;
  saveFormData: () => Promise<void>;
}

const Step2ContactInfo = ({
  form,
  onNext,
  onBack,
  networkError,
  setNetworkError,
  saveFormData,
}: Step2Props) => {
  const { t } = useTranslation();
  const { control, formState: { errors }, watch, setValue, setError, clearErrors } = form;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);

  const password = watch('password');

  const handlePhoneNumberChange = (text: string, onChange: (val: string) => void) => {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('63')) {
      digits = '0' + digits.slice(2);
    }
    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }
    onChange(digits);
  };

  return (
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

      {/* Phone Number */}
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
                placeholder="09123456789"
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

      {/* Barangay Modal */}
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
                  onPress={() => {
                    setValue('barangay', brgy);
                    clearErrors('barangay');
                    setShowBarangayModal(false);
                    saveFormData();
                  }}
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
        <TouchableOpacity onPress={onBack} className="flex-1 bg-neutral-100 rounded-xl py-4 items-center" activeOpacity={0.7}>
          <Text className="text-neutral-700 font-semibold text-base">{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          style={{ backgroundColor: THEME.primary }}
          className="flex-1 rounded-xl py-4 items-center shadow-sm"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-base">{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Step2ContactInfo;