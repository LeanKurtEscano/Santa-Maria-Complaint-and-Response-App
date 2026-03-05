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
  },

   "complaintsScreen": {
    "header": {
      "title": "File a Complaint",
      "subtitle": "Select a barangay to submit your complaint"
    },
    "buttons": {
      "viewMyComplaints": "View My Complaints"
    },
    "list": {
      "sectionLabel": "Available Barangays",
      "loading": "Loading barangays...",
      "empty": "No barangays available",
      "pullToRefresh": "Pull to refresh"
    },
    "errors": {
      "loadFailed": "Failed to load barangays",
      "screenTitle": "Unable to Retrieve Barangays"
    }
  },    "complaint_form": {
    "screen_title": "File a Complaint",
    "title_label": "Complaint Category",
    "title_placeholder": "Select a complaint category",
    "custom_title_placeholder": "Enter your complaint title",
    "custom_title_hint": "Briefly describe your complaint in a few words",
    "details_label": "Complaint Details",
    "details_placeholder": "Describe your complaint in full detail. Include the location, date of occurrence, and any other relevant information...",
    "attachments_label": "Supporting Attachments",
    "attachments_hint": "You may attach up to 3 files (photo, video, or document) as supporting evidence.",
    "attachments_count": "{{count}}/3 file(s) attached",
    "add_attachment": "Add Attachment",
    "attachment_remaining": "{{count}} attachment slot(s) remaining",
    "attachment_photo": "Photo",
    "attachment_photo_hint": "Select a photo from your gallery",
    "attachment_video": "Video",
    "attachment_video_hint": "Select a video from your gallery",
    "attachment_document": "Document",
    "attachment_document_hint": "Select any document file",
    "note_title": "Important Notice",
    "note_body": "Your complaint will be officially submitted to the barangay for proper review and action. Please ensure that all information provided is accurate and complete before submitting.",
    "picker_title": "Complaint Category",
    "picker_subtitle": "Select the category that best fits your complaint or concern.",
    "submit": "Review & Submit",
    "success_title": "Complaint Successfully Submitted",
    "success_message": "Your complaint has been officially received by the barangay. You will be notified once action has been taken.",
    "instructions_title": "COMPLAINT FILING INSTRUCTIONS",
    "instruction_1_title": "Select the Appropriate Category",
    "instruction_1_body": "Choose the category that best corresponds to your complaint or concern. Selecting the correct category ensures that your complaint is directed to the proper barangay officer for prompt and appropriate action.",
    "instruction_2_title": "Think Clearly and Provide Complete Details",
    "instruction_2_body": "Before submitting, carefully think through your complaint. Ensure that it is factual, specific, and meaningful. Include the exact location, date of occurrence, and all relevant information. The more specific your details, the faster the barangay can assess and resolve your concern.",
    "instruction_3_title": "Attach Supporting Evidence (If Available)",
    "instruction_3_body": "You may attach photos, videos, or documents as supporting evidence. Attachments significantly aid in the faster processing and proper evaluation of your complaint by the barangay.",
    "instruction_4_title": "WARNING: False or Malicious Complaints Are Prohibited",
    "instruction_4_body": "The filing of false, fabricated, frivolous, or malicious complaints is strictly prohibited under applicable Barangay Ordinances and the Local Government Code of the Philippines. Any person found to have knowingly submitted a fraudulent or nonsensical complaint may be subject to administrative sanctions, fines, or legal action as prescribed by law.",
    "instructions_disclaimer": "All information submitted through this form is strictly confidential and shall be used solely for official barangay purposes in accordance with applicable laws and regulations.",
    "error": {
      "title_required": "Complaint category is required.",
      "title_too_short": "Complaint title must be at least 3 characters long.",
      "details_required": "Complaint details are required."
    },

     "agreement": "By proceeding, you confirm that you have read and understood the above guidelines.",
      "proceed_to_form": "I Understand — Proceed to Form"
  },



   "complaints": {
    "header": {
      "location": "Santa Maria, Laguna",
      "title": "Aking mga Reklamo",
      "back": "Bumalik"
    },
    "search": {
      "placeholder": "Maghanap ng reklamo..."
    },
    "filter": {
      "label": "Salain",
      "labelWithCount": "Salain ({{count}})",
      "title": "Salain ayon sa Katayuan",
      "clearAll": "Alisin lahat",
      "apply": "Ilapat ang Mga Filter"
    },
    "count": "{{filtered}} sa {{total}} reklamo",
    "count_plural": "{{filtered}} sa {{total}} mga reklamo",
    "card": {
      "id": "#{{id}}"
    },
    "empty": {
      "noResults": {
        "title": "Walang nahanap na resulta",
        "description": "Subukang baguhin ang iyong mga filter o mga salitang hinahanap."
      },
      "noComplaints": {
        "title": "Wala pang reklamo",
        "description": "Wala ka pang naisumiteng reklamo."
      }
    },
    "loading": "Kinukuha ang iyong mga reklamo...",
    "error": {
      "title": "Hindi Makuha ang mga Reklamo",
      "message": "Nabigo sa pagkuha ng mga reklamo"
    }
  }, 

  "complaintDetail": {
  "header": {
    "back": "Back"
  },
  "loading": "Fetching complaint details...",
  "error": {
    "title": "Unable to Retrieve Complaint Details",
    "message": "Failed to fetch complaint details"
  },
  "hero": {
    "complaintId": "Complaint #{{id}}"
  },
  "timeline": {
    "sectionTitle": "Progress",
    "rejected": {
      "title": "Complaint Rejected",
      "description": "This complaint has been reviewed and rejected."
    }
  },
  "details": {
    "sectionTitle": "Details",
    "dateFiled": "Date Filed",
    "dateFiled_value": "{{date}} at {{time}}",
    "barangay": "Barangay",
    "barangay_value": "{{name}} — {{address}}",
    "locationDetails": "Location Details",
    "assignedDepartment": "Assigned Department",
    "priorityLevel": "Priority Level",
    "sector": "Sector"
  },
  "barangayContact": {
    "sectionTitle": "Contact the Barangay"
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
  },

   "complaintsScreen": {
    "header": {
      "title": "Mag-file ng Reklamo",
      "subtitle": "Pumili ng barangay para isumite ang iyong reklamo"
    },
    "buttons": {
      "viewMyComplaints": "Tingnan ang Aking mga Reklamo"
    },
    "list": {
      "sectionLabel": "Mga Available na Barangay",
      "loading": "Naglo-load ng mga barangay...",
      "empty": "Walang available na barangay",
      "pullToRefresh": "Hilahin para i-refresh"
    },
    "errors": {
      "loadFailed": "Hindi ma-load ang mga barangay",
      "screenTitle": "Hindi Ma-retrieve ang mga Barangay"
    }
  },
  "complaintDetail": {
    "header": {
      "back": "Bumalik"
    },
    "loading": "Kinukuha ang detalye ng reklamo...",
    "error": {
      "title": "Hindi Makuha ang Detalye ng Reklamo",
      "message": "Nabigo sa pagkuha ng detalye ng reklamo"
    },
    "hero": {
      "complaintId": "Reklamo #{{id}}"
    },
    "timeline": {
      "sectionTitle": "Progreso",
      "rejected": {
        "title": "Tinanggihan ang Reklamo",
        "description": "Ang reklamong ito ay nasuri at tinanggihan."
      }
    },
    "details": {
      "sectionTitle": "Mga Detalye",
      "dateFiled": "Petsa ng Pagsumite",
      "dateFiled_value": "{{date}} nang {{time}}",
      "barangay": "Barangay",
      "barangay_value": "{{name}} — {{address}}",
      "locationDetails": "Mga Detalye ng Lokasyon",
      "assignedDepartment": "Itinalagang Departamento",
      "priorityLevel": "Antas ng Priyoridad",
      "sector": "Sektor"
    },
    "barangayContact": {
      "sectionTitle": "Makipag-ugnayan sa Barangay"
    }
  },
  
     "complaint_form": {
    "screen_title": "Maghain ng Reklamo",
    "title_label": "Kategorya ng Reklamo",
    "title_placeholder": "Pumili ng kategorya ng reklamo",
    "custom_title_placeholder": "Ilagay ang pamagat ng inyong reklamo",
    "custom_title_hint": "Ilarawan ang inyong reklamo nang maikli",
    "details_label": "Detalye ng Reklamo",
    "details_placeholder": "Ipaliwanag ang inyong reklamo nang malinaw at detalyado. Isama ang lokasyon, petsa ng pangyayari, at lahat ng kaugnay na impormasyon...",
    "attachments_label": "Mga Kalakip na Patunay",
    "attachments_hint": "Maaari kang maglakip ng hanggang 3 na file (larawan, video, o dokumento) bilang karagdagang patunay.",
    "attachments_count": "{{count}}/3 na file ang naka-attach",
    "add_attachment": "Magdagdag ng Kalakip",
    "attachment_remaining": "{{count}} na kalakip pa ang maaaring idagdag",
    "attachment_photo": "Larawan",
    "attachment_photo_hint": "Pumili ng larawan mula sa inyong gallery",
    "attachment_video": "Video",
    "attachment_video_hint": "Pumili ng video mula sa inyong gallery",
    "attachment_document": "Dokumento",
    "attachment_document_hint": "Pumili ng anumang dokumento",
    "note_title": "Mahalagang Paunawa",
    "note_body": "Ang inyong reklamo ay opisyal na isusumite sa barangay para sa tamang pagsusuri at aksyon. Tiyaking tama at kumpleto ang lahat ng impormasyong ibinigay bago isumite.",
    "picker_title": "Kategorya ng Reklamo",
    "picker_subtitle": "Piliin ang kategoryang pinaka-angkop sa inyong reklamo o suliranin.",
    "submit": "Suriin at Isumite",
    "success_title": "Matagumpay na Naisumite ang Reklamo",
    "success_message": "Ang inyong reklamo ay opisyal na natanggap ng barangay. Kayo ay aabisuhan sa sandaling may aksyong magawa.",
    "instructions_title": "MGA TAGUBILIN SA PAGHAHAIN NG REKLAMO",
    "instruction_1_title": "Pumili ng Tamang Kategorya",
    "instruction_1_body": "Piliin ang kategoryang pinaka-angkop sa inyong reklamo o suliranin. Ang tamang pagpili ng kategorya ay nagsisiguro na ang inyong reklamo ay mapupunta sa tamang kagawad ng barangay para sa mabilis at naaangkop na aksyon.",
    "instruction_2_title": "Mag-isip nang Maayos at Magbigay ng Kumpletong Detalye",
    "instruction_2_body": "Bago isumite, pag-isipan mabuti ang inyong reklamo. Tiyaking ito ay batay sa katotohanan, tiyak, at may saysay. Isama ang eksaktong lokasyon, petsa ng pangyayari, at lahat ng kaugnay na impormasyon. Ang mas detalyadong ulat ay nagbibigay-daan sa mas mabilis na pagsusuri at resolusyon ng barangay.",
    "instruction_3_title": "Maglakip ng Patunay (Kung Mayroon)",
    "instruction_3_body": "Maaari kayong maglakip ng mga larawan, video, o dokumento bilang karagdagang patunay. Ang mga kalakip ay malaki ang maitutulong sa mas mabilis na pagproseso at tamang pagsusuri ng inyong reklamo ng barangay.",
    "instruction_4_title": "BABALA: Ang Huwad o Malisyosong Reklamo ay Ipinagbabawal",
    "instruction_4_body": "Ang paghahain ng huwad, gawa-gawa, walang saysay, o malisyosong reklamo ay mahigpit na ipinagbabawal alinsunod sa mga naaangkop na Ordinansa ng Barangay at ang Kodigo ng Lokal na Pamahalaan ng Pilipinas. Ang sinumang mapatunayang nagsumite ng mapanlinlang o walang kabuluhang reklamo ay maaaring makaranas ng mga administratibong parusa, multa, o legal na aksyon ayon sa batas.",
    "instructions_disclaimer": "Ang lahat ng impormasyong isinumite sa pamamagitan ng form na ito ay mahigpit na kumpidensyal at gagamitin lamang para sa opisyal na layunin ng barangay alinsunod sa mga naaangkop na batas at regulasyon.",
    "error": {
      "title_required": "Kinakailangan ang kategorya ng reklamo.",
      "title_too_short": "Ang pamagat ng reklamo ay dapat may hindi bababa sa 3 na karakter.",
      "details_required": "Kinakailangan ang detalye ng reklamo."
    },
    "agreement": "Sa pagpapatuloy, kinukumpirma mo na nabasa mo at naintindihan mo ang mga gabay na nasa itaas.",
      "proceed_to_form": "Naiintindihan ko — Magpatuloy sa Form"
  },



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