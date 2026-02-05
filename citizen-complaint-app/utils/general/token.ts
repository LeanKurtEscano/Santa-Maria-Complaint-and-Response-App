import * as SecureStore from "expo-secure-store";

export const getAccessToken = async (): Promise<string | null> => {
  console.log("Fetching access token from secure store", await SecureStore.getItemAsync("etaas_access_token"));
  return await SecureStore.getItemAsync("etaas_access_token");
};