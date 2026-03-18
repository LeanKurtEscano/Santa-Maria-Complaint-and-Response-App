import * as SecureStore from "expo-secure-store";

import axios from "axios";

export const getAccessToken = async (): Promise<string | null> => {
  console.log("Fetching access token from secure store", await SecureStore.getItemAsync("complaint_token"));
  return await SecureStore.getItemAsync("complaint_token");
};



export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('complaint_refresh_token');
    if (!refreshToken) return null;

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_IP_URL}/api/v1/auth/refresh-token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
        timeout: 20000,
      }
    );

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;

    await SecureStore.setItemAsync('complaint_token', newAccessToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync('complaint_refresh_token', newRefreshToken);
    }

    return newAccessToken;
  } catch {
    return null;
  }
};