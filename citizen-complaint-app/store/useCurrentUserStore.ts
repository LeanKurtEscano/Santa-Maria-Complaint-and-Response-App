import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { User } from "@/types/general/user";
import { userApiClient } from "@/lib/client/user";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

let isSyncing = false;
let isFetchingUser = false;

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
  lastSyncedPushToken: string | null;
  setUserData: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => Promise<void>;
  logout: () => Promise<void>;
  mapUserFromBackend: (data: any) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  fetchCurrentUser: (background?: boolean) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  syncPushToken: () => Promise<void>;
}

export const useCurrentUser = create<UserState>((set, get) => ({
  userData: null,
  loading: true,
  isAuthenticated: false,
  lastSyncedPushToken: null,

  setUserData: (user) =>
    set({ userData: user, isAuthenticated: !!user }),

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
    set({
      userData: null,
      loading: false,
      isAuthenticated: false,
      lastSyncedPushToken: null,
    });

    await Promise.all([
      SecureStore.deleteItemAsync("complaint_token"),
      SecureStore.deleteItemAsync("complaint_refresh_token"),
    ]).catch(() => {});
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("complaint_token");
    await SecureStore.deleteItemAsync("complaint_refresh_token");
    set({ userData: null, loading: false, isAuthenticated: false, lastSyncedPushToken: null });
  },

  // ✅ AUTH STATUS
  checkAuthStatus: async () => {
    try {
      set({ loading: true });

      const refreshToken = await SecureStore.getItemAsync(
        "complaint_refresh_token"
      );

      if (!refreshToken) {
        set({ userData: null, loading: false, isAuthenticated: false });
        return;
      }

      if (isTokenExpired(refreshToken)) {
        await get().clearUser();
        return;
      }

      await get().fetchCurrentUser();
    } catch {
      set({ userData: null, loading: false, isAuthenticated: false });
    }
  },

  // ✅ FETCH USER + AUTO SYNC TOKEN (guarded against duplicate concurrent calls)
  fetchCurrentUser: async (background = false) => {
    if (isFetchingUser) return; // a fetch is already in progress, skip this call

    try {
      isFetchingUser = true;

      if (!background) set({ loading: true });

      const token = await SecureStore.getItemAsync("complaint_token");

      if (!token) {
        set({ userData: null, loading: false, isAuthenticated: false });
        return;
      }

      const response = await userApiClient.get("/profile");

      if (response.data) {
        get().mapUserFromBackend(response.data);

        setTimeout(() => {
          get().syncPushToken();
        }, 300);
      } else {
        set({ userData: null, loading: false, isAuthenticated: false });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    } finally {
      isFetchingUser = false;
    }
  },

  syncPushToken: async () => {
    try {
      if (isSyncing) return;
      isSyncing = true;

      const { userData, lastSyncedPushToken } = get();

      if (
        !userData ||
        !userData.is_verified ||
        !userData.push_notifications_enabled
      ) {
        isSyncing = false;
        return;
      }

      if (!Device.isDevice) {
        isSyncing = false;
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        isSyncing = false;
        return;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: "803edf0b-f96a-4f5c-96db-7ac1fe268656",
      });

      if (!token || !token.startsWith("ExponentPushToken")) {
        isSyncing = false;
        return;
      }

      if (lastSyncedPushToken === token) {
        console.log("✅ Push token already synced, skipping duplicate request");
        isSyncing = false;
        return;
      }

      await userApiClient.post("/push-token", { token });
      set({ lastSyncedPushToken: token });

      console.log("✅ Push token synced");
    } catch {
      console.log("⚠️ Push sync failed silently");
    } finally {
      isSyncing = false;
    }
  },

  mapUserFromBackend: (data) => {
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
      clerk_user_id: data.clerk_user_id,
      is_verified:
        data.is_verified === true ||
        data.is_verified === 1 ||
        data.is_verified === "true",

      push_notifications_enabled:
        data.push_notifications_enabled === true ||
        data.push_notifications_enabled === 1 ||
        data.push_notifications_enabled === "true",

      can_submit_complaints:
        data.can_submit_complaints == null
          ? true
          : data.can_submit_complaints === true ||
            data.can_submit_complaints === 1 ||
            data.can_submit_complaints === "true",

      is_suspended:
        data.is_suspended == null
          ? false
          : data.is_suspended === true ||
            data.is_suspended === 1 ||
            data.is_suspended === "true",
    };

    set({
      userData: mappedUser,
      loading: false,
      isAuthenticated: true,
    });
  },
}));