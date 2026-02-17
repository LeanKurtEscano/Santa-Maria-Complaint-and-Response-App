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
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  // ─── Request Interceptor ─────────────────────────────────────────────────────
  instance.interceptors.request.use(
    async (config) => {
      const net = await NetInfo.fetch();

      if (!net.isConnected) {
        return Promise.reject({ code: "OFFLINE" });
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
      // Only attempt refresh if:
      //   1. The response is 401
      //   2. We haven't already retried this request
      //   3. A refreshUrl is configured
      if (
        error.response?.status === 401 &&
        !originalConfig._retry &&
        refreshUrl
      ) {
        // If a refresh is already in flight, queue this request
        // and resolve it once the refresh completes
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

        // Mark this request as already retried so we don't loop infinitely
        originalConfig._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await SecureStore.getItemAsync('complaint_refresh_token');

          if (!refreshToken) {
            // No refresh token stored — user needs to log in again
            // but we do NOT delete anything here, state is already empty
            throw new Error('NO_REFRESH_TOKEN');
          }

          // Attempt to get a new access token using the refresh token
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

          // Persist the new tokens
          await SecureStore.setItemAsync('complaint_token', newAccessToken);

          // Only update refresh token if the backend rotated it
          if (newRefreshToken) {
            await SecureStore.setItemAsync('complaint_refresh_token', newRefreshToken);
          }

          // Unblock all queued requests with the new access token
          processQueue(null, newAccessToken);

          // Retry the original failed request with the new access token
          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalConfig);

        } catch (refreshError: any) {
          // Refresh itself failed (e.g. refresh token is expired/revoked)
          // Only NOW do we clear tokens and force logout
          const isRefreshTokenInvalid =
            refreshError.message === 'NO_REFRESH_TOKEN' ||
            refreshError.response?.status === 401 ||
            refreshError.response?.status === 403;

          if (isRefreshTokenInvalid) {
            console.warn("Refresh token invalid or expired — clearing session");
            await SecureStore.deleteItemAsync('complaint_token');
            await SecureStore.deleteItemAsync('complaint_refresh_token');

            // Notify the store so the UI redirects to login
            // Lazy import avoids circular dependency
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