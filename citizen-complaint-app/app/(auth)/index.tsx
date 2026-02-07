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
interface LoginFormData {
    email: string;
    password: string;
}

export default function LoginScreen({ navigation }: any) {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const loginMutation = useSubmitForm<LoginFormData>({
        url: '/auth/login',
        method: 'post',
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
        onSuccess: (data) => {
            // Handle successful login
            console.log('Login successful:', data);
            // navigation.navigate('Home');
        },
    });

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const handleLogin = () => {
        loginMutation.mutate(formData, {
            onError: (error: any) => {
                if (error?.type === 'validation') {
                    setErrors(error.errors);
                } else {
                    setErrors({ general: error?.general || 'Login failed' });
                }
            },
        });
    };

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

                {/* Header Section with Logo */}
                <View className="items-center pt-16 pb-8 bg-primary-50">
                    <View className="w-32 h-32 mb-4 items-center justify-center">
                        <Image
                            source={require("../../assets/images/santamarialogo.jpg")}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-2xl font-bold text-government-seal mb-2">
                        {t('appTitle')}
                    </Text>
                    <Text className="text-sm text-text-secondary text-center px-6">
                        {t('welcomeMessage')}
                    </Text>
                </View>

                {/* Login Form */}
                <View className="flex-1 px-6 pt-8">
                    <View className="mb-8">
                        <Text className="text-3xl font-bold text-text-primary mb-2">
                            {t('login')}
                        </Text>
                        <Text className="text-text-secondary">
                            {t('welcomeMessage')}
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-text-primary mb-2">
                            {t('email')}
                        </Text>
                        <View
                            className={`flex-row items-center border-2 rounded-xl px-4 py-3 bg-background-input ${errors.email ? 'border-error-600' : 'border-border-primary'
                                }`}
                        >
                            <TextInput
                                className="flex-1 text-base text-text-primary"
                                placeholder="juan.delacruz@email.com"
                                placeholderTextColor="#9CA3AF"
                                value={formData.email}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, email: text });
                                    setErrors({ ...errors, email: '' });
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                        {errors.email && (
                            <Text className="text-text-error text-xs mt-1">{errors.email}</Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View className="mb-3">
                        <Text className="text-sm font-semibold text-text-primary mb-2">
                            {t('password')}
                        </Text>
                        <View
                            className={`flex-row items-center border-2 rounded-xl px-4 py-3 bg-background-input ${errors.password ? 'border-error-600' : 'border-border-primary'
                                }`}
                        >
                            <TextInput
                                className="flex-1 text-base text-text-primary"
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={formData.password}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, password: text });
                                    setErrors({ ...errors, password: '' });
                                }}
                                secureTextEntry
                                autoComplete="password"
                            />
                        </View>
                        {errors.password && (
                            <Text className="text-text-error text-xs mt-1">{errors.password}</Text>
                        )}
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity className="self-end mb-6">
                        <Text className="text-text-link text-sm font-semibold">
                            {t('forgotPassword')}
                        </Text>
                    </TouchableOpacity>

                    {/* General Error */}
                    {errors.general && (
                        <View className="bg-error-50 border border-error-200 rounded-lg p-3 mb-4">
                            <Text className="text-text-error text-sm">{errors.general}</Text>
                        </View>
                    )}

                    {/* Login Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loginMutation.isPending}
                        className={`bg-primary-700 rounded-xl py-4 items-center mb-4 ${loginMutation.isPending ? 'opacity-70' : ''
                            }`}
                    >
                        {loginMutation.isPending ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-text-inverse text-base font-bold">
                                {t('login')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View className="flex-row justify-center items-center py-4">
                        <Text className="text-text-secondary text-sm">
                            {t('noAccount')}{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/Register')}>
                            <Text className="text-text-link text-sm font-bold">
                                {t('register')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="items-center py-8">
                        <Text className="text-xs text-text-tertiary text-center">
                            {t('republicPhilippines')}
                        </Text>
                        <Text className="text-xs text-text-tertiary text-center">
                            {t('municipalitySantaMaria')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}