import { AxiosError } from 'axios';
import { ErrorType } from '@/screen/general/ErrorScreen';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  type: ErrorType;
}

/**
 * Unified error handler that combines error type classification and message extraction
 * Use this as the primary error handling utility
 * 
 * @example
 * const { error, refetch } = useQuery({...});
 * 
 * if (error) {
 *   const appError = handleApiError(error);
 *   return (
 *     <ErrorScreen 
 *       type={appError.type} 
 *       message={appError.message}
 *       onRetry={refetch} 
 *     />
 *   );
 * }
 */
export const handleApiError = (err: any): AppError => {
  // Network error messages
  const networkErrors: Record<string, string> = {
    OFFLINE: "No internet connection. Please check your network.",
    TIMEOUT: "Request timed out. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    ECONNABORTED: "Connection aborted. Please try again.",
    ENOTFOUND: "Unable to connect. Please check your internet connection.",
    ECONNREFUSED: "Connection refused. Please try again later.",
    ERR_NETWORK: "Network error. Please check your connection.",
  };

  // Status-based error messages
  const statusMessages: Record<number, string> = {
    400: "Invalid request data.",
    401: "Invalid credentials. Please try again.",
    403: "You do not have permission to perform this action.",
    404: "Resource not found.",
    408: "Request timed out. Please try again.",
    422: "Validation error. Please check your input.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Something Went Wrong. Please try again later.",
    502: "Bad gateway. Please try again later.",
    503: "Service temporarily unavailable.",
    504: "Gateway timeout. Please try again.",
  };

  // Check if it's an Axios error
  if (err?.isAxiosError) {
    const axiosError = err as AxiosError;
    
    // No response - network or timeout error
    if (!axiosError.response) {
      const errorCode = axiosError.code || '';
      
      // Check for timeout
      if (
        errorCode === 'ECONNABORTED' || 
        axiosError.message?.toLowerCase().includes('timeout')
      ) {
        return {
          message: networkErrors.TIMEOUT,
          code: errorCode,
          type: ErrorType.TIMEOUT,
        };
      }
      
      // Check for specific network error codes
      if (networkErrors[errorCode]) {
        return {
          message: networkErrors[errorCode],
          code: errorCode,
          type: ErrorType.NETWORK,
        };
      }
      
      // Generic network error
      return {
        message: networkErrors.NETWORK_ERROR,
        code: errorCode || 'NETWORK_ERROR',
        type: ErrorType.NETWORK,
      };
    }

    // Has response - classify by status code
    const status = axiosError.response.status;
    const data = axiosError.response.data as any;

    // Extract custom message from backend if available
    let customMessage: string | undefined;
    if (data?.message) {
      customMessage = data.message;
    } else if (data?.error) {
      customMessage = typeof data.error === 'string' ? data.error : data.error.message;
    } else if (data?.errors && Array.isArray(data.errors)) {
      customMessage = data.errors[0]?.message || data.errors[0];
    }

    // Determine error type based on status
    let errorType: ErrorType;
    if (status === 401) {
      errorType = ErrorType.UNAUTHORIZED;
    } else if (status === 403) {
      errorType = ErrorType.FORBIDDEN;
    } else if (status === 404) {
      errorType = ErrorType.NOT_FOUND;
    } else if (status === 408) {
      errorType = ErrorType.TIMEOUT;
    } else if (status >= 500) {
      errorType = ErrorType.SERVER;
    } else {
      errorType = ErrorType.GENERIC;
    }

    return {
      message: customMessage || statusMessages[status] || "Something went wrong.",
      status,
      type: errorType,
    };
  }

  // Check for generic network errors (non-Axios)
  const errorMessage = err?.message?.toLowerCase() || '';
  const errorCode = err?.code || '';
  
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('internet') ||
    errorCode === 'ERR_NETWORK' ||
    networkErrors[errorCode]
  ) {
    return {
      message: networkErrors[errorCode] || networkErrors.NETWORK_ERROR,
      code: errorCode,
      type: ErrorType.NETWORK,
    };
  }

  // Fallback to generic error
  return {
    message: err?.message || "An unexpected error occurred.",
    type: ErrorType.GENERIC,
  };
};

/**
 * Get ErrorType from error object (for backwards compatibility)
 * Prefer using handleApiError() for complete error information
 * 
 * @example
 * const errorType = getErrorType(error);
 * <ErrorScreen type={errorType} onRetry={refetch} />
 */
export const getErrorType = (error: any): ErrorType => {
  return handleApiError(error).type;
};

/**
 * Get custom error message from error object (for backwards compatibility)
 * Prefer using handleApiError() for complete error information
 * 
 * @example
 * const message = getErrorMessage(error);
 * <ErrorScreen message={message} />
 */
export const getErrorMessage = (error: any): string => {
  return handleApiError(error).message;
};

/**
 * Check if error is retryable
 * Used to determine if retry button should be shown
 * 
 * @example
 * if (isRetryableError(error)) {
 *   return <ErrorScreen onRetry={refetch} />;
 * }
 */
export const isRetryableError = (error: any): boolean => {
  const errorType = getErrorType(error);
  
  return [
    ErrorType.NETWORK,
    ErrorType.SERVER,
    ErrorType.TIMEOUT,
    ErrorType.GENERIC,
  ].includes(errorType);
};

/**
 * Log error for debugging purposes
 * Only logs full error details in development mode
 * 
 * @example
 * try {
 *   await api.get('/data');
 * } catch (error) {
 *   logError(error, 'fetchData');
 *   throw error;
 * }
 */
export const logError = (error: any, context?: string): void => {
  const appError = handleApiError(error);
  
  console.error('Error occurred:', {
    context,
    type: appError.type,
    status: appError.status,
    code: appError.code,
    message: appError.message,
    // Only log full error in development
    error: __DEV__ ? error : undefined,
  });
};