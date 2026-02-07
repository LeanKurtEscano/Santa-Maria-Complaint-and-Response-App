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
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useSubmitForm } from '@/hooks/general/useSubmitForm';
import { useRouter } from 'expo-router';
import { RegistrationFormData } from '@/types/auth/register';
import { BARANGAYS } from '@/constants/auth/registration';
import { ID_TYPES } from '@/constants/auth/registration';

export default function RegisterScreen({ navigation }: any) {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(1);
    const [showGenderModal, setShowGenderModal] = useState(false);
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [showIdTypeModal, setShowIdTypeModal] = useState(false);
    const [formData, setFormData] = useState<RegistrationFormData>({
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
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const registerMutation = useSubmitForm<RegistrationFormData>({
        url: '/auth/register',
        method: 'post',
        validators: [
            (data) => {
                const errors: { [key: string]: string } = {};

                // Personal Info
                if (!data.firstName) errors.firstName = t('required');
                if (!data.lastName) errors.lastName = t('required');
                if (!data.dateOfBirth) errors.dateOfBirth = t('required');
                if (!data.gender) errors.gender = t('required');

                // Contact
                if (!data.email) errors.email = t('required');
                if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
                    errors.email = t('invalidEmail');
                }
                if (!data.phoneNumber) errors.phoneNumber = t('required');
                if (!data.password) errors.password = t('required');
                if (data.password && data.password.length < 8) {
                    errors.password = t('minLength', { count: 8 });
                }
                if (data.password !== data.confirmPassword) {
                    errors.confirmPassword = t('passwordMismatch');
                }

                // Address
                if (!data.barangay) errors.barangay = t('required');
                if (!data.streetAddress) errors.streetAddress = t('required');

                // ID Verification
                if (!data.idType) errors.idType = t('required');
                if (!data.idNumber) errors.idNumber = t('required');
                if (!data.idFrontImage) errors.idFrontImage = t('required');
                if (!data.selfieImage) errors.selfieImage = t('required');

                // Terms
                if (!data.agreedToTerms) {
                    errors.agreedToTerms = t('required');
                }

                return Object.keys(errors).length > 0 ? errors : null;
            },
        ],
        onSuccess: (data) => {
            console.log('Registration successful:', data);
            navigation.navigate('Login');
        },
    });

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const handleImagePick = async (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData({ ...formData, [field]: result.assets[0].uri });
        }
    };

    const updateField = (field: keyof RegistrationFormData, value: any) => {
        setFormData({ ...formData, [field]: value });
        setErrors({ ...errors, [field]: '' });
    };

    const handleSubmit = () => {
        registerMutation.mutate(formData, {
            onError: (error: any) => {
                if (error?.type === 'validation') {
                    setErrors(error.errors);
                } else {
                    setErrors({ general: error?.general || 'Registration failed' });
                }
            },
        });
    };

    const renderStep1 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-6">
                {t('personalInfo')}
            </Text>

            {/* First Name */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('firstName')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                    placeholder="Juan"
                />
                {errors.firstName && (
                    <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>
                )}
            </View>

            {/* Middle Name */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('middleName')}
                </Text>
                <TextInput
                    className="border-2 border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={formData.middleName}
                    onChangeText={(text) => updateField('middleName', text)}
                    placeholder="Santos"
                />
            </View>

            {/* Last Name */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('lastName')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.lastName}
                    onChangeText={(text) => updateField('lastName', text)}
                    placeholder="Dela Cruz"
                />
                {errors.lastName && (
                    <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>
                )}
            </View>

            {/* Suffix */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('suffix')}
                </Text>
                <TextInput
                    className="border-2 border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={formData.suffix}
                    onChangeText={(text) => updateField('suffix', text)}
                    placeholder="Jr., Sr., III"
                />
            </View>

            {/* Date of Birth */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('dateOfBirth')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.dateOfBirth}
                    onChangeText={(text) => updateField('dateOfBirth', text)}
                    placeholder="MM/DD/YYYY"
                />
                {errors.dateOfBirth && (
                    <Text className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</Text>
                )}
            </View>

            {/* Gender */}
            <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('gender')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowGenderModal(true)}
                    className={`border-2 rounded-xl px-4 py-3 flex-row justify-between items-center ${errors.gender ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    <Text className={formData.gender ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
                        {formData.gender ? t(formData.gender) : t('Select Gender')}
                    </Text>
                    <Text className="text-gray-400">▼</Text>
                </TouchableOpacity>
                {errors.gender && (
                    <Text className="text-red-500 text-xs mt-1">{errors.gender}</Text>
                )}

                {/* Gender Modal */}
                <Modal
                    visible={showGenderModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowGenderModal(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 max-h-96">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-900">
                                    {t('Select Gender')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                                    <Text className="text-2xl text-gray-500">×</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {[
                                    { label: t('male'), value: 'male' },
                                    { label: t('female'), value: 'female' },
                                    { label: t('other'), value: 'other' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => {
                                            updateField('gender', option.value);
                                            setShowGenderModal(false);
                                        }}
                                        className={`py-4 border-b border-gray-200 ${
                                            formData.gender === option.value ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <Text className={`text-base ${
                                            formData.gender === option.value
                                                ? 'text-blue-700 font-semibold'
                                                : 'text-gray-700'
                                        }`}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>

            <TouchableOpacity
                onPress={() => setStep(2)}
                className="bg-blue-700 rounded-xl py-4 items-center"
            >
                <Text className="text-white text-base font-bold">
                    {t('continue')}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-6">
                {t('contactInfo')}
            </Text>

            {/* Email */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('email')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.email}
                    onChangeText={(text) => updateField('email', text)}
                    placeholder="juan.delacruz@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {errors.email && (
                    <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
                )}
            </View>

            {/* Phone Number */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('phoneNumber')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.phoneNumber}
                    onChangeText={(text) => updateField('phoneNumber', text)}
                    placeholder="+63 912 345 6789"
                    keyboardType="phone-pad"
                />
                {errors.phoneNumber && (
                    <Text className="text-red-500 text-xs mt-1">{errors.phoneNumber}</Text>
                )}
            </View>

            {/* Password */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('password')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.password}
                    onChangeText={(text) => updateField('password', text)}
                    placeholder="••••••••"
                    secureTextEntry
                />
                {errors.password && (
                    <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
                )}
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('confirmPassword')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateField('confirmPassword', text)}
                    placeholder="••••••••"
                    secureTextEntry
                />
                {errors.confirmPassword && (
                    <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>
                )}
            </View>

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setStep(1)}
                    className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                >
                    <Text className="text-gray-700 text-base font-bold">
                        {t('back')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setStep(3)}
                    className="flex-1 bg-blue-700 rounded-xl py-4 items-center"
                >
                    <Text className="text-white text-base font-bold">
                        {t('continue')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-6">
                {t('addressInfo')}
            </Text>

            {/* Barangay */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('barangay')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowBarangayModal(true)}
                    className={`border-2 rounded-xl px-4 py-3 flex-row justify-between items-center ${errors.barangay ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    <Text className={formData.barangay ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
                        {formData.barangay || t('selectBarangay')}
                    </Text>
                    <Text className="text-gray-400">▼</Text>
                </TouchableOpacity>
                {errors.barangay && (
                    <Text className="text-red-500 text-xs mt-1">{errors.barangay}</Text>
                )}

                {/* Barangay Modal */}
                <Modal
                    visible={showBarangayModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowBarangayModal(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 max-h-96">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-900">
                                    {t('selectBarangay')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowBarangayModal(false)}>
                                    <Text className="text-2xl text-gray-500">×</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {BARANGAYS.map((brgy) => (
                                    <TouchableOpacity
                                        key={brgy}
                                        onPress={() => {
                                            updateField('barangay', brgy);
                                            setShowBarangayModal(false);
                                        }}
                                        className={`py-4 border-b border-gray-200 ${
                                            formData.barangay === brgy ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <Text className={`text-base ${
                                            formData.barangay === brgy
                                                ? 'text-blue-700 font-semibold'
                                                : 'text-gray-700'
                                        }`}>
                                            {brgy}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>

            {/* Street Address */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('streetAddress')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.streetAddress ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.streetAddress}
                    onChangeText={(text) => updateField('streetAddress', text)}
                    placeholder="123 Rizal Street"
                    multiline
                />
                {errors.streetAddress && (
                    <Text className="text-red-500 text-xs mt-1">{errors.streetAddress}</Text>
                )}
            </View>

            {/* Zone */}
            <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('zone')}
                </Text>
                <TextInput
                    className="border-2 border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={formData.zone}
                    onChangeText={(text) => updateField('zone', text)}
                    placeholder="Purok 1"
                />
            </View>

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setStep(2)}
                    className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                >
                    <Text className="text-gray-700 text-base font-bold">
                        {t('back')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setStep(4)}
                    className="flex-1 bg-blue-700 rounded-xl py-4 items-center"
                >
                    <Text className="text-white text-base font-bold">
                        {t('continue')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
                {t('idVerification')}
            </Text>
            <Text className="text-sm text-gray-600 mb-6">
                {t('idVerificationNote')}
            </Text>

            {/* ID Type */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('idType')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowIdTypeModal(true)}
                    className={`border-2 rounded-xl px-4 py-3 flex-row justify-between items-center ${errors.idType ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    <Text className={formData.idType ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
                        {formData.idType ? t(formData.idType) : t('selectIdType')}
                    </Text>
                    <Text className="text-gray-400">▼</Text>
                </TouchableOpacity>
                {errors.idType && (
                    <Text className="text-red-500 text-xs mt-1">{errors.idType}</Text>
                )}

                {/* ID Type Modal */}
                <Modal
                    visible={showIdTypeModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowIdTypeModal(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 max-h-96">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-900">
                                    {t('selectIdType')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowIdTypeModal(false)}>
                                    <Text className="text-2xl text-gray-500">×</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {ID_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => {
                                            updateField('idType', type);
                                            setShowIdTypeModal(false);
                                        }}
                                        className={`py-4 border-b border-gray-200 ${
                                            formData.idType === type ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <Text className={`text-base ${
                                            formData.idType === type
                                                ? 'text-blue-700 font-semibold'
                                                : 'text-gray-700'
                                        }`}>
                                            {t(type)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>

            {/* ID Number */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('idNumber')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3 text-base ${errors.idNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                    value={formData.idNumber}
                    onChangeText={(text) => updateField('idNumber', text)}
                    placeholder="A00-000-000000"
                />
                {errors.idNumber && (
                    <Text className="text-red-500 text-xs mt-1">{errors.idNumber}</Text>
                )}
            </View>

            {/* ID Front Image */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('uploadIdFront')} *
                </Text>
                <TouchableOpacity
                    onPress={() => handleImagePick('idFrontImage')}
                    className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.idFrontImage ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    {formData.idFrontImage ? (
                        <Image
                            source={{ uri: formData.idFrontImage }}
                            className="w-full h-40 rounded-lg"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="items-center">
                            <Text className="text-gray-500 text-sm">📷</Text>
                            <Text className="text-gray-500 text-sm mt-2">
                                {t('tapToUpload')}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                {errors.idFrontImage && (
                    <Text className="text-red-500 text-xs mt-1">{errors.idFrontImage}</Text>
                )}
            </View>

            {/* ID Back Image */}
            <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('uploadIdBack')}
                </Text>
                <TouchableOpacity
                    onPress={() => handleImagePick('idBackImage')}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
                >
                    {formData.idBackImage ? (
                        <Image
                            source={{ uri: formData.idBackImage }}
                            className="w-full h-40 rounded-lg"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="items-center">
                            <Text className="text-gray-500 text-sm">📷</Text>
                            <Text className="text-gray-500 text-sm mt-2">
                                {t('tapToUpload')}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Selfie with ID */}
            <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('uploadSelfie')} *
                </Text>
                <TouchableOpacity
                    onPress={() => handleImagePick('selfieImage')}
                    className={`border-2 border-dashed rounded-xl p-6 items-center ${errors.selfieImage ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    {formData.selfieImage ? (
                        <Image
                            source={{ uri: formData.selfieImage }}
                            className="w-full h-40 rounded-lg"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="items-center">
                            <Text className="text-gray-500 text-sm">🤳</Text>
                            <Text className="text-gray-500 text-sm mt-2">
                                {t('tapToUpload')}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                {errors.selfieImage && (
                    <Text className="text-red-500 text-xs mt-1">{errors.selfieImage}</Text>
                )}
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
                onPress={() => updateField('agreedToTerms', !formData.agreedToTerms)}
                className="flex-row items-start mb-6"
            >
                <View
                    className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${formData.agreedToTerms ? 'bg-blue-700 border-blue-700' : 'border-gray-300'
                        }`}
                >
                    {formData.agreedToTerms && (
                        <Text className="text-white text-xs">✓</Text>
                    )}
                </View>
                <Text className="flex-1 text-sm text-gray-700">
                    {t('agreeTerms')}
                </Text>
            </TouchableOpacity>
            {errors.agreedToTerms && (
                <Text className="text-red-500 text-xs mb-4">{errors.agreedToTerms}</Text>
            )}

            {/* General Error */}
            {errors.general && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <Text className="text-red-700 text-sm">{errors.general}</Text>
                </View>
            )}

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setStep(3)}
                    className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                >
                    <Text className="text-gray-700 text-base font-bold">
                        {t('back')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={registerMutation.isPending}
                    className={`flex-1 bg-blue-700 rounded-xl py-4 items-center ${registerMutation.isPending ? 'opacity-70' : ''
                        }`}
                >
                    {registerMutation.isPending ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-white text-base font-bold">
                            {t('submit')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Language Selector */}
                <View className="absolute top-12 right-6 z-10 flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => changeLanguage('en')}
                        className={`px-3 py-1.5 rounded-md ${i18n.language === 'en' ? 'bg-blue-700' : 'bg-gray-200'
                            }`}
                    >
                        <Text
                            className={`text-xs font-semibold ${i18n.language === 'en' ? 'text-white' : 'text-gray-700'
                                }`}
                        >
                            EN
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => changeLanguage('tl')}
                        className={`px-3 py-1.5 rounded-md ${i18n.language === 'tl' ? 'bg-blue-700' : 'bg-gray-200'
                            }`}
                    >
                        <Text
                            className={`text-xs font-semibold ${i18n.language === 'tl' ? 'text-white' : 'text-gray-700'
                                }`}
                        >
                            TL
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Header */}
                <View className="items-center pt-16 pb-6 bg-gradient-to-b from-blue-50 to-white">
                    <View className="w-24 h-24 mb-3">
                        <Image
                            source={require("../../assets/images/santamarialogo.jpg")}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-xl font-bold text-blue-900">
                        {t('register')}
                    </Text>
                </View>

                {/* Progress Indicator */}
                <View className="flex-row px-6 py-4">
                    {[1, 2, 3, 4].map((s) => (
                        <View
                            key={s}
                            className={`flex-1 h-2 mx-1 rounded-full ${s <= step ? 'bg-blue-700' : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </View>

                {/* Form Content */}
                <View className="px-6 pb-8">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}

                    {/* Back to Login */}
                    <View className="flex-row justify-center items-center py-6 mt-4">
                        <Text className="text-gray-600 text-sm">
                            {t('haveAccount')}{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)')}>
                            <Text className="text-blue-700 text-sm font-bold">
                                {t('login')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
