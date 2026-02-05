import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import { User } from "@/types/general/user";
import { userApiClient } from "@/lib/client/user";

interface UserState {
  userData: User | null;
  loading: boolean;
  setUserData: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => Promise<void>;
  mapUserFromBackend: (data: any) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useCurrentUser = create<UserState>((set, get) => ({
  userData: null,
  loading: true,

  setUserData: (user) => set({ userData: user }),

  setLoading: (loading) => set({ loading }),

  clearUser: async () => {
    try {
      await SecureStore.deleteItemAsync('complaint_token');
      set({ userData: null, loading: false });
    } catch (error) {
      console.error("Error clearing user:", error);
      set({ userData: null, loading: false });
    }
  },

  mapUserFromBackend: (data) => {

    const mappedUser: User = {
      id: data.id,
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      age: data.age,
      birthdate: data.birthdate,
      email: data.email,
      phone_number: data.phone_number,
      status: data.status,  
      longitude: data.longitude,
      latitude: data.latitude,
      role: data.role,
      is_administrator: data.is_administrator,
      profile: data.profile,
      suffix: data.suffix,
    };

    set({ userData: mappedUser, loading: false });
  },

  fetchCurrentUser: async () => {
    try {
      set({ loading: true });

      const token = await SecureStore.getItemAsync('complaint_token');

      if (!token) {
        set({ userData: null, loading: false });
        return;
      }

      const response = await userApiClient.get('/user-details');
      
      if (response.data) {
        get().mapUserFromBackend(response.data);
      } else {
        set({ userData: null, loading: false });
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      // Clear invalid token
      await SecureStore.deleteItemAsync('complaint_token');
      set({ userData: null, loading: false });
    }
  },
}));