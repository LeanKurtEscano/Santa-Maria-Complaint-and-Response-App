import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  WifiOff,
  AlertCircle,
  ServerCrash,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';

export enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  TIMEOUT = 'timeout',
  GENERIC = 'generic',
}

export interface ErrorScreenConfig {
  title: string;
  message: string;
  icon: React.ReactNode;
  showRetry: boolean;
}

interface ErrorScreenProps {
  /**
   * Type of error to display
   */
  type?: ErrorType;
  
  /**
   * Custom title (overrides default)
   */
  title?: string;
  
  /**
   * Custom message (overrides default)
   */
  message?: string;
  
  /**
   * Custom icon (overrides default)
   */
  icon?: React.ReactNode;
  
  /**
   * Callback function when retry button is pressed
   */
  onRetry?: () => void;
  
  /**
   * Optional secondary action button
   */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  
  /**
   * Show loading state on retry button
   */
  retryLoading?: boolean;
  
  /**
   * Custom retry button label
   */
  retryLabel?: string;
  
  /**
   * Use full screen mode (includes SafeAreaView)
   */
  fullScreen?: boolean;
  
  /**
   * Custom background color
   */
  backgroundColor?: string;
  
  /**
   * Hide retry button
   */
  hideRetry?: boolean;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorScreenConfig> = {
  [ErrorType.NETWORK]: {
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again.',
    icon: <WifiOff size={64} color="#EF4444" />,
    showRetry: true,
  },
  [ErrorType.SERVER]: {
    title: 'Something Went Wrong',
    message: 'We encountered an issue on our end. Please try again later.',
    icon: <ServerCrash size={64} color="#EF4444" />,
    showRetry: true,
  },
  [ErrorType.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The content you are looking for could not be found.',
    icon: <AlertCircle size={64} color="#F59E0B" />,
    showRetry: false,
  },
  [ErrorType.UNAUTHORIZED]: {
    title: 'Unauthorized',
    message: 'You need to sign in to access this content.',
    icon: <XCircle size={64} color="#EF4444" />,
    showRetry: false,
  },
  [ErrorType.FORBIDDEN]: {
    title: 'Access Denied',
    message: 'You do not have permission to access this content.',
    icon: <XCircle size={64} color="#EF4444" />,
    showRetry: false,
  },
  [ErrorType.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    icon: <AlertCircle size={64} color="#F59E0B" />,
    showRetry: true,
  },
  [ErrorType.GENERIC]: {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    icon: <AlertCircle size={64} color="#EF4444" />,
    showRetry: true,
  },
};

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  type = ErrorType.GENERIC,
  title,
  message,
  icon,
  onRetry,
  secondaryAction,
  retryLoading = false,
  retryLabel = 'Try Again',
  fullScreen = true,
  backgroundColor = '#FFFFFF',
  hideRetry = false,
}) => {
  // Get default config and merge with custom props
  const defaultConfig = ERROR_CONFIGS[type];
  const finalTitle = title || defaultConfig.title;
  const finalMessage = message || defaultConfig.message;
  const finalIcon = icon || defaultConfig.icon;
  const showRetryButton = !hideRetry && (defaultConfig.showRetry && onRetry);

  const ContentView = (
    <View
      className="flex-1 justify-center items-center px-6"
      style={{ backgroundColor }}
    >
      {/* Error Icon */}
      <View className="mb-6">{finalIcon}</View>

      {/* Error Title */}
      <Text className="text-2xl font-bold text-neutral-900 text-center mb-3">
        {finalTitle}
      </Text>

      {/* Error Message */}
      <Text className="text-base text-neutral-600 text-center mb-8 leading-6">
        {finalMessage}
      </Text>

      {/* Action Buttons */}
      <View className="w-full max-w-sm">
        {/* Primary Action (Retry) */}
        {showRetryButton && (
          <TouchableOpacity
            onPress={onRetry}
            disabled={retryLoading}
            className={`rounded-xl px-6 py-4 mb-3 flex-row items-center justify-center ${
              retryLoading ? 'bg-primary-400' : 'bg-primary-600'
            }`}
            activeOpacity={0.8}
          >
            {retryLoading ? (
              <>
                <RefreshCw size={20} color="#FFFFFF" className="animate-spin" />
                <Text className="text-white font-semibold text-base ml-2">
                  Retrying...
                </Text>
              </>
            ) : (
              <>
                <RefreshCw size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  {retryLabel}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Secondary Action */}
        {secondaryAction && (
          <TouchableOpacity
            onPress={secondaryAction.onPress}
            className="border-2 border-neutral-300 rounded-xl px-6 py-4"
            activeOpacity={0.8}
          >
            <Text className="text-neutral-700 font-semibold text-base text-center">
              {secondaryAction.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (fullScreen) {
    return <SafeAreaView className="flex-1">{ContentView}</SafeAreaView>;
  }

  return ContentView;
};

export default ErrorScreen;