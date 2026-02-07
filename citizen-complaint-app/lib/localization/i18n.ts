import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation resources
const resources = {
  en: {
    translation: {
      // Auth
      login: 'Login',
      loginSubtitle: 'Sign in to continue to your account',
      register: 'Register',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      
      // Registration
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name',
      suffix: 'Suffix (Optional)',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      
      // Contact & Address
      contactInfo: 'Contact Information',
      phoneNumber: 'Phone Number',
      addressInfo: 'Address Information',
      barangay: 'Barangay',
      selectBarangay: 'Select Barangay',
      streetAddress: 'Street Address / House Number',
      zone: 'Zone / Purok (Optional)',
      
      // ID Verification
      idVerification: 'ID Verification',
      idType: 'Valid ID Type',
      selectIdType: 'Select ID Type',
      idNumber: 'ID Number',
      uploadIdFront: 'Upload ID (Front)',
      uploadIdBack: 'Upload ID (Back)',
      uploadSelfie: 'Upload Selfie with ID',
      idVerificationNote: 'Please provide a valid government-issued ID for verification',
      
      // ID Types
      driversLicense: "Driver's License",
      passport: 'Passport',
      umid: 'UMID',
      sss: 'SSS ID',
      philhealth: 'PhilHealth ID',
      votersId: "Voter's ID",
      postalId: 'Postal ID',
      barangayId: 'Barangay ID',
      
      // Buttons & Actions
      submit: 'Submit',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
      tapToUpload: 'Tap to upload',
      
      // Messages
      welcome: 'Welcome',
      welcomeMessage: 'Submit complaints and concerns to your Barangay',
      registerMessage: 'Create an account to submit complaints',
      agreeTerms: 'I agree to the Terms and Conditions',
      
      // Validation messages
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      passwordMismatch: 'Passwords do not match',
      minLength: 'Must be at least {{count}} characters',
      
      // Footer
      republicPhilippines: 'Republic of the Philippines',
      municipalitySantaMaria: 'Municipality of Santa Maria, Laguna',
      
      // App Title
      appTitle: 'Barangay Santa Maria',
      complaintSystem: 'Complaint System',
      age: 'Age',
    },
  },
  tl: {
    translation: {
      // Auth
      login: 'Mag-login',
      register: 'Magparehistro',
      email: 'Email Address',
      loginSubtitle: 'Mag-sign in upang magpatuloy sa iyong account',
      password: 'Password',
      confirmPassword: 'Kumpirmahin ang Password',
      forgotPassword: 'Nakalimutan ang Password?',
      noAccount: 'Walang account?',
      haveAccount: 'Mayroon nang account?',
      age: 'Edad',
      
      // Registration
      personalInfo: 'Personal na Impormasyon',
      firstName: 'Pangalan',
      middleName: 'Gitnang Pangalan',
      lastName: 'Apelyido',
      suffix: 'Suffix (Opsyonal)',
      dateOfBirth: 'Petsa ng Kapanganakan',
      gender: 'Kasarian',
      male: 'Lalaki',
      female: 'Babae',
      other: 'Iba pa',
      
      // Contact & Address
      contactInfo: 'Contact Impormasyon',
      phoneNumber: 'Numero ng Telepono',
      addressInfo: 'Impormasyon ng Address',
      barangay: 'Barangay',
      selectBarangay: 'Pumili ng Barangay',
      streetAddress: 'Address ng Kalye / Numero ng Bahay',
      zone: 'Zone / Purok (Opsyonal)',
      
      // ID Verification
      idVerification: 'Pagpapatunay ng ID',
      idType: 'Uri ng Valid ID',
      selectIdType: 'Pumili ng Uri ng ID',
      idNumber: 'Numero ng ID',
      uploadIdFront: 'I-upload ang ID (Harap)',
      uploadIdBack: 'I-upload ang ID (Likod)',
      uploadSelfie: 'I-upload ang Selfie kasama ang ID',
      idVerificationNote: 'Mangyaring magbigay ng wastong government-issued ID para sa pagpapatunay',
      
      // ID Types
      driversLicense: 'Lisensya sa Pagmamaneho',
      passport: 'Pasaporte',
      umid: 'UMID',
      sss: 'SSS ID',
      philhealth: 'PhilHealth ID',
      votersId: "Voter's ID",
      postalId: 'Postal ID',
      barangayId: 'Barangay ID',
      
      // Buttons & Actions
      submit: 'Isumite',
      cancel: 'Kanselahin',
      continue: 'Magpatuloy',
      back: 'Bumalik',
      tapToUpload: 'I-tap upang mag-upload',
      
      // Messages
      welcome: 'Maligayang pagdating',
      welcomeMessage: 'Magsumite ng reklamo at mga alalahanin sa inyong Barangay',
      registerMessage: 'Gumawa ng account upang magsumite ng reklamo',
      agreeTerms: 'Sumasang-ayon ako sa mga Tuntunin at Kondisyon',
      
      // Validation messages
      required: 'Kailangan ang field na ito',
      invalidEmail: 'Hindi wastong email address',
      passwordMismatch: 'Hindi tugma ang mga password',
      minLength: 'Dapat ay hindi bababa sa {{count}} characters',
      
      // Footer
      republicPhilippines: 'Republika ng Pilipinas',
      municipalitySantaMaria: 'Bayan ng Santa Maria, Laguna',
      
      // App Title
      appTitle: 'Barangay Santa Maria',
      complaintSystem: 'Sistema ng Reklamo',
    },
  },
};

const LANGUAGE_KEY = '@app_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // First, try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Fallback to device language
      const deviceLanguage = Localization.locale.split('-')[0];
      callback(deviceLanguage === 'tl' ? 'tl' : 'en');
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;