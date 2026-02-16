import { createApiClient } from "../api/createClient";
import { createApi } from "../api/axiosInstance";
import { getAccessToken } from "@/utils/general/token";
import { useCurrentUser } from "@/store/useCurrentUserStore";

const IP_URL = process.env.EXPO_PUBLIC_IP_URL;
export const authApiClient = createApiClient(createApi(`${IP_URL}/api/v1/auth`,null,getAccessToken));
export const userApiClient = createApiClient(createApi(`${IP_URL}/api/v1/users`,`${IP_URL}/api/v1/users`,getAccessToken,useCurrentUser().logout));