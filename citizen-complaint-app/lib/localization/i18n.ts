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

      // OTP Verification
      verifyYourEmail: "Verify Your Email",
      otpSentMessage: "We've sent a 6-digit verification code to",
      enterVerificationCode: "Enter Verification Code",
      "didn'tReceiveCode": "Didn't receive the code?",
      resendOTP: "Resend OTP",
      resendIn: "Resend in",
      verifyOTP: "Verify Code",
      importantNotice: "Important Notice",
      otpVerificationNotice: "After verifying your email, your account will be reviewed by our team. You will receive a confirmation email once approved.",

      // Verification Pending Screen
      registrationSubmitted: "Registration Submitted!",
      accountUnderReview: "Your account is now under review by our verification team.",
      verificationEmailNotice: "You will receive an email notification once your account has been approved.",
      officialNotice: "Official Notice",
      applicationReceived: "Application Received",
      applicationReceivedDesc: "Your registration has been successfully submitted.",
      documentVerification: "Document Verification",
      documentVerificationDesc: "Our team is currently reviewing your submitted documents and information.",
      emailNotification: "Email Notification",
      emailNotificationDesc: "We will send you an email at:",
      verificationTimeline: "Verification Timeline",
      verificationTimelineDesc: "Account verification typically takes 1-3 business days. You will be notified via email once the process is complete.",
      whatsNext: "What's Next?",
      whatsNext1: "Check your email regularly for updates on your verification status",
      whatsNext2: "Ensure the email address you provided is correct and accessible",
      whatsNext3: "Once approved, you can log in using your registered credentials",
      backToLogin: "Back to Login",
      verificationHelpText: "Need help? Contact our support team at support@barangay.gov.ph",

      // Common
      common: {
        ok: "OK",
        cancel: "Cancel",
        error: "Error",
        loading: "Loading...",
        save: "Save",
        update: "Update"
      },

      // Profile
      profile: {
        title: "My Profile",
        loadingProfile: "Loading profile...",
        failedToLoad: "Failed to Load Profile",
        unableToRetrieve: "Unable to retrieve your profile information.",
        location: {
          required: "Location Required",
          requiredMessage: "Enable location access to file complaints in your area.",
          autoDetect: "Auto-Detect Location",
          pinOnMap: "Pin on Map",
          enabled: "Location Enabled",
          enabledMessage: "You can file complaints now. If you are in the complaint area, tap the white button on the map to use your current location.",
          updateLocation: "Update Location",
          saving: "Saving...",
          updating: "Updating...",
          useMap: "Use Map",
          success: {
            title: "Success",
            message: "Your location has been saved successfully!"
          },
          permissionDenied: {
            title: "Permission Denied",
            message: "Location permission was denied. You can still set your location manually using the map."
          }
        },
        personalInfo: {
          title: "Personal Information",
          email: "EMAIL",
          fullName: "FULL NAME",
          age: "AGE",
          gender: "GENDER",
          barangay: "BARANGAY",
          fullAddress: "FULL ADDRESS",
          yearsOld: "years old"
        },
        accountInfo: {
          title: "Account Information",
          role: "ACCOUNT ROLE",
          memberSince: "MEMBER SINCE"
        },
        logout: {
          title: "Logout",
          confirmMessage: "Are you sure you want to logout?"
        }
      },

      // Settings
      settings: {
        title: "Settings",
        preferences: "Preferences",
        localization: {
          title: "Localization",
          language: "Language",
          selectLanguage: "Select Language",
          english: "English",
          tagalog: "Tagalog"
        },
        notifications: {
          title: "Notifications",
          pushNotifications: "Push Notifications",
          emailNotifications: "Email Notifications",
          complaintUpdates: "Complaint Updates",
          newsAlerts: "News & Alerts"
        }
      },


      "complaint": {
    "screen_title": "New Complaint",

    "title_label": "Complaint Title",
    "title_placeholder": "Select a complaint category...",
    "custom_title_placeholder": "Type your own complaint title",
    "custom_title_hint": "Be specific so the barangay can act quickly.",

    "details_label": "Complaint Details",
    "details_placeholder": "Describe your complaint in detail...",

    "attachments_label": "Attachments (Optional)",
    "attachments_hint": "You can attach up to 3 files (photos, videos, or documents)",
    "attachments_count": "{{count}}/3 files attached",
    "add_attachment": "Add Attachment",
    "attachment_remaining": "Select multiple files — up to {{count}} remaining",
    "attachment_photo": "Photo",
    "attachment_photo_hint": "Select multiple from gallery",
    "attachment_video": "Video",
    "attachment_video_hint": "Select multiple from gallery",
    "attachment_document": "Document",
    "attachment_document_hint": "PDF, Word, Excel, etc.",

    "note_title": "Please Note",
    "note_body": "• Your complaint will be reviewed by the barangay office\n• You will receive updates on your complaint status\n• Please provide accurate and detailed information",

    "submit": "Submit Complaint",
    "submitting": "Submitting...",

    "success_title": "Success",
    "success_message": "Your complaint has been submitted successfully",

    "picker_title": "Select Complaint Type",
    "picker_subtitle": "Choose the category that best describes your complaint",

    "error": {
      "title_required": "Complaint title is required",
      "title_too_short": "Please enter at least 3 characters",
      "details_required": "Complaint details are required"
    },

    "preset": {
      "noise_disturbance": "Noise Disturbance",
      "illegal_dumping": "Illegal Dumping / Littering",
      "road_damage": "Road Damage / Pothole",
      "street_light_outage": "Street Light Outage",
      "flooding_drainage": "Flooding / Clogged Drainage",
      "illegal_construction": "Illegal Construction",
      "stray_animals": "Stray Animals",
      "public_intoxication": "Public Intoxication / Disorder",
      "illegal_vending": "Illegal Vending / Obstruction",
      "water_supply_issue": "Water Supply Issue",
      "garbage_collection": "Garbage Collection Problem",
      "vandalism": "Vandalism / Property Damage",
      "other": "Other (specify below)"
    }
  }
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

      // OTP Verification Screen
      verifyYourEmail: "I-verify ang Iyong Email",
      otpSentMessage: "Nagpadala kami ng 6-digit na verification code sa",
      enterVerificationCode: "Ilagay ang Verification Code",
      "didn'tReceiveCode": "Hindi natanggap ang code?",
      resendOTP: "Ipadala Muli ang OTP",
      resendIn: "Muling ipadala sa",
      verifyOTP: "I-verify ang Code",
      importantNotice: "Mahalagang Paalala",
      otpVerificationNotice: "Pagkatapos i-verify ang iyong email, ang iyong account ay susuriin ng aming team. Makakatanggap ka ng email confirmation kapag naaprubahan na.",

      // Verification Pending Screen
      registrationSubmitted: "Naisumite ang Rehistrasyon!",
      accountUnderReview: "Ang iyong account ay kasalukuyang sinusuri ng aming verification team.",
      verificationEmailNotice: "Makakatanggap ka ng email notification kapag naaprubahan na ang iyong account.",
      officialNotice: "Opisyal na Paalala",
      applicationReceived: "Natanggap ang Aplikasyon",
      applicationReceivedDesc: "Matagumpay na naisumite ang iyong rehistrasyon.",
      documentVerification: "Pag-verify ng Dokumento",
      documentVerificationDesc: "Kasalukuyang sinusuri ng aming team ang iyong mga isinumiteng dokumento at impormasyon.",
      emailNotification: "Email Notification",
      emailNotificationDesc: "Magpapadala kami ng email sa:",
      verificationTimeline: "Timeline ng Verification",
      verificationTimelineDesc: "Ang pag-verify ng account ay karaniwang tumatagal ng 1-3 araw ng negosyo. Bibigyan ka ng abiso sa email kapag tapos na ang proseso.",
      whatsNext: "Ano ang Susunod?",
      whatsNext1: "Regular na suriin ang iyong email para sa updates sa iyong verification status",
      whatsNext2: "Siguraduhing tama at accessible ang email address na iyong ibinigay",
      whatsNext3: "Kapag naaprubahan na, maaari ka nang mag-log in gamit ang iyong mga credentials",
      backToLogin: "Bumalik sa Login",
      verificationHelpText: "Kailangan ng tulong? Kontakin ang aming support team sa support@barangay.gov.ph",

      // Common
      common: {
        ok: "Sige",
        cancel: "Kanselahin",
        error: "May Mali",
        loading: "Naglo-load...",
        save: "I-save",
        update: "I-update"
      },

      // Profile
      profile: {
        title: "Aking Profile",
        loadingProfile: "Naglo-load ng profile...",
        failedToLoad: "Hindi Na-load ang Profile",
        unableToRetrieve: "Hindi makuha ang iyong impormasyon sa profile.",
        location: {
          required: "Kailangan ang Lokasyon",
          requiredMessage: "Paganahin ang access sa lokasyon upang magsumite ng reklamo sa iyong lugar.",
          autoDetect: "Auto-Detect ng Lokasyon",
          pinOnMap: "I-pin sa Mapa",
          enabled: "Naka-enable ang Lokasyon",
          enabledMessage: "Maaari ka nang magsumite ng reklamo. Kung nasa complaint area ka, i-tap ang puting button sa mapa upang gamitin ang iyong kasalukuyang lokasyon.",
          updateLocation: "I-update ang Lokasyon",
          saving: "Nag-se-save...",
          updating: "Nag-a-update...",
          useMap: "Gamitin ang Mapa",
          success: {
            title: "Tagumpay",
            message: "Matagumpay na na-save ang iyong lokasyon!"
          },
          permissionDenied: {
            title: "Tinanggihan ang Pahintulot",
            message: "Tinanggihan ang pahintulot sa lokasyon. Maaari mo pa ring itakda ang iyong lokasyon gamit ang mapa."
          }
        },
        personalInfo: {
          title: "Personal na Impormasyon",
          email: "EMAIL",
          fullName: "BUONG PANGALAN",
          age: "EDAD",
          gender: "KASARIAN",
          barangay: "BARANGAY",
          fullAddress: "BUONG ADDRESS",
          yearsOld: "taong gulang"
        },
        accountInfo: {
          title: "Impormasyon ng Account",
          role: "TUNGKULIN SA ACCOUNT",
          memberSince: "MIYEMBRO MULA"
        },
        logout: {
          title: "Mag-logout",
          confirmMessage: "Sigurado ka bang gusto mong mag-logout?"
        }
      },

      // Settings
      settings: {
        title: "Mga Setting",
        preferences: "Mga Kagustuhan",
        localization: {
          title: "Lokalisasyon",
          language: "Wika",
          selectLanguage: "Pumili ng Wika",
          english: "Ingles",
          tagalog: "Tagalog"
        },
        notifications: {
          title: "Mga Notification",
          pushNotifications: "Push Notifications",
          emailNotifications: "Email Notifications",
          complaintUpdates: "Updates sa Reklamo",
          newsAlerts: "Balita at Alerto"
        }
      },

      "complaint": {
    "screen_title": "Bagong Reklamo",

    "title_label": "Pamagat ng Reklamo",
    "title_placeholder": "Pumili ng kategorya ng reklamo...",
    "custom_title_placeholder": "I-type ang iyong sariling pamagat",
    "custom_title_hint": "Maging tiyak para mabilis maaksyunan ng barangay.",

    "details_label": "Detalye ng Reklamo",
    "details_placeholder": "Ilarawan nang detalyado ang iyong reklamo...",

    "attachments_label": "Mga Kalakip (Opsyonal)",
    "attachments_hint": "Maaari kang maglakip ng hanggang 3 file (litrato, video, o dokumento)",
    "attachments_count": "{{count}}/3 na file ang nakalakip",
    "add_attachment": "Magdagdag ng Kalakip",
    "attachment_remaining": "Pumili ng maraming file — hanggang {{count}} pa ang maaaring idagdag",
    "attachment_photo": "Litrato",
    "attachment_photo_hint": "Pumili ng marami mula sa gallery",
    "attachment_video": "Video",
    "attachment_video_hint": "Pumili ng marami mula sa gallery",
    "attachment_document": "Dokumento",
    "attachment_document_hint": "PDF, Word, Excel, atbp.",

    "note_title": "Pakitandaan",
    "note_body": "• Ang iyong reklamo ay susuriin ng tanggapan ng barangay\n• Makakatanggap ka ng mga update sa katayuan ng iyong reklamo\n• Mangyaring magbigay ng tumpak at detalyadong impormasyon",

    "submit": "Isumite ang Reklamo",
    "submitting": "Isinusumite...",

    "success_title": "Matagumpay",
    "success_message": "Matagumpay na naisumite ang iyong reklamo",

    "picker_title": "Piliin ang Uri ng Reklamo",
    "picker_subtitle": "Piliin ang kategoryang pinaka-angkop sa iyong reklamo",

    "error": {
      "title_required": "Kinakailangan ang pamagat ng reklamo",
      "title_too_short": "Mangyaring maglagay ng hindi bababa sa 3 karakter",
      "details_required": "Kinakailangan ang detalye ng reklamo"
    },

    "preset": {
      "noise_disturbance": "Abala sa Ingay",
      "illegal_dumping": "Ilegal na Pagtatapon ng Basura",
      "road_damage": "Pinsala sa Kalsada / Butas",
      "street_light_outage": "Patay na Ilaw sa Kalsada",
      "flooding_drainage": "Pagbaha / Baradong Imburnal",
      "illegal_construction": "Ilegal na Konstruksyon",
      "stray_animals": "Mga Ligaw na Hayop",
      "public_intoxication": "Pagkakalasing / Kaguluhan sa Pampublikong Lugar",
      "illegal_vending": "Ilegal na Pagnenegosyo / Harang sa Daan",
      "water_supply_issue": "Suliranin sa Suplay ng Tubig",
      "garbage_collection": "Problema sa Koleksyon ng Basura",
      "vandalism": "Vandalism / Pinsala sa Ari-arian",
      "other": "Iba pa (tukuyin sa ibaba)"
    }
  }
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
  init: () => { },
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