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
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    WifiOff,
    Smartphone,
    ChevronRight,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApiClient } from '@/lib/client/user';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import * as SecureStore from 'expo-secure-store';
import { THEME } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

// Clerk browser OAuth - used for iOS / Expo Go testing
import { useSSO, useAuth } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Native Google Sign-In is imported separately and only used by AndroidGoogleSignIn
import { useSignInWithGoogle } from '@clerk/expo/google';

WebBrowser.maybeCompleteAuthSession();

interface LoginFormData {
    email: string;
    password: string;
    role: string;
}

// Payload actually sent to the backend. Extends the form
// with device metadata so the server can identify/verify the device.
// NOTE: field names here match what the backend reads off `login_data`
// (login_data.device_id, login_data.model, login_data.brand, etc.)
interface LoginRequestPayload extends LoginFormData {
    device_id?: string;
    model?: string;
    brand?: string;
    system_name?: string;
    system_version?: string;
    app_version?: string;
    build_number?: string;
}

// Payload sent to /login/google. Same device fields as LoginRequestPayload,
// plus the Clerk token instead of email/password.
interface GoogleLoginRequestPayload {
    clerk_token: string;
    device_id?: string;
    model?: string;
    brand?: string;
    system_name?: string;
    system_version?: string;
    app_version?: string;
    build_number?: string;
}

// SecureStore keys used across the auth flow.
const SECURE_STORE_KEYS = {
    ACCESS_TOKEN: 'complaint_token',
    REFRESH_TOKEN: 'complaint_refresh_token',
    PENDING_EMAIL: 'pending_verify_email',
    PENDING_PASSWORD: 'pending_verify_password',
};

interface GoogleLoginProps {
    onSuccess: (clerkToken: string) => Promise<void>;
    onError: (error: any) => void;
    googleLoading: boolean;
    setGoogleLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Collects device metadata to send along with the login request.
 * Uses expo-device + expo-application (Expo Go compatible, and also
 * works fine in dev builds / production builds). Wrapped in a single
 * try/catch so a failure collecting metadata never blocks login.
 *
 * Returned keys are named to match the backend's expected field names
 * directly (device_id, model, brand, system_name, system_version,
 * app_version, build_number) so callers can spread this straight into
 * the request payload without remapping keys.
 */
async function getDeviceMetadata(): Promise<
    Pick<
        LoginRequestPayload,
        | 'device_id'
        | 'model'
        | 'brand'
        | 'system_name'
        | 'system_version'
        | 'app_version'
        | 'build_number'
    >
> {
    try {
        let deviceId: string | null = null;

        if (Platform.OS === 'android') {
            // Synchronous, stable per app install.
            deviceId = Application.getAndroidId();
        } else if (Platform.OS === 'ios') {
            // Async, stable per vendor (resets if all apps from
            // that vendor are uninstalled).
            deviceId = await Application.getIosIdForVendorAsync();
        }

        return {
            device_id: deviceId ?? undefined,
            model: Device.modelName ?? undefined,
            brand: Device.brand ?? undefined,
            system_name: Device.osName ?? undefined,
            system_version: Device.osVersion ?? undefined,
            app_version: Application.nativeApplicationVersion ?? undefined,
            build_number: Application.nativeBuildVersion ?? undefined,
        };
    } catch (error) {
        console.log('Failed to collect device metadata:', error);
        return {};
    }
}

/**
 * ANDROID ONLY
 *
 * Uses Clerk native Google Sign-In.
 * This requires a native Android build and does NOT work in Expo Go.
 */
function AndroidGoogleSignIn({
    onSuccess,
    onError,
    googleLoading,
    setGoogleLoading,
}: GoogleLoginProps) {
    const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
    const { getToken, signOut } = useAuth();

    const handleAndroidGoogleLogin = async () => {
        setGoogleLoading(true);

        let createdSessionId: string | undefined;

        try {
            // Clean up any stale Clerk session.
            try {
                await signOut();
            } catch {
                // No existing Clerk session.
            }

            // Native Android Google authentication.
            const result = await startGoogleAuthenticationFlow();

            createdSessionId = result.createdSessionId;

            const { setActive } = result;

            if (!createdSessionId || !setActive) {
                return;
            }

            // Activate the Clerk session.
            await setActive({
                session: createdSessionId,
            });

            // Get Clerk JWT.
            const clerkToken = await getToken();

            if (!clerkToken) {
                throw new Error(
                    'Unable to retrieve Clerk authentication token.'
                );
            }

            console.log(
                'Android native Google authentication successful'
            );

            // Send Clerk token to your backend.
            await onSuccess(clerkToken);
        } catch (error: any) {
            console.log(
                'Android native Google login error:',
                error
            );

            // Native Google cancellation.
            if (
                error?.code === 'SIGN_IN_CANCELLED' ||
                error?.code === '-5'
            ) {
                return;
            }

            onError(error);
        } finally {
            // Remove the temporary Clerk session.
            if (createdSessionId) {
                try {
                    await signOut();
                } catch (signOutError) {
                    console.log(
                        'Android Clerk signOut cleanup failed:',
                        signOutError
                    );
                }
            }

            setGoogleLoading(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleAndroidGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.85}
            className="flex-row items-center rounded-2xl overflow-hidden mb-6"
            style={{
                backgroundColor: '#fff',
                borderWidth: 1.5,
                borderColor: '#E5E7EB',
                minHeight: 52,
            }}
        >
            <View
                style={{
                    width: 56,
                    alignSelf: 'stretch',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {googleLoading ? (
                    <ActivityIndicator
                        size="small"
                        color="#374151"
                    />
                ) : (
                    <Image
                        source={require('../../assets/images/google-icon.png')}
                        style={{
                            width: 20,
                            height: 20,
                        }}
                        resizeMode="contain"
                    />
                )}
            </View>

            <Text
                style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#374151',
                    paddingVertical: 14,
                }}
            >
                Continue with Google
            </Text>

            <View
                style={{
                    width: 56,
                }}
            />
        </TouchableOpacity>
    );
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

    const [errors, setErrors] = useState<{
        [key: string]: string;
    }>({});

    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Browser OAuth for iOS / Expo Go testing.
    const { startSSOFlow } = useSSO();

    // Used by the iOS browser flow.
    const { getToken, signOut } = useAuth();

    /**
     * This function receives the Clerk token from either:
     *
     * Android:
     *   Native Google Sign-In
     *
     * iOS:
     *   Browser OAuth / Expo Go
     *
     * Then exchanges it for YOUR application's tokens.
     */
    const exchangeClerkToken = async (clerkToken: string) => {
        if (!clerkToken) {
            throw new Error(
                'Unable to retrieve Clerk authentication token.'
            );
        }

        const deviceMetadata = await getDeviceMetadata();

        const payload: GoogleLoginRequestPayload = {
            clerk_token: clerkToken,
            ...deviceMetadata,
        };

        const { data } = await authApiClient.post(
            '/login/google',
            payload
        );

        console.log(
            'Google login response:',
            data
        );

        // Device not recognized: backend sent an OTP instead of tokens.
        // Stash the email (no password for Google login) and send the
        // user to verify the device.
        if (data.is_verified === false) {
            await SecureStore.setItemAsync(
                SECURE_STORE_KEYS.PENDING_EMAIL,
                data.email
            );
            router.replace('/(auth)/VerifyDeviceScreen');
            return;
        }

        await SecureStore.setItemAsync(
            SECURE_STORE_KEYS.ACCESS_TOKEN,
            data.access_token
        );

        await SecureStore.setItemAsync(
            SECURE_STORE_KEYS.REFRESH_TOKEN,
            data.refresh_token
        );

        await fetchCurrentUser();

        await useCurrentUser
            .getState()
            .syncPushToken();
    };

    const loginMutation = useSubmitForm<LoginRequestPayload>({
        url: '/login',
        method: 'post',
        client: authApiClient,
        validators: [
            (data) => {
                const errors: {
                    [key: string]: string;
                } = {};

                if (!data.email) {
                    errors.email = t('required');
                }

                if (!data.password) {
                    errors.password = t('required');
                }

                if (
                    data.email &&
                    !/\S+@\S+\.\S+/.test(data.email)
                ) {
                    errors.email = t('invalidEmail');
                }

                return Object.keys(errors).length > 0
                    ? errors
                    : null;
            },
        ],
        onSuccess: async (data) => {
            // Device not recognized: backend sent an OTP instead of tokens.
            // Stash the email and send the user to verify the device.
            if (data.is_verified === false) {
                await SecureStore.setItemAsync(
                    SECURE_STORE_KEYS.PENDING_EMAIL,
                    data.email
                );
                router.replace('/(auth)/VerifyDeviceScreen');
                return;
            }

            await SecureStore.setItemAsync(
                SECURE_STORE_KEYS.ACCESS_TOKEN,
                data.access_token
            );

            await SecureStore.setItemAsync(
                SECURE_STORE_KEYS.REFRESH_TOKEN,
                data.refresh_token
            );

            console.log(
                'Login successful:',
                data
            );

            await fetchCurrentUser();

            await useCurrentUser
                .getState()
                .syncPushToken();

            // router.replace('/(tabs)');
        },
    });

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const handleLogin = async () => {
        AsyncStorage.removeItem(
            'registrationFormData'
        );

        const deviceMetadata = await getDeviceMetadata();

        const payload: LoginRequestPayload = {
            ...formData,
            ...deviceMetadata,
        };

        loginMutation.mutate(payload, {
            onError: (error: any) => {
                if (error?.type === 'validation') {
                    setErrors(error.errors);
                } else if (error?.status === 404) {
                    setErrors({
                        email: t('noAccountEmail'),
                    });
                } else if (error?.status === 401) {
                    setErrors({
                        password: t('incorrectPassword'),
                    });
                } else if (
                    error?.code === 'OFFLINE' ||
                    error?.code ===
                        'NETWORK_ERROR' ||
                    error?.code === 'TIMEOUT'
                ) {
                    setErrors({
                        general: t('networkError'),
                    });
                } else {
                    setErrors({
                        general: t('loginFailed'),
                    });
                }
            },
        });
    };

    /**
     * iOS ONLY
     *
     * Keep the existing browser OAuth flow so
     * this continues working in Expo Go.
     */
    const handleIOSGoogleLogin = async () => {
        setErrors({});
        setGoogleLoading(true);

        let createdSessionId:
            | string
            | undefined;

        try {
            // Remove stale Clerk session.
            try {
                await signOut();
            } catch {
                // Nothing signed in.
            }

            const ssoResult = await startSSOFlow(
                {
                    strategy: 'oauth_google',
                    redirectUrl:
                        AuthSession.makeRedirectUri(),
                }
            );

            createdSessionId =
                ssoResult.createdSessionId;

            const { setActive } = ssoResult;

            if (
                !createdSessionId ||
                !setActive
            ) {
                return;
            }

            await setActive({
                session: createdSessionId,
            });

            const clerkToken = await getToken();

            if (!clerkToken) {
                throw new Error(
                    'Unable to retrieve Clerk authentication token.'
                );
            }

            await exchangeClerkToken(
                clerkToken
            );
        } catch (error: any) {
            console.log(
                'iOS Google login error:',
                error
            );

            setErrors({
                general: t('loginFailed'),
            });
        } finally {
            if (createdSessionId) {
                try {
                    await signOut();
                } catch (
                    signOutError
                ) {
                    console.log(
                        'iOS Clerk signOut cleanup failed:',
                        signOutError
                    );
                }
            }

            setGoogleLoading(false);
        }
    };

    /**
     * Only used as a wrapper for the platform-specific
     * Google login button.
     */
    const handleGoogleError = (error: any) => {
        console.log(
            'Google login error:',
            error
        );

        setErrors({
            general:
                error?.message ||
                t('loginFailed'),
        });
    };

    const ICON_STRIP_WIDTH = 56;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : 'height'
                }
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Language Selector */}
                    <View className="absolute top-4 right-6 z-10 flex-row gap-2">
                        <TouchableOpacity
                            onPress={() =>
                                changeLanguage('en')
                            }
                            className="px-3.5 py-2 rounded-lg"
                            style={{
                                backgroundColor:
                                    i18n.language ===
                                    'en'
                                        ? THEME.primary
                                        : '#F5F5F5',
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    i18n.language ===
                                    'en'
                                        ? 'text-white'
                                        : 'text-neutral-600'
                                }`}
                            >
                                EN
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() =>
                                changeLanguage('tl')
                            }
                            className="px-3.5 py-2 rounded-lg"
                            style={{
                                backgroundColor:
                                    i18n.language ===
                                    'tl'
                                        ? THEME.primary
                                        : '#F5F5F5',
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    i18n.language ===
                                    'tl'
                                        ? 'text-white'
                                        : 'text-neutral-600'
                                }`}
                            >
                                TL
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Header Section */}
                    <View className="items-center pt-16 pb-8 px-6">
                        <View className="w-28 h-28 mb-6 items-center justify-center bg-white rounded-full shadow-sm border-4 border-primary-50">
                            <Image
                                source={require("../../assets/images/santamarialogoapp.jpg")}
                                className="w-24 h-24 rounded-full"
                                resizeMode="cover"
                            />
                        </View>

                        <Text className="text-2xl font-bold text-neutral-900 mb-1.5 tracking-tight">
                            Mary App
                        </Text>

                        <Text className="text-sm text-neutral-500 text-center max-w-[280px] leading-5">
                            {t(
                                'welcomeMessage'
                            )}
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View className="flex-1 px-6 pt-2">
                        <View className="mb-8">
                            <Text className="text-3xl font-bold text-neutral-900 mb-2">
                                {t('login')}
                            </Text>

                            <Text className="text-sm text-neutral-500 leading-5">
                                {t(
                                    'loginSubtitle'
                                ) ||
                                    'Sign in to continue to your account'}
                            </Text>
                        </View>

                        {/* Network Error */}
                        {errors.general && (
                            <View className="bg-error-50 border border-error-500 rounded-xl p-4 mb-6 flex-row items-start">
                                <View className="mr-3 flex-shrink-0">
                                    {errors.general.includes(
                                        'network'
                                    ) ||
                                    errors.general.includes(
                                        'connection'
                                    ) ? (
                                        <WifiOff
                                            size={20}
                                            color="#EF4444"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={20}
                                            color="#EF4444"
                                        />
                                    )}
                                </View>

                                <Text className="text-sm text-error-600 flex-1 leading-5">
                                    {errors.general}
                                </Text>
                            </View>
                        )}

                        {/* Email */}
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                                {t('email')}
                            </Text>

                            <View
                                className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                                    errors.email
                                        ? 'border-error-500 bg-error-50'
                                        : 'border-neutral-200'
                                }`}
                            >
                                <View className="mr-3 flex-shrink-0">
                                    <Mail
                                        size={20}
                                        color={
                                            errors.email
                                                ? '#EF4444'
                                                : '#9CA3AF'
                                        }
                                    />
                                </View>

                                <TextInput
                                    className="flex-1 text-base text-neutral-900"
                                    placeholder="juan.delacruz@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={
                                        formData.email
                                    }
                                    onChangeText={(
                                        text
                                    ) => {
                                        setFormData({
                                            ...formData,
                                            email: text,
                                        });

                                        setErrors({
                                            ...errors,
                                            email: '',
                                            general:
                                                '',
                                        });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect={false}
                                />

                                {formData.email &&
                                    !errors.email && (
                                        <View className="ml-3 flex-shrink-0">
                                            <CheckCircle
                                                size={20}
                                                color="#22C55E"
                                            />
                                        </View>
                                    )}
                            </View>

                            {errors.email && (
                                <View className="flex-row items-center mt-2 px-1">
                                    <View className="mr-1.5 flex-shrink-0">
                                        <AlertCircle
                                            size={14}
                                            color="#EF4444"
                                        />
                                    </View>

                                    <Text className="text-error-600 text-xs flex-1">
                                        {errors.email}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Password */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-neutral-700 mb-2.5">
                                {t('password')}
                            </Text>

                            <View
                                className={`flex-row items-center border-2 rounded-xl px-4 py-3.5 bg-white ${
                                    errors.password
                                        ? 'border-error-500 bg-error-50'
                                        : 'border-neutral-200'
                                }`}
                            >
                                <View className="mr-3 flex-shrink-0">
                                    <Lock
                                        size={20}
                                        color={
                                            errors.password
                                                ? '#EF4444'
                                                : '#9CA3AF'
                                        }
                                    />
                                </View>

                                <TextInput
                                    className="flex-1 text-base text-neutral-900"
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={
                                        formData.password
                                    }
                                    onChangeText={(
                                        text
                                    ) => {
                                        setFormData({
                                            ...formData,
                                            password: text,
                                        });

                                        setErrors({
                                            ...errors,
                                            password:
                                                '',
                                            general:
                                                '',
                                        });
                                    }}
                                    secureTextEntry={
                                        !showPassword
                                    }
                                    autoComplete="password"
                                    autoCorrect={false}
                                />

                                <TouchableOpacity
                                    onPress={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    className="ml-3 p-1 flex-shrink-0"
                                    activeOpacity={0.7}
                                >
                                    {showPassword ? (
                                        <EyeOff
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    ) : (
                                        <Eye
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {errors.password && (
                                <View className="flex-row items-center mt-2 px-1">
                                    <View className="mr-1.5 flex-shrink-0">
                                        <AlertCircle
                                            size={14}
                                            color="#EF4444"
                                        />
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
                            onPress={() =>
                                router.push(
                                    '/(auth)/ForgotPassword'
                                )
                            }
                        >
                            <Text
                                className="text-sm font-semibold"
                                style={{
                                    color: THEME.primary,
                                }}
                            >
                                {t(
                                    'forgotPassword'
                                )}
                            </Text>
                        </TouchableOpacity>

                        {/* Login */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={
                                loginMutation.isPending
                            }
                            className="rounded-xl py-4 items-center mb-6 shadow-sm"
                            style={{
                                backgroundColor:
                                    THEME.primary,
                            }}
                            activeOpacity={0.85}
                        >
                            {loginMutation.isPending ? (
                                <ActivityIndicator
                                    color="#ffffff"
                                    size="small"
                                />
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

                        {/* ================================
                            GOOGLE SIGN-IN
                            ================================ */}

                        {Platform.OS === 'android' ? (
                            // Android:
                            // Native Google Sign-In
                            <AndroidGoogleSignIn
                                onSuccess={
                                    exchangeClerkToken
                                }
                                onError={
                                    handleGoogleError
                                }
                                googleLoading={
                                    googleLoading
                                }
                                setGoogleLoading={
                                    setGoogleLoading
                                }
                            />
                        ) : Platform.OS === 'ios' ? (
                            // iOS:
                            // Existing browser OAuth flow,
                            // which continues working in Expo Go.
                            <TouchableOpacity
                                onPress={
                                    handleIOSGoogleLogin
                                }
                                disabled={
                                    googleLoading
                                }
                                activeOpacity={0.85}
                                className="flex-row items-center rounded-2xl overflow-hidden mb-6"
                                style={{
                                    backgroundColor:
                                        '#fff',
                                    borderWidth: 1.5,
                                    borderColor:
                                        '#E5E7EB',
                                    minHeight: 52,
                                }}
                            >
                                <View
                                    style={{
                                        width:
                                            ICON_STRIP_WIDTH,
                                        alignSelf:
                                            'stretch',
                                        alignItems:
                                            'center',
                                        justifyContent:
                                            'center',
                                    }}
                                >
                                    {googleLoading ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="#374151"
                                        />
                                    ) : (
                                        <Image
                                            source={require("../../assets/images/google-icon.png")}
                                            style={{
                                                width: 20,
                                                height: 20,
                                            }}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>

                                <Text
                                    style={{
                                        flex: 1,
                                        textAlign:
                                            'center',
                                        fontSize: 14,
                                        fontWeight:
                                            '700',
                                        color: '#374151',
                                        paddingVertical:
                                            14,
                                    }}
                                >
                                    {t(
                                        'continueWithGoogle'
                                    ) ||
                                        'Continue with Google'}
                                </Text>

                                <View
                                    style={{
                                        width:
                                            ICON_STRIP_WIDTH,
                                    }}
                                />
                            </TouchableOpacity>
                        ) : null}

                        {/* Register Buttons */}
                        <View className="gap-3">
                            <Text className="text-center text-neutral-500 text-sm mb-1">
                                {t('noAccount') ||
                                    "Don't have an account?"}
                            </Text>

                            {/* Register with Email */}
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname:
                                            '/(auth)/Register',
                                        params: {
                                            apiRoute:
                                                '/register',
                                        },
                                    })
                                }
                                activeOpacity={0.85}
                                className="flex-row items-center rounded-2xl overflow-hidden"
                                style={{
                                    backgroundColor:
                                        '#F0FDF4',
                                    borderWidth: 1.5,
                                    borderColor:
                                        '#BBF7D0',
                                    minHeight: 52,
                                }}
                            >
                                <View
                                    style={{
                                        width:
                                            ICON_STRIP_WIDTH,
                                        alignSelf:
                                            'stretch',
                                        alignItems:
                                            'center',
                                        justifyContent:
                                            'center',
                                        backgroundColor:
                                            THEME.primary,
                                    }}
                                >
                                    <Mail
                                        size={20}
                                        color="#fff"
                                    />
                                </View>

                                <Text
                                    style={{
                                        flex: 1,
                                        textAlign:
                                            'center',
                                        fontSize: 14,
                                        fontWeight:
                                            '700',
                                        color: THEME.primary,
                                        paddingVertical:
                                            14,
                                    }}
                                >
                                    {t(
                                        'registerWithEmail'
                                    ) ||
                                        'Register with Email'}
                                </Text>

                                <View
                                    style={{
                                        width:
                                            ICON_STRIP_WIDTH,
                                        alignItems:
                                            'center',
                                    }}
                                >
                                    <ChevronRight
                                        size={16}
                                        color={
                                            THEME.primary
                                        }
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="items-center py-10 mt-auto">
                            <View className="w-12 h-1 bg-neutral-200 rounded-full mb-4" />

                            <Text className="text-xs text-neutral-400 text-center leading-5">
                                {t(
                                    'republicPhilippines'
                                )}
                            </Text>

                            <Text className="text-xs text-neutral-400 text-center leading-5">
                                {t(
                                    'municipalitySantaMaria'
                                )}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}