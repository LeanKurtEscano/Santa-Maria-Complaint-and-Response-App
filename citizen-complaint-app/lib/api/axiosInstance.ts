import 'react-native-get-random-values'; // Must be first!
import axios, { AxiosInstance } from "axios";
import NetInfo from "@react-native-community/netinfo";
import { v4 as uuidv4 } from "uuid";
import { userApiClient } from '../client/user';

// Track if we're currently refreshing to avoid multiple simultaneous refresh calls
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
  getToken?: () => Promise<string | null>,
  onLogout?: () => void // Callback to redirect to login
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

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

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const config = error.config;
      if (!config) return Promise.reject(error);

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && !config._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              config.headers.Authorization = `Bearer ${token}`;
              return instance(config);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        config._retry = true;
        isRefreshing = true;

        try {
          console.log()
          const response = await userApiClient.post('/refresh-token');
          const newAccessToken = response.data.access_token;

          // Update the token in your storage/state here
          // await AsyncStorage.setItem('access_token', newAccessToken);

          // Process queued requests with new token
          processQueue(null, newAccessToken);

          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(config);
        } catch (refreshError: any) {
          // Refresh token is also expired or invalid
          processQueue(refreshError, null);

          // Clear tokens and redirect to login
          // await AsyncStorage.removeItem('access_token');
          // await AsyncStorage.removeItem('refresh_token');
          
          if (onLogout) {
            onLogout(); // Trigger logout/redirect to login
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Retry logic for timeouts and network errors
      config.__retryCount = config.__retryCount || 0;

      const isTimeout = error.code === "ECONNABORTED";
      const isNetwork = !error.response;

      if ((isTimeout || isNetwork) && config.__retryCount < 3) {
        config.__retryCount += 1;

        const delay = Math.pow(2, config.__retryCount) * 1000;
        await new Promise((res) => setTimeout(res, delay));

        return instance(config);
      }

      if (isTimeout)
        return Promise.reject({ code: "TIMEOUT", message: "Slow network" });

      if (isNetwork)
        return Promise.reject({
          code: "NETWORK_ERROR",
          message: "No internet",
        });

      return Promise.reject(error);
    }
  );

  return instance;
};