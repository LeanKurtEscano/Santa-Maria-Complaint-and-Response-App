import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import { User } from "@/types/general/user";
import { userApiClient } from "@/lib/client/user";

interface UserState {
  userData: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUserData: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => Promise<void>;
  logout: () => Promise<void>; // New method for logout
  mapUserFromBackend: (data: any) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useCurrentUser = create<UserState>((set, get) => ({
  userData: null,
  loading: true,
  isAuthenticated: false,

  setUserData: (user) => set({ userData: user }),

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
  
  mapUserFromBackend: (data) => {
    console.log(data)
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

  fetchCurrentUser: async () => {
    try {
      set({ loading: true });

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
      
      // Only clear token if it's an auth error (401/403)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        await get().logout(); // Use the logout method
      } else {
        set({ loading: false });
        throw error; 
      }
    }
  },
}));