export interface AppError {
  message: string;
  code?: string;
  status?: number;
}

export const handleApiError = (err: any): AppError => {
  
  const networkErrors: Record<string, string> = {
    OFFLINE: "No internet connection. Please check your network.",
    TIMEOUT: "Request timed out. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
  };

  if (err.code && networkErrors[err.code]) {
    return { message: networkErrors[err.code], code: err.code };
  }

  
  const statusMessages: Record<number, string> = {
    400: "Invalid request data.",
    401: "Invalid credentials. Please try again.",
    403: "You do not have permission to perform this action.",
    404: "Resource not found.",
    422: "Validation error.",
    500: "Server error. Please try again later.",
    503: "Service temporarily unavailable.",
  };

  if (err.response) {
    const { status, data } = err.response;
    return {
      message: data?.message || statusMessages[status] || "Something went wrong.",
      status,
    };
  }

  // Fallback
  return { message: err?.message || "An unexpected error occurred." };
};
