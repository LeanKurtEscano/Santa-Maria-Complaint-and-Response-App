/**
 * useSubmitForm
 * 
 * A reusable custom React hook for submitting forms using TanStack Query's `useMutation`
 * with support for:
 *   - Field-level client-side validation
 *   - Network connectivity detection
 *   - Server-side error handling via Axios (or custom API client)
 *   - Multiple HTTP methods (POST, PUT, DELETE)
 * 
 * Features:
 *   - Automatically runs an array of validators before sending data.
 *   - Throws structured errors for validation, network, or server issues.
 *   - Supports custom Axios instance (`userApiClient`) for API calls.
 *   - Returns mutation object from `useMutation`, including loading state, errors, and success data.
 * 
 * Usage:
 * 
 * import { useSubmitForm } from "@/hooks/useSubmitForm";
 * import { validateFullName, validateEmail } from "@/validators/userValidators";
 * 
 * const mutation = useSubmitForm({
 *   url: "/register",
 *   method: "post", // defaults to "post"
 *   validators: [validateFullName, validateEmail],
 *   onSuccess: (data) => console.log("Form submitted successfully:", data),
 * });
 * 
 * // Trigger submission
 * mutation.mutate({ fullName: "John Doe", email: "john@example.com" });
 * 
 * Error handling:
 *   - Validation errors: mutation.error?.errors.fieldName
 *   - Network errors: mutation.error?.general ("No internet connection.")
 *   - Server/API errors: mutation.error?.general (from handleAxiosError)
 * 
 * @template T - Type of the form data object
 */


import { useMutation } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import type { AxiosInstance } from "axios";
import { handleApiError } from "@/utils/general/errorHandler";
export type ValidatorFn<T> = (data: T) => { [key: string]: string } | null;

interface UseSubmitFormOptions<T> {
  url: string;
  client: AxiosInstance;
  method?: "post" | "put" | "patch" | "delete";
  validators?: ValidatorFn<T>[];
  onSuccess?: (data: any) => void;
}


export function useSubmitForm<T = any>({
  url,
  client,
  method = "post",
  validators = [],
  onSuccess,
}: UseSubmitFormOptions<T>) {
  return useMutation({
    mutationFn: async (data: T) => {
      
      const errors: Record<string, string> = {};

      for (const validator of validators) {
        const result = validator(data);
        if (result) Object.assign(errors, result);
      }

      if (Object.keys(errors).length > 0) {
        throw { type: "validation", errors };
      }

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw { code: "OFFLINE" };
      }

      let response;

      switch (method) {
        case "post":
          response = await client.post(url, data);
          break;
        case "put":
          response = await client.put(url, data);
          break;
        case "patch":
          response = await client.patch(url, data);
          break;
        case "delete":
          response = await client.delete(url, { data });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data;
    },

    onError: (error: any) => {
      // Handle validation errors separately
      if (error.type === "validation") {
        console.log("Validation Error:", error.errors);
        return error.errors;
      }
      
      // Handle all other errors with handleApiError
      const apiError = handleApiError(error);
      console.log("Mutation Error:", apiError.message);
      return { general: apiError.message };
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });
}