import { createApiClient } from "../api/createClient";
import { createApi } from "../api/axiosInstance";
import { getAccessToken } from "@/utils/general/token";

const IP_URL = process.env.EXPO_PUBLIC_IP_URL;

export const emergencyApiClient = createApiClient(createApi(`${IP_URL}/api/v1/super-admin`,`${IP_URL}/api/v1/auth`,getAccessToken));
export const emergencyClassifierClient = createApiClient(createApi(`${IP_URL}/api/v1/emergency`,`${IP_URL}/api/v1/auth`,getAccessToken));

export const evacuationApiClient = createApiClient(createApi(`${IP_URL}/api/v1/evacuation-centers`,`${IP_URL}/api/v1/auth`,getAccessToken));
