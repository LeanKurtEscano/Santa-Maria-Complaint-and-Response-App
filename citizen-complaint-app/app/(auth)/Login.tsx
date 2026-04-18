import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSubmitForm } from '@/hooks/general/useSubmitForm';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, WifiOff, Smartphone, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApiClient } from '@/lib/client/user';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import * as SecureStore from 'expo-secure-store';
import { THEME } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginFormData {
    email: string;
    password: string;
    role: string;
}

export default function LoginScreen({ navigation }: any) {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { fetchCurrentUser } = useCurrentUser();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
        role: 'user',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showPassword, setShowPassword] = useState(false);

    const loginMutation = useSubmitForm<LoginFormData>({
        url: '/login',
        method: 'post',
        client: authApiClient,
        validators: [
            (data) => {
                const errors: { [key: string]: string } = {};
                if (!data.email) errors.email = t('required');
                if (!data.password) errors.password = t('required');
                if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
                    errors.email = t('invalidEmail');
                }
                return Object.keys(errors).length > 0 ? errors : null;
            },
        ],
        onSuccess: async (data) => {
            await SecureStore.setItemAsync('complaint_token', data.access_token);
            await SecureStore.setItemAsync('complaint_refresh_token', data.refresh_token);
            console.log('Login successful:', data);
            await fetchCurrentUser();
            router.replace('/(tabs)');
        },
    });

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const handleLogin = () => {
        AsyncStorage.removeItem('registrationFormData');
        loginMutation.mutate(formData, {
            onError: (error: any) => {
                if (error?.type === 'validation') {
                    setErrors(error.errors);
                } else if (error?.status === 404) {
                    setErrors({ email: t('noAccountEmail') });
                } else if (error?.status === 401) {
                    setErrors({ password: t('incorrectPassword') });
                } else if (error?.code === 'OFFLINE' || error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') {
                    setErrors({ general: t('networkError') });
                } else {
                    setErrors({ general: t('loginFailed') });
                }
            },
        });
    };

    // Fixed icon strip width so both buttons' text starts at the same x position
    const ICON_STRIP_WIDTH = 56;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Language Selector */}
                    <View className="absolute top-4 right-6 z-10 flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => changeLanguage('en')}
                            className="px-3.5 py-2 rounded-lg"
                            style={{ backgroundColor: i18n.language === 'en' ? THEME.primary : '#F5F5F5' }}
                            activeOpacity={0.7}
                        >
                            <Text className={`text-xs font-semibold ${i18n.language === 'en' ? 'text-white' : 'text-neutral-600'}`}>
                                EN
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => changeLanguage('tl')}
                            className="px-3.5 py-2 rounded-lg"
                            style={{ backgroundColor: i18n.language === 'tl' ? THEME.primary : '#F5F5F5' }}
                            activeOpacity={0.7}
                        >
                            <Text className={`text-xs font-semibold ${i18n.language === 'tl' ? 'text-white' : 'text-neutral-600'}`}>
                                TL
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Header Section with Logo */}
                    <View className="items-center pt-16 pb-8 px-6">
                        <View className="w-28 h-28 mb-6 items-center justify-center bg-white rounded-full shadow-sm border-4 border-primary-50">
                            <Image
                                source={require("../../assets/images/santamarialogo.jpg")}
                                className="w-24 h-24 rounded-full"
                                resizeMode="cover"
                            />
                        </View>
                        <Text className="text-2xl font-bold text-neutral-900 mb-1.5 tracking-tight">
                            Santa Maria Complaint App
                        </Text>
                        <Text className="text-sm text-neutral-500 text-center max-w-[280px] leading-5">
                            {t('welcomeMessage')}
                        </Text>
                    </View>

                    {/* Login Form Container */}
                    <View className="flex-1 px-6 pt-2">
                        {/* Form Header */}
                        <View className="mb-8">
                            <Text className="text-3xl font-bold text-neutral-900 mb-2">
                                {t('login')}
                            </Text>
                            <Text className="text-sm text-neutral-500 leading-5">
                                {t('loginSubtitle') || 'Sign in to continue to your account'}
                            </Text>
                        </View>

                        {/* Network Error Alert */}
                        {errors.general && (
                            <View className="bg-error-50 border border-error-500 rounded-xl p-4 mb-6 flex-row items-start">
                                <View className="mr-3 flex-shrink-0">
                                    {errors.general.includes('network') || errors.general.includes('connection') ? (
                                        <WifiOff size={20} color="#EF4444" />
                                    ) : (
                                        <AlertCircle size={20} color="#EF4444" />
                                    )}
                                </View>
                                <Text className="text-sm text-error-600 flex-1 leading-5">
                                    {errors.general}
                                </Text>
                            </View>
                        )}

                        {/* Email Input */}
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                                {t('email')}
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
                                    placeholder="juan.delacruz@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.email}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, email: text });
                                        setErrors({ ...errors, email: '', general: '' });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect={false}
                                />
                                {formData.email && !errors.email && (
                                    <View className="ml-3 flex-shrink-0">
                                        <CheckCircle size={20} color="#22C55E" />
                                    </View>
                                )}
                            </View>
                            {errors.email && (
                                <View className="flex-row items-center mt-2 px-1">
                                    <View className="mr-1.5 flex-shrink-0">
                                        <AlertCircle size={14} color="#EF4444" />
                                    </View>
                                    <Text className="text-error-600 text-xs flex-1">
                                        {errors.email}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Password Input */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                                {t('password')}
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
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.password}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, password: text });
                                        setErrors({ ...errors, password: '', general: '' });
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="ml-3 p-1 flex-shrink-0"
                                    activeOpacity={0.7}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <View className="flex-row items-center mt-2 px-1">
                                    <View className="mr-1.5 flex-shrink-0">
                                        <AlertCircle size={14} color="#EF4444" />
                                    </View>
                                    <Text className="text-error-600 text-xs flex-1">
                                        {errors.password}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity
                            className="self-end mb-8"
                            activeOpacity={0.7}
                            onPress={() => router.push('/(auth)/ForgotPassword')}
                        >
                            <Text className="text-sm font-semibold" style={{ color: THEME.primary }}>
                                {t('forgotPassword')}
                            </Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loginMutation.isPending}
                            className="rounded-xl py-4 items-center mb-6 shadow-sm"
                            style={{ backgroundColor: THEME.primary }}
                            activeOpacity={0.85}
                        >
                            {loginMutation.isPending ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text className="text-white text-base font-bold tracking-wide">
                                    {t('login')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-neutral-200" />
                            <Text className="px-4 text-xs text-neutral-400 font-medium uppercase tracking-wider">
                                {t('or') || 'OR'}
                            </Text>
                            <View className="flex-1 h-px bg-neutral-200" />
                        </View>

                        {/* Register Buttons */}
                        <View className="gap-3">
                            <Text className="text-center text-neutral-500 text-sm mb-1">
                                {t('noAccount') || "Don't have an account?"}
                            </Text>

                            {/* Register with Email */}
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname: '/(auth)/Register',
                                        params: { apiRoute: '/register' },
                                    })
                                }
                                activeOpacity={0.85}
                                className="flex-row items-center rounded-2xl overflow-hidden"
                                style={{
                                    backgroundColor: '#F0FDF4',
                                    borderWidth: 1.5,
                                    borderColor: '#BBF7D0',
                                    minHeight: 52,
                                }}
                            >
                                {/* Icon strip — fixed width so text of both buttons aligns */}
                                <View
                                    style={{
                                        width: ICON_STRIP_WIDTH,
                                        alignSelf: 'stretch',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: THEME.primary,
                                    }}
                                >
                                    <Mail size={20} color="#fff" />
                                </View>

                                {/* Label — flex-1 so it fills remaining space and centers within it */}
                                <Text
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: THEME.primary,
                                        paddingVertical: 14,
                                    }}
                                >
                                    {t('registerWithEmail') || 'Register with Email'}
                                </Text>

                                {/* Chevron — same fixed width as icon strip to keep label truly centered */}
                                <View style={{ width: ICON_STRIP_WIDTH, alignItems: 'center' }}>
                                    <ChevronRight size={16} color={THEME.primary} />
                                </View>
                            </TouchableOpacity>

                            {/* Register with Phone */}
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname: '/(auth)/Register',
                                        params: { apiRoute: '/register-phone-number' },
                                    })
                                }
                                activeOpacity={0.85}
                                className="flex-row items-center rounded-2xl overflow-hidden"
                                style={{
                                    backgroundColor: '#F0F9FF',
                                    borderWidth: 1.5,
                                    borderColor: '#BAE6FD',
                                    minHeight: 52,
                                }}
                            >
                                {/* Icon strip — same fixed width as email button */}
                                <View
                                    style={{
                                        width: ICON_STRIP_WIDTH,
                                        alignSelf: 'stretch',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#0EA5E9',
                                    }}
                                >
                                    <Smartphone size={20} color="#fff" />
                                </View>

                                {/* Label */}
                                <Text
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: '#0EA5E9',
                                        paddingVertical: 14,
                                    }}
                                >
                                    {t('registerWithPhone') || 'Register with Phone Number'}
                                </Text>

                                {/* Chevron — same fixed width to mirror left strip */}
                                <View style={{ width: ICON_STRIP_WIDTH, alignItems: 'center' }}>
                                    <ChevronRight size={16} color="#0EA5E9" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="items-center py-10 mt-auto">
                            <View className="w-12 h-1 bg-neutral-200 rounded-full mb-4" />
                            <Text className="text-xs text-neutral-400 text-center leading-5">
                                {t('republicPhilippines')}
                            </Text>
                            <Text className="text-xs text-neutral-400 text-center leading-5">
                                {t('municipalitySantaMaria')}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}