import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { User } from "@/types/general/user";
import { userApiClient } from "@/lib/client/user";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

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
  setPushNotificationsEnabled: (enabled: boolean) => void;
  fetchCurrentUser: (background?: boolean) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  syncPushToken: () => Promise<void>; // 👈 added to interface
}

export const useCurrentUser = create<UserState>((set, get) => ({
  userData: null,
  loading: true,
  isAuthenticated: false,

  setUserData: (user) => set({ userData: user, isAuthenticated: !!user }),

  setPushNotificationsEnabled: (enabled: boolean) => {
    const currentUser = get().userData;
    if (!currentUser) return;
    set({
      userData: {
        ...currentUser,
        push_notifications_enabled: enabled,
      },
    });
  },

  setLoading: (loading) => set({ loading }),

  clearUser: async () => {
    try {
      await SecureStore.deleteItemAsync('complaint_token');
      await SecureStore.deleteItemAsync('complaint_refresh_token');
      set({ userData: null, loading: false, isAuthenticated: false });
    } catch {
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('complaint_token');
      await SecureStore.deleteItemAsync('complaint_refresh_token');
      set({ userData: null, loading: false, isAuthenticated: false });
    } catch {
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  checkAuthStatus: async () => {
    try {
      set({ loading: true });

      const refreshToken = await SecureStore.getItemAsync('complaint_refresh_token');

      if (!refreshToken) {
        set({ userData: null, loading: false, isAuthenticated: false });
        return;
      }

      if (isTokenExpired(refreshToken)) {
        console.log("Refresh token expired, clearing session...");
        await get().clearUser();
        return;
      }

      console.log("Refresh token valid, fetching user profile...");
      await get().fetchCurrentUser();

      // 👇 After user is hydrated, silently sync push token
      await get().syncPushToken();

    } catch (error) {
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  // 👇 New method — silent, never blocks login, never requests permission
  syncPushToken: async () => {
    try {
      const { userData } = get();

      // Guard: must be logged in, verified, and have push enabled on server
      if (!userData || !userData.is_verified || !userData.push_notifications_enabled) {
        console.log("syncPushToken: skipped —", {
          hasUser: !!userData,
          isVerified: userData?.is_verified,
          pushEnabled: userData?.push_notifications_enabled,
        });
        return;
      }

      // Guard: must be a real device (not simulator)
      if (!Device.isDevice) {
        console.log("syncPushToken: skipped — not a physical device");
        return;
      }

      // Guard: only sync if permission is already granted — never prompt here
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log("syncPushToken: skipped — permission not granted");
        return;
      }

      // Get current token and re-register silently
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      await userApiClient.post('/push-token', { token });

      console.log("syncPushToken: token synced successfully");
    } catch {
      // Silently fail — a token sync failure must never break login
      console.log("syncPushToken: failed silently");
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
      phone_number: data.phone_number,
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
      is_verified: data.is_verified === true || data.is_verified === 1 || data.is_verified === "true",
      push_notifications_enabled: data.push_notifications_enabled === true || data.push_notifications_enabled === 1 || data.push_notifications_enabled === "true",
    };

    set({ userData: mappedUser, loading: false, isAuthenticated: true });
  },

  fetchCurrentUser: async (background = false) => {
    try {
      if (!background) {
        set({ loading: true });
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
      set({ loading: false });
      throw error;
    }
  },
}));