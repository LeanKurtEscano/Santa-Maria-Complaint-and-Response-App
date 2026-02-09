import { createApiClient } from "../api/createClient";
import { createApi } from "../api/axiosInstance";
import { getAccessToken } from "@/utils/general/token";
const IP_URL = process.env.EXPO_PUBLIC_IP_URL;

export const authApiClient = createApiClient(createApi(`${IP_URL}/v1/api/auth`,getAccessToken));