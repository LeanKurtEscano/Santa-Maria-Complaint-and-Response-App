  // Add this function to handle clearing registration on successful completion

import AsyncStorage from "@react-native-async-storage/async-storage/lib/typescript/AsyncStorage";

  // You can call this from your OTP screen when verification succeeds
  export const clearRegistrationData = async () => {
    try {
      await AsyncStorage.removeItem('registrationFormData');
      await AsyncStorage.removeItem('registrationData');
      console.log('All registration data cleared');
    } catch (error) {
      console.error('Error clearing registration data:', error);
    }
  };