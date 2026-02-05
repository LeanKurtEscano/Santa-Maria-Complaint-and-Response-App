import axios, { AxiosInstance } from "axios";
export const createApi = (
  baseURL: string,
  getToken?: () => Promise<string | null> 
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (getToken) {
    instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn("Error retrieving token:", error);
        }
        return config;
      },
      (error) => {

         
          Promise.reject(error)
      }
    );
  }

  return instance;
};
