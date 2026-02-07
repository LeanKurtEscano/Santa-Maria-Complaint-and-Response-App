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
    FileText
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
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [age, setAge] = useState<number | null>(null);
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);
    const [currentImageField, setCurrentImageField] = useState<'idFrontImage' | 'idBackImage' | 'selfieImage' | null>(null);
    
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
            setDateOfBirth(selectedDate);
            const calculatedAge = calculateAge(selectedDate);
            setAge(calculatedAge);
            
            // Format date as MM/DD/YYYY
            const formattedDate = `${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${String(selectedDate.getDate()).padStart(2, '0')}/${selectedDate.getFullYear()}`;
            
            setFormData({ ...formData, dateOfBirth: formattedDate });
            setErrors({ ...errors, dateOfBirth: '' });
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
            alert("Camera permission is required!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData({ ...formData, [currentImageField]: result.assets[0].uri });
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
            setFormData({ ...formData, [currentImageField]: result.assets[0].uri });
        }
        
        setShowImagePickerModal(false);
        setCurrentImageField(null);
    };

    const removeImage = (field: 'idFrontImage' | 'idBackImage' | 'selfieImage') => {
        setFormData({ ...formData, [field]: undefined });
    };

    const getFileName = (uri: string | undefined) => {
        if (!uri) return '';
        const parts = uri.split('/');
        return parts[parts.length - 1];
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
            <Text className="text-xl font-bold text-neutral-900 mb-6">
                {t('personalInfo')}
            </Text>

            {/* First Name */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('firstName')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.firstName ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <User size={20} color={errors.firstName ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.firstName}
                        onChangeText={(text) => updateField('firstName', text)}
                        placeholder="Juan"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                {errors.firstName && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.firstName}</Text>
                    </View>
                )}
            </View>

            {/* Middle Name */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('middleName')}
                </Text>
                <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-3.5 bg-white">
                    <View className="mr-3 flex-shrink-0">
                        <User size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.middleName}
                        onChangeText={(text) => updateField('middleName', text)}
                        placeholder="Santos"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            {/* Last Name */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('lastName')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.lastName ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <User size={20} color={errors.lastName ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.lastName}
                        onChangeText={(text) => updateField('lastName', text)}
                        placeholder="Dela Cruz"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                {errors.lastName && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.lastName}</Text>
                    </View>
                )}
            </View>

            {/* Suffix */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('suffix')}
                </Text>
                <TextInput
                    className="border-2 border-neutral-200 rounded-xl px-4 py-3.5 text-base bg-white text-neutral-900"
                    value={formData.suffix}
                    onChangeText={(text) => updateField('suffix', text)}
                    placeholder="Jr., Sr., III"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            {/* Date of Birth */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('dateOfBirth')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.dateOfBirth ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                    activeOpacity={0.7}
                >
                    <View className="mr-3 flex-shrink-0">
                        <Calendar size={20} color={errors.dateOfBirth ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <Text className={formData.dateOfBirth ? 'text-neutral-900 text-base flex-1' : 'text-neutral-400 text-base flex-1'}>
                        {formData.dateOfBirth || 'MM/DD/YYYY'}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.dateOfBirth && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.dateOfBirth}</Text>
                    </View>
                )}

                {/* Date Picker */}
                {showDatePicker && (
                    <DateTimePicker
                        value={dateOfBirth || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                    />
                )}

                {/* iOS Date Picker Modal */}
                {Platform.OS === 'ios' && showDatePicker && (
                    <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-3xl p-6">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-lg font-bold text-neutral-900">
                                        {t('Select Date of Birth')}
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)} activeOpacity={0.7}>
                                        <Text className="text-primary-600 text-base font-semibold">Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={dateOfBirth || new Date()}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(1900, 0, 1)}
                                    textColor="#000000"
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </View>

            {/* Age (Auto-calculated, Disabled) */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('age')}
                </Text>
                <View className="flex-row items-center border-2 border-neutral-200 rounded-xl px-4 py-3.5 bg-neutral-100">
                    <TextInput
                        className="flex-1 text-base text-neutral-500"
                        value={age !== null ? age.toString() : ''}
                        placeholder="Auto-calculated"
                        placeholderTextColor="#9CA3AF"
                        editable={false}
                    />
                </View>
                <Text className="text-xs text-neutral-400 mt-1.5 px-1">
                    Age is automatically calculated from your date of birth
                </Text>
            </View>

            {/* Gender */}
            <View className="mb-8">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('gender')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowGenderModal(true)}
                    className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                        errors.gender ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                    activeOpacity={0.7}
                >
                    <Text className={formData.gender ? 'text-neutral-900 text-base' : 'text-neutral-400 text-base'}>
                        {formData.gender ? t(formData.gender) : t('Select Gender')}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.gender && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.gender}</Text>
                    </View>
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
                                <Text className="text-lg font-bold text-neutral-900">
                                    {t('Select Gender')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowGenderModal(false)} activeOpacity={0.7}>
                                    <X size={24} color="#6B7280" />
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
                                        className={`py-4 border-b border-neutral-200 ${
                                            formData.gender === option.value ? 'bg-primary-50' : ''
                                        }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`text-base ${
                                            formData.gender === option.value
                                                ? 'text-primary-600 font-semibold'
                                                : 'text-neutral-700'
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
                className="bg-primary-600 rounded-xl py-4 items-center shadow-sm"
                activeOpacity={0.85}
            >
                <Text className="text-white text-base font-bold">
                    {t('continue')}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text className="text-xl font-bold text-neutral-900 mb-6">
                {t('contactInfo')}
            </Text>

            {/* Email */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('email')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.email ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <Mail size={20} color={errors.email ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                        placeholder="juan.delacruz@email.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                {errors.email && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.email}</Text>
                    </View>
                )}
            </View>

            {/* Phone Number */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('phoneNumber')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.phoneNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <Phone size={20} color={errors.phoneNumber ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.phoneNumber}
                        onChangeText={(text) => updateField('phoneNumber', text)}
                        placeholder="+63 912 345 6789"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                    />
                </View>
                {errors.phoneNumber && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.phoneNumber}</Text>
                    </View>
                )}
            </View>

            {/* Password */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('password')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.password ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <Lock size={20} color={errors.password ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.password}
                        onChangeText={(text) => updateField('password', text)}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                    />
                </View>
                {errors.password && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.password}</Text>
                    </View>
                )}
            </View>

            {/* Confirm Password */}
            <View className="mb-8">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('confirmPassword')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.confirmPassword ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <Lock size={20} color={errors.confirmPassword ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.confirmPassword}
                        onChangeText={(text) => updateField('confirmPassword', text)}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                    />
                </View>
                {errors.confirmPassword && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.confirmPassword}</Text>
                    </View>
                )}
            </View>

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setStep(1)}
                    className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-neutral-700 text-base font-bold">
                        {t('back')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setStep(3)}
                    className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm"
                    activeOpacity={0.85}
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
            <Text className="text-xl font-bold text-neutral-900 mb-6">
                {t('addressInfo')}
            </Text>

            {/* Barangay */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('barangay')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowBarangayModal(true)}
                    className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                        errors.barangay ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="mr-3 flex-shrink-0">
                            <MapPin size={20} color={errors.barangay ? '#EF4444' : '#9CA3AF'} />
                        </View>
                        <Text className={formData.barangay ? 'text-neutral-900 text-base' : 'text-neutral-400 text-base'}>
                            {formData.barangay || t('selectBarangay')}
                        </Text>
                    </View>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.barangay && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.barangay}</Text>
                    </View>
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
                                <Text className="text-lg font-bold text-neutral-900">
                                    {t('selectBarangay')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowBarangayModal(false)} activeOpacity={0.7}>
                                    <X size={24} color="#6B7280" />
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
                                        className={`py-4 border-b border-neutral-200 ${
                                            formData.barangay === brgy ? 'bg-primary-50' : ''
                                        }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`text-base ${
                                            formData.barangay === brgy
                                                ? 'text-primary-600 font-semibold'
                                                : 'text-neutral-700'
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
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('streetAddress')} *
                </Text>
                <TextInput
                    className={`border-2 rounded-xl px-4 py-3.5 text-base bg-white ${
                        errors.streetAddress ? 'border-error-500 bg-error-50 text-neutral-900' : 'border-neutral-200 text-neutral-900'
                    }`}
                    value={formData.streetAddress}
                    onChangeText={(text) => updateField('streetAddress', text)}
                    placeholder="123 Rizal Street"
                    placeholderTextColor="#9CA3AF"
                    multiline
                />
                {errors.streetAddress && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.streetAddress}</Text>
                    </View>
                )}
            </View>

            {/* Zone */}
            <View className="mb-8">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('zone')}
                </Text>
                <TextInput
                    className="border-2 border-neutral-200 rounded-xl px-4 py-3.5 text-base bg-white text-neutral-900"
                    value={formData.zone}
                    onChangeText={(text) => updateField('zone', text)}
                    placeholder="Purok 1"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setStep(2)}
                    className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-neutral-700 text-base font-bold">
                        {t('back')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setStep(4)}
                    className="flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm"
                    activeOpacity={0.85}
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
            <Text className="text-xl font-bold text-neutral-900 mb-2">
                {t('idVerification')}
            </Text>
            <Text className="text-sm text-neutral-500 mb-6 leading-5">
                {t('idVerificationNote')}
            </Text>

            {/* ID Type */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('idType')} *
                </Text>
                <TouchableOpacity
                    onPress={() => setShowIdTypeModal(true)}
                    className={`border-2 rounded-xl px-4 py-3.5 flex-row justify-between items-center bg-white ${
                        errors.idType ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="mr-3 flex-shrink-0">
                            <CreditCard size={20} color={errors.idType ? '#EF4444' : '#9CA3AF'} />
                        </View>
                        <Text className={formData.idType ? 'text-neutral-900 text-base' : 'text-neutral-400 text-base'}>
                            {formData.idType ? t(formData.idType) : t('selectIdType')}
                        </Text>
                    </View>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.idType && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.idType}</Text>
                    </View>
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
                                <Text className="text-lg font-bold text-neutral-900">
                                    {t('selectIdType')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowIdTypeModal(false)} activeOpacity={0.7}>
                                    <X size={24} color="#6B7280" />
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
                                        className={`py-4 border-b border-neutral-200 ${
                                            formData.idType === type ? 'bg-primary-50' : ''
                                        }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`text-base ${
                                            formData.idType === type
                                                ? 'text-primary-600 font-semibold'
                                                : 'text-neutral-700'
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
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('idNumber')} *
                </Text>
                <View
                    className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                        errors.idNumber ? 'border-error-500 bg-error-50' : 'border-neutral-200'
                    }`}
                >
                    <View className="mr-3 flex-shrink-0">
                        <CreditCard size={20} color={errors.idNumber ? '#EF4444' : '#9CA3AF'} />
                    </View>
                    <TextInput
                        className="flex-1 text-base text-neutral-900"
                        value={formData.idNumber}
                        onChangeText={(text) => updateField('idNumber', text)}
                        placeholder="A00-000-000000"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                {errors.idNumber && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.idNumber}</Text>
                    </View>
                )}
            </View>

            {/* ID Front Image */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('uploadIdFront')} *
                </Text>
                {formData.idFrontImage ? (
                    <View className="border-2 border-neutral-300 rounded-xl p-4 bg-white">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1 mr-3">
                                <View className="mr-3 flex-shrink-0">
                                    <FileText size={20} color="#059669" />
                                </View>
                                <Text className="text-neutral-900 text-sm flex-1" numberOfLines={1}>
                                    {getFileName(formData.idFrontImage)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => removeImage('idFrontImage')}
                                className="bg-error-100 rounded-lg p-2"
                                activeOpacity={0.7}
                            >
                                <X size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => handleImagePick('idFrontImage')}
                        className={`border-2 border-dashed rounded-xl p-6 items-center ${
                            errors.idFrontImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'
                        }`}
                        activeOpacity={0.7}
                    >
                        <View className="items-center">
                            <ImageIcon size={40} color="#9CA3AF" strokeWidth={1.5} />
                            <Text className="text-neutral-500 text-sm mt-3 font-medium">
                                {t('tapToUpload')}
                            </Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                                Front side of your ID
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                {errors.idFrontImage && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.idFrontImage}</Text>
                    </View>
                )}
            </View>

            {/* ID Back Image */}
            <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('uploadIdBack')}
                </Text>
                {formData.idBackImage ? (
                    <View className="border-2 border-neutral-300 rounded-xl p-4 bg-white">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1 mr-3">
                                <View className="mr-3 flex-shrink-0">
                                    <FileText size={20} color="#059669" />
                                </View>
                                <Text className="text-neutral-900 text-sm flex-1" numberOfLines={1}>
                                    {getFileName(formData.idBackImage)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => removeImage('idBackImage')}
                                className="bg-error-100 rounded-lg p-2"
                                activeOpacity={0.7}
                            >
                                <X size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => handleImagePick('idBackImage')}
                        className="border-2 border-dashed border-neutral-300 rounded-xl p-6 items-center bg-neutral-50"
                        activeOpacity={0.7}
                    >
                        <View className="items-center">
                            <ImageIcon size={40} color="#9CA3AF" strokeWidth={1.5} />
                            <Text className="text-neutral-500 text-sm mt-3 font-medium">
                                {t('tapToUpload')}
                            </Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                                Back side of your ID
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Selfie with ID */}
            <View className="mb-6">
                <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                    {t('uploadSelfie')} *
                </Text>
                {formData.selfieImage ? (
                    <View className="border-2 border-neutral-300 rounded-xl p-4 bg-white">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1 mr-3">
                                <View className="mr-3 flex-shrink-0">
                                    <FileText size={20} color="#059669" />
                                </View>
                                <Text className="text-neutral-900 text-sm flex-1" numberOfLines={1}>
                                    {getFileName(formData.selfieImage)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => removeImage('selfieImage')}
                                className="bg-error-100 rounded-lg p-2"
                                activeOpacity={0.7}
                            >
                                <X size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => handleImagePick('selfieImage')}
                        className={`border-2 border-dashed rounded-xl p-6 items-center ${
                            errors.selfieImage ? 'border-error-500 bg-error-50' : 'border-neutral-300 bg-neutral-50'
                        }`}
                        activeOpacity={0.7}
                    >
                        <View className="items-center">
                            <Camera size={40} color="#9CA3AF" strokeWidth={1.5} />
                            <Text className="text-neutral-500 text-sm mt-3 font-medium">
                                {t('tapToUpload')}
                            </Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                                Selfie holding your ID
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                {errors.selfieImage && (
                    <View className="flex-row items-center mt-2 px-1">
                        <View className="mr-1.5 flex-shrink-0">
                            <AlertCircle size={14} color="#EF4444" />
                        </View>
                        <Text className="text-error-600 text-xs flex-1">{errors.selfieImage}</Text>
                    </View>
                )}
            </View>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePickerModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowImagePickerModal(false);
                    setCurrentImageField(null);
                }}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-lg font-bold text-neutral-900">
                                Choose Image Source
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowImagePickerModal(false);
                                    setCurrentImageField(null);
                                }} 
                                activeOpacity={0.7}
                            >
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={pickFromCamera}
                            className="flex-row items-center border-2 border-neutral-200 rounded-xl p-4 mb-4 bg-white"
                            activeOpacity={0.7}
                        >
                            <View className="bg-primary-100 rounded-full p-3 mr-4">
                                <Camera size={24} color="#2563EB" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-neutral-900 mb-1">
                                    Take Photo
                                </Text>
                                <Text className="text-sm text-neutral-500">
                                    Use your camera to capture
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={pickFromLibrary}
                            className="flex-row items-center border-2 border-neutral-200 rounded-xl p-4 bg-white"
                            activeOpacity={0.7}
                        >
                            <View className="bg-primary-100 rounded-full p-3 mr-4">
                                <ImageIcon size={24} color="#2563EB" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-neutral-900 mb-1">
                                    Choose from Gallery
                                </Text>
                                <Text className="text-sm text-neutral-500">
                                    Select from your photos
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Terms and Conditions */}
            <TouchableOpacity
                onPress={() => updateField('agreedToTerms', !formData.agreedToTerms)}
                className="flex-row items-start mb-6"
                activeOpacity={0.7}
            >
                <View
                    className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center flex-shrink-0 ${
                        formData.agreedToTerms ? 'bg-primary-600 border-primary-600' : 'border-neutral-300 bg-white'
                    }`}
                >
                    {formData.agreedToTerms && (
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                    )}
                </View>
                <Text className="flex-1 text-sm text-neutral-700 leading-5">
                    {t('agreeTerms')}
                </Text>
            </TouchableOpacity>
            {errors.agreedToTerms && (
                <View className="flex-row items-center mb-4 px-1">
                    <View className="mr-1.5 flex-shrink-0">
                        <AlertCircle size={14} color="#EF4444" />
                    </View>
                    <Text className="text-error-600 text-xs flex-1">{errors.agreedToTerms}</Text>
                </View>
            )}

            {/* General Error */}
            {errors.general && (
                <View className="bg-error-50 border border-error-500 rounded-xl p-4 mb-6 flex-row items-start">
                    <View className="mr-3 flex-shrink-0">
                        <AlertCircle size={20} color="#EF4444" />
                    </View>
                    <Text className="text-sm text-error-600 flex-1 leading-5">{errors.general}</Text>
                </View>
            )}

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setStep(3)}
                    className="flex-1 bg-neutral-100 rounded-xl py-4 items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-neutral-700 text-base font-bold">
                        {t('back')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={registerMutation.isPending}
                    className={`flex-1 bg-primary-600 rounded-xl py-4 items-center shadow-sm ${
                        registerMutation.isPending ? 'opacity-60' : ''
                    }`}
                    activeOpacity={0.85}
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
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Language Selector */}
                    <View className="absolute top-4 right-6 z-10 flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => changeLanguage('en')}
                            className={`px-3.5 py-2 rounded-lg ${
                                i18n.language === 'en' ? 'bg-primary-600' : 'bg-neutral-100'
                            }`}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    i18n.language === 'en' ? 'text-white' : 'text-neutral-600'
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
                                className={`text-xs font-semibold ${
                                    i18n.language === 'tl' ? 'text-white' : 'text-neutral-600'
                                }`}
                            >
                                TL
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Header */}
                    <View className="items-center pt-16 pb-6 px-6">
                        <View className="w-24 h-24 mb-4 items-center justify-center bg-white rounded-full shadow-sm border-4 border-primary-50">
                            <Image
                                source={require("../../assets/images/santamarialogo.jpg")}
                                className="w-20 h-20 rounded-full"
                                resizeMode="cover"
                            />
                        </View>
                        <Text className="text-2xl font-bold text-neutral-900 tracking-tight">
                            {t('register')}
                        </Text>
                    </View>

                    {/* Progress Indicator */}
                    <View className="flex-row px-6 py-4">
                        {[1, 2, 3, 4].map((s) => (
                            <View
                                key={s}
                                className={`flex-1 h-2 mx-1 rounded-full ${
                                    s <= step ? 'bg-primary-600' : 'bg-neutral-200'
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
                            <Text className="text-neutral-500 text-sm">
                                {t('haveAccount')}{' '}
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)')} activeOpacity={0.7}>
                                <Text className="text-primary-600 text-sm font-bold">
                                    {t('login')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}