import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface ErrorMessageProps {
  message?: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) =>
  message ? (
    <View className="flex-row items-center mt-2">
      <AlertCircle size={14} color="#EF4444" />
      <Text className="text-error-600 text-xs ml-1">{message}</Text>
    </View>
  ) : null;

export default ErrorMessage;