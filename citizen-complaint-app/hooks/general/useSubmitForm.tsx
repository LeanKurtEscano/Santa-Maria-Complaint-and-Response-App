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
import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import { handleAxiosError } from "@/utils/general/axiosException";
import { userApiClient } from "@/lib/client/user";
export type ValidatorFn<T> = (data: T) => { [key: string]: string } | null;

interface UseSubmitFormOptions<T> {
  url: string;
  method?: "post" | "put" | "patch" | "delete";
  validators?: ValidatorFn<T>[];
  onSuccess?: (data: any) => void;
}

export function useSubmitForm<T = any>(options: UseSubmitFormOptions<T>) {
  const { url, method = "post", validators = [], onSuccess } = options;


  return useMutation({
    mutationFn: async (data: T) => {
   
      const errors: { [key: string]: string } = {};
      for (const validator of validators) {
        const result = validator(data);
        if (result) Object.assign(errors, result);
      }

      if (Object.keys(errors).length > 0) {
        throw { type: "validation", errors };
      }


      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw { type: "network", message: "No internet connection." };
      }

      let response;
      switch (method) {
        case "post":
          response = await userApiClient.post(url, data);
          break;
        case "put":
          response = await userApiClient.put(url, data);
          break;
        case "delete":
          response = await userApiClient.delete(url, { data });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data;
    },

    onError: (error: any) => {

        {/*  if (error?.type === "validation") {
        console.log("Validation Errors:", error.errors);
        return error.errors;
      }

      if (error?.type === "network") {
        console.log("Network Error:", error.message);
        return { network: error.message };
      }*/}
     

      const message = handleAxiosError(error);
      console.log("Mutation Error:", message);
      return { general: message };
    },

    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
  });
}
