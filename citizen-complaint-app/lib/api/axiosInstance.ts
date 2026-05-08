import 'react-native-get-random-values';
import axios, { AxiosInstance } from "axios";
import NetInfo from "@react-native-community/netinfo";
import { v4 as uuidv4 } from "uuid";
import * as SecureStore from 'expo-secure-store';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const createApi = (
  baseURL: string,
  refreshUrl: string | null,
  getToken?: () => Promise<string | null>,
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    // ✅ FIX: No default Content-Type here — we set it per-request in the
    // interceptor below based on whether the body is FormData or JSON.
    // Previously, hardcoding 'application/json' here caused Android (OkHttp)
    // to send the wrong Content-Type for multipart requests, while iOS
    // (NSURLSession) silently corrected it — hiding the bug on iOS only.
    timeout: 20000,
  });

  // ─── Request Interceptor ─────────────────────────────────────────────────────
  instance.interceptors.request.use(
    async (config) => {
      const net = await NetInfo.fetch();

      if (!net.isConnected) {
        return Promise.reject({ code: "OFFLINE" });
      }

      // ✅ FIX: Only set application/json when the body is NOT FormData.
      // For FormData (multipart/form-data), we let Axios set the Content-Type
      // automatically so it includes the correct boundary string.
      // Without the boundary, Android's OkHttp sends a malformed request
      // that the server rejects — showing up as "verification failed".
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }

      if (getToken) {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.warn("Error retrieving token:", err);
        }
      }

      config.headers["Idempotency-Key"] = uuidv4();

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ─── Response Interceptor ────────────────────────────────────────────────────
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalConfig = error.config;

      if (!originalConfig) return Promise.reject(error);

      // ── Handle 401 (access token expired) ──────────────────────────────────
      if (
        error.response?.status === 401 &&
        !originalConfig._retry &&
        refreshUrl
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalConfig.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalConfig);
            })
            .catch((err) => Promise.reject(err));
        }

        originalConfig._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await SecureStore.getItemAsync('complaint_refresh_token');

          if (!refreshToken) {
            throw new Error('NO_REFRESH_TOKEN');
          }

          const refreshResponse = await axios.post(
            `${refreshUrl}/refresh-token`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
              },
              timeout: 20000,
            }
          );

          const newAccessToken = refreshResponse.data.access_token;
          const newRefreshToken = refreshResponse.data.refresh_token;

          await SecureStore.setItemAsync('complaint_token', newAccessToken);

          if (newRefreshToken) {
            await SecureStore.setItemAsync('complaint_refresh_token', newRefreshToken);
          }

          processQueue(null, newAccessToken);

          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalConfig);

        } catch (refreshError: any) {
          const isRefreshTokenInvalid =
            refreshError.message === 'NO_REFRESH_TOKEN' ||
            refreshError.response?.status === 401 ||
            refreshError.response?.status === 403;

          if (isRefreshTokenInvalid) {
            console.warn("Refresh token invalid or expired — clearing session");
            await SecureStore.deleteItemAsync('complaint_token');
            await SecureStore.deleteItemAsync('complaint_refresh_token');

            const { useCurrentUser } = await import('@/store/useCurrentUserStore');
            useCurrentUser.getState().clearUser();
          }

          processQueue(refreshError, null);
          return Promise.reject(refreshError);

        } finally {
          isRefreshing = false;
        }
      }

      // ── Retry on timeout / network errors (up to 3 times) ──────────────────
      originalConfig.__retryCount = originalConfig.__retryCount || 0;

      const isTimeout = error.code === "ECONNABORTED";
      const isOffline = error.code === "OFFLINE";
      const isNetwork = !error.response && !isOffline;

      if ((isTimeout || isNetwork) && originalConfig.__retryCount < 3) {
        originalConfig.__retryCount += 1;

        const delay = Math.pow(2, originalConfig.__retryCount) * 1000;
        await new Promise((res) => setTimeout(res, delay));

        return instance(originalConfig);
      }

      if (isOffline)
        return Promise.reject({ code: "OFFLINE", message: "No internet connection" });

      if (isTimeout)
        return Promise.reject({ code: "TIMEOUT", message: "Request timed out" });

      if (isNetwork)
        return Promise.reject({ code: "NETWORK_ERROR", message: "Network error" });

      return Promise.reject(error);
    }
  );

  return instance;
};