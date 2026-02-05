// utils/handleAxiosError.ts
import { AxiosError } from "axios";

export function handleAxiosError(error: unknown) {
  if (!error) return "Unknown error occurred";

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;

    // No response -> likely network error
    if (!axiosError.response) {
      return "No internet connection. Please try again.";
    }

    // Server errors (5xx)
    if (axiosError.response.status >= 500) {
      return "Server error. Please try again later.";
    }

    // Client errors (4xx)
    if (axiosError.response.status >= 400 && axiosError.response.status < 500) {
      return axiosError.response.data?.message || "Invalid request";
    }
  }

  // Fallback
  return (error as Error).message || "Something went wrong";
}
