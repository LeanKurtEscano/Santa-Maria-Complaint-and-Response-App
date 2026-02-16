import { createApiClient } from "../api/createClient";
import { createApi } from "../api/axiosInstance";
import { getAccessToken } from "@/utils/general/token";

const IP_URL = process.env.EXPO_PUBLIC_IP_URL;

export const barangayApiClient = createApiClient(createApi(`${IP_URL}/api/v1/barangays`,`${IP_URL}/api/v1/users`,getAccessToken));