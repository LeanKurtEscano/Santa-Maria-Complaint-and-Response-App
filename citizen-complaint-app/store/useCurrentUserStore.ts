import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { User } from "@/types/general/user";
import { userApiClient } from "@/lib/client/user";

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (!exp) return true;
  
    return Date.now() >= exp * 1000;
  } catch {
    return true; 
  }
};

interface UserState {
  userData: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUserData: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => Promise<void>;
  logout: () => Promise<void>;
  mapUserFromBackend: (data: any) => void;
  fetchCurrentUser: (background?: boolean) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useCurrentUser = create<UserState>((set, get) => ({
  userData: null,
  loading: true,
  isAuthenticated: false,

  setUserData: (user) => set({ userData: user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ loading }),

  clearUser: async () => {
    try {
      await SecureStore.deleteItemAsync('complaint_token');
      await SecureStore.deleteItemAsync('complaint_refresh_token');
      set({ userData: null, loading: false, isAuthenticated: false });
    } catch (error) {
      console.error("Error clearing user:", error);
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('complaint_token');
      await SecureStore.deleteItemAsync('complaint_refresh_token');
      set({ userData: null, loading: false, isAuthenticated: false });
    } catch (error) {
      console.error("Error during logout:", error);
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  // Called on app launch in _layout.tsx to determine if user is still authenticated
  checkAuthStatus: async () => {
    try {
      set({ loading: true });

      const refreshToken = await SecureStore.getItemAsync('complaint_refresh_token');

      // No refresh token at all → not authenticated
      if (!refreshToken) {
        set({ userData: null, loading: false, isAuthenticated: false });
        return;
      }

      // Refresh token exists but is expired → not authenticated
      if (isTokenExpired(refreshToken)) {
        console.log("Refresh token expired, clearing session...");
        await get().clearUser();
        return;
      }

      // Refresh token is still valid → fetch the user profile to hydrate state
      console.log("Refresh token valid, fetching user profile...");
      await get().fetchCurrentUser();

    } catch (error) {
      console.error("Error checking auth status:", error);
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  mapUserFromBackend: (data) => {
    console.log("Mapping user data:", data);
    const mappedUser: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      is_administrator: data.is_administrator,

      profile_image: data.profile_image,
      last_login: data.last_login,
      created_at: data.created_at,
      updated_at: data.updated_at,

      first_name: data.first_name,
      last_name: data.last_name,
      age: data.age,
      gender: data.gender,
      barangay: data.barangay,
      full_address: data.full_address,
      zip_code: data.zip_code,

      latitude: data.latitude,
      longitude: data.longitude,

      id_type: data.id_type,
      id_number: data.id_number,
      front_id: data.front_id,
      back_id: data.back_id,
      selfie_with_id: data.selfie_with_id,
    };

    set({ userData: mappedUser, loading: false, isAuthenticated: true });
  },

  fetchCurrentUser: async (background = false) => {
  try {
    if (!background) {
      set({ loading: true }); // Only show loading on initial/explicit loads
    }

    const token = await SecureStore.getItemAsync('complaint_token');

    if (!token) {
      set({ userData: null, loading: false, isAuthenticated: false });
      return;
    }

    const response = await userApiClient.get('/profile');

    if (response.data) {
      get().mapUserFromBackend(response.data);
    } else {
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    set({ loading: false });
    throw error;
  }
},

}));