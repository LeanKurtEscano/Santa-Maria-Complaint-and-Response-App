// utils/eventErrorUtils.ts
import { ErrorType } from '@/screen/general/ErrorScreen';
import { AxiosError } from 'axios';

/**
 * Maps a fetch error to the correct ErrorType and a
 * friendly resident-facing message. Never leaks raw
 * server messages to the UI.
 */
export function getEventErrorType(error: unknown): { type: ErrorType; message: string } {
  // No network at all
  if (!navigator.onLine) {
    return {
      type: ErrorType.NETWORK,
      message: "You're offline. Please check your Wi-Fi or mobile data and try again.",
    };
  }

  const axiosError = error as AxiosError;
  const status     = axiosError?.response?.status;

  if (!status) {
    // Request never reached the server (timeout, DNS, CORS, etc.)
    return {
      type: ErrorType.NETWORK,
      message: "Couldn't reach the server. Please check your connection and try again.",
    };
  }

  if (status === 401) {
    return {
      type: ErrorType.UNAUTHORIZED,
      message: 'Your session has expired. Please sign in again to continue.',
    };
  }

  if (status === 403) {
    return {
      type: ErrorType.FORBIDDEN,
      message: "You don't have permission to view this content. Contact your administrator if this seems wrong.",
    };
  }

  if (status === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      message: 'This event no longer exists or may have been removed.',
    };
  }

  if (status === 408 || status === 504) {
    return {
      type: ErrorType.TIMEOUT,
      message: 'The request took too long. Please try again in a moment.',
    };
  }

  if (status >= 500) {
    return {
      type: ErrorType.SERVER,
      message: "We're having trouble loading events right now. Please try again shortly.",
    };
  }

  return {
    type: ErrorType.GENERIC,
    message: 'Something unexpected happened. Please try again.',
  };
}