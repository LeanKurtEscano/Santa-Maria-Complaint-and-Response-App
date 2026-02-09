import axios, { AxiosInstance } from "axios";
import NetInfo from "@react-native-community/netinfo";
import { v4 as uuidv4 } from "uuid";

export const createApi = (
  baseURL: string,
  getToken?: () => Promise<string | null>
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 20000, // 20s timeout for slow connections
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

      config.__retryCount = config.__retryCount || 0;

      const isTimeout = error.code === "ECONNABORTED";
      const isNetwork = !error.response;

      // Retry logic (3 times with exponential backoff)
      if ((isTimeout || isNetwork) && config.__retryCount < 3) {
        config.__retryCount += 1;
        const delay = Math.pow(2, config.__retryCount) * 1000; // 1s, 2s, 4s
        await new Promise((res) => setTimeout(res, delay));
        return instance(config);
      }

     
      if (isTimeout) return Promise.reject({ code: "TIMEOUT", message: "Slow network" });
      if (isNetwork) return Promise.reject({ code: "NETWORK_ERROR", message: "No internet" });

      return Promise.reject(error);
    }
  );

  return instance;
};
