import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

function redactClientId(clientId: unknown) {
    if (typeof clientId !== 'string' || clientId.length < 12) {
        return clientId ?? null;
    }

    return `${clientId.slice(0, 12)}...${clientId.slice(-24)}`;
}

export function logGoogleSignInEvent(
    event: string,
    details: Record<string, unknown> = {}
) {
    const extra = Constants.expoConfig?.extra as
        | Record<string, unknown>
        | undefined;

    console.log(`[GoogleSignIn] ${event}`, {
        platform: Platform.OS,
        applicationId: Application.applicationId,
        appVersion: Application.nativeApplicationVersion,
        buildNumber: Application.nativeBuildVersion,
        device: Device.modelName,
        webClientId: redactClientId(
            extra?.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID
        ),
        ...details,
    });
}

export function logGoogleSignInError(event: string, error: unknown) {
    const candidate = error as {
        code?: unknown;
        message?: unknown;
        name?: unknown;
        stack?: unknown;
        cause?: { code?: unknown; message?: unknown };
    } | null;

    logGoogleSignInEvent(event, {
        errorCode: candidate?.code ?? null,
        errorName: candidate?.name ?? null,
        errorMessage: candidate?.message ?? String(error),
        causeCode: candidate?.cause?.code ?? null,
        causeMessage: candidate?.cause?.message ?? null,
        stack: candidate?.stack ?? null,
    });
}