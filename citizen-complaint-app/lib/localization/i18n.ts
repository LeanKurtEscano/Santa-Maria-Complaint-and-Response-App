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
      "noAccountEmail": "No user registered with this email address.",
"incorrectPassword": "Incorrect password. Please try again.",
"networkError": "Network error. Please check your connection.",
"loginFailed": "Login failed. Please try again.",

"otpEnterAllDigits": "Please enter all 6 digits.",
  "otpRegistrationDataNotFound": "Registration data not found. Please register again.",
  "otpExpired": "Your OTP has expired. Please request a new code.",
  "otpIncorrect": "Incorrect code. Please try again.",
  "otpIdImagesRequired": "All ID images are required (front, back, selfie with ID).",
  "otpInvalidDate": "Invalid date format. Please check your date of birth and register again.",
  "otpVerificationFailed": "Verification failed. Please try again.",
  "otpValidationError": "There is a validation error. Please check your information.",
  "otpServerError": "Something went wrong on our system. Please try again later.",
  "otpNetworkError": "Unable to connect. Please check your connection and try again.",
  "otpRequestTimeout": "The request timed out. Please try again.",
  "otpResendNetworkError": "Unable to connect. Please check your connection and try again.",
  "otpResendTimeout": "The request timed out. Please try again.",
  "otpResendFailed": "Failed to resend OTP. Please try again.",
"complaintServices": "Complaint Services",
"secureTransparentFast": "Secure · Transparent · Fast",
"badgeVerified": "Verified",
"badgeInstant": "Instant",
"fileComplaint": "File a Complaint",
"fileComplaintDesc": "Secure & confidential",
"trackMyCase": "Track My Case",
"trackMyCaseDesc": "Real-time updates",
"secureMessaging": "Secure Messaging",
"secureMessagingDesc": "Protected messages",
"verifiedReports": "Verified Reports",
"verifiedReportsDesc": "Tamper-proof records",
"supportCenter": "Support Center",
"supportCenterDesc": "24/7 assistance",
"resolutionStatus": "Resolution Status",
"notVerified": {
    "title": "Your registration is successful!",
    "message": "Your account has not been verified yet. Please check your email and follow the verification link we sent you.",
    "goBackButton": "Go Back to Login",
    "refreshHint": "Pull down to refresh"
  },

  "suspended": {
  "title": "Account Suspended",
  "description": "Your account has been suspended. Please contact our support team for assistance.",
  "contactSupport": "Contact Support",
  "goBackButton": "Go Back"
},

  "complaintStatus": {
    "status": {
      "submitted": "Submitted",
      "forwarded": "Forwarded",
      "resolved": "Resolved",
      "rejected": "Rejected",
      "pending": "Pending",
      "reviewed_by_barangay": "Reviewed by Barangay",
      "resolved_by_barangay": "Resolved by Barangay",
      "forwarded_to_lgu": "Forwarded to LGU",
      "reviewed_by_lgu": "Reviewed by LGU",
      "resolved_by_lgu": "Resolved by LGU",
      "rejected_by_lgu": "Rejected by LGU",
      "forwarded_to_department": "Forwarded to Dept.",
      "reviewed_by_department": "Under Dept. Review",
      "resolved_by_department": "Resolved by Dept.",
      "rejected_by_department": "Rejected by Dept."
    }
  },

 "back": "Back",
  "forgotPasswordTitle": "Forgot Password?",
  "forgotPasswordSubtitle": "Enter your email address and we'll send you a verification code to reset your password.",
  "emailAddress": "Email Address",
  "emailPlaceholder": "Enter your email address",
  "sendResetCode": "Send Reset Code",
  "rememberPassword": "Remember your password? ",
  "signIn": "Sign in",

  "forgotPasswordEmailRequired": "Please enter your email address.",
  "forgotPasswordEmailInvalid": "Please enter a valid email address.",
  "forgotPasswordNetworkError": "No internet connection. Please check your network and try again.",
  "forgotPasswordTimeout": "Request timed out. Please try again.",
  "forgotPasswordNotFound": "No account found with this email address.",
  "forgotPasswordValidationError": "Invalid email format.",
  "forgotPasswordServerError": "Something went wrong on our end. Please try again later.",
  "forgotPasswordFailed": "Failed to send reset code. Please try again.",


  "resetPasswordTitle": "Create New Password",
  "resetPasswordSubtitle": "Your new password must be different from your previous password.",

  "newPassword": "New Password",
  "newPasswordPlaceholder": "Enter new password",
  "confirmNewPassword": "Confirm New Password",
  "confirmPasswordPlaceholder": "Confirm new password",

  "resetPassword": "Reset Password",

  "passwordRequirements": "Password Requirements",
  "passwordRequirementsDetail": "Must be at least 8 characters long.",
    registerWithEmail: 'Register with Email',
    registerWithPhone: 'Register with Phone Number',
  "resetPasswordNewRequired": "Please enter a new password.",
  "resetPasswordConfirmRequired": "Please confirm your new password.",
  "resetPasswordTooShort": "Password must be at least 8 characters.",
  "resetPasswordMismatch": "Passwords do not match.",

  "resetPasswordNetworkError": "No internet connection. Please check your network and try again.",
  "resetPasswordTimeout": "Request timed out. Please try again.",
  "resetPasswordOtpPending": "OTP verification is still pending. Please verify your email first.",
  "resetPasswordUserNotFound": "No account found with this email address.",
  "resetPasswordServerError": "Something went wrong on our end. Please try again later.",
  "resetPasswordFailed": "Failed to reset password. Please try again.",

"resolutionStatusDesc": "Transparent process",
      "feedback": {
    "card_badge": "Share Feedback",
    "card_title": "Help us improve",
    "card_subtitle": "Your thoughts make Santa Maria's app better for everyone.",
    "card_cta": "Give Feedback",
    "screen_title": "App Feedback",
    "hero_title": "Help us improve",
    "hero_subtitle": "Your feedback helps us build a better experience for everyone in Santa Maria.",
    "rating_label": "How would you rate the app?",
    "rating_poor": "Poor",
    "rating_fair": "Fair",
    "rating_good": "Good",
    "rating_very_good": "Very Good",
    "rating_excellent": "Excellent",
    "message_label": "Additional comments",
    "message_optional": "(optional)",
    "message_placeholder": "Tell us what you think, what's missing, or how we can do better...",
    "submit_button": "Submit Feedback",
    "submitting": "Submitting...",
    "success_title": "Thank you!",
    "success_message": "Your feedback has been submitted. We appreciate you helping us improve the app.",
    "success_cta": "Go Back Home",
    "error_no_rating": "Please select a rating before submitting.",
    "error_too_many": "Too many submissions. Please wait a minute and try again.",
    "error_not_found": "User not found. Please log in and try again.",
    "error_server": "Something went wrong on our end. Please try again later.",
    "error_no_internet": "No internet connection. Please check your network and try again.",
    "error_generic": "An unexpected error occurred. Please try again."
  },

  "ordinance": {
  "badge": "Official Records",
  "title": "Stay updated on Santa Maria's local ordinances",
  "subtitle": "Access official municipal laws and regulations of Santa Maria, Laguna — anytime, anywhere.",
  "cta": "View Ordinances"
},

"termsModal": {
  "badge": "LGU",
  "municipality": "Municipality of Santa Maria",
  "province": "Laguna, Philippines",
  "title": "Terms and Agreement",
  "subtitle": "Effective date: January 1, 2025 · Version 1.0",
  "intro": "Please read these terms carefully before using the {{appName}}. By registering, you agree to be legally bound by the following provisions.",
  "appName": "Santa Maria Laguna Complaint Management System",

  "sections": {
    "s1Title": "1. Purpose of the system",
    "s1Body": "This platform is operated by the {{lgu}} to facilitate the filing, tracking, and resolution of complaints from residents and stakeholders. It is intended solely for legitimate civic concerns within the jurisdiction of Santa Maria.",

    "s2Title": "2. Eligibility",
    "s2Body": "Use of this system is open to residents, business owners, and stakeholders within Santa Maria, Laguna. You must be at least 18 years of age and provide truthful, accurate information during registration. The LGU reserves the right to verify your identity.",

    "s3Title": "3. Accuracy of information",
    "s3Body": "You agree to submit complaints that are truthful and based on factual events. Filing false, malicious, or frivolous complaints is prohibited and may be subject to applicable laws of the Philippines, including the {{law}} provisions on perjury and grave oral defamation.",
    "s3Law": "Revised Penal Code",

    "s4Title": "4. Data privacy",
    "s4Body": "Your personal data is collected and processed in accordance with the {{law}}. The Municipality of Santa Maria, Laguna is the data controller and commits to:",
    "s4Law": "Republic Act No. 10173 (Data Privacy Act of 2012)",
    "s4Bullet1": "Collecting only data necessary for complaint processing",
    "s4Bullet2": "Not sharing your personal information with unauthorized third parties",
    "s4Bullet3": "Storing data securely and retaining it only as long as required by law",
    "s4Bullet4": "Allowing you to request access, correction, or deletion of your records",

    "s5Title": "5. Complaint handling",
    "s5Body": "Complaints submitted through this system will be reviewed by authorized LGU personnel. The LGU does not guarantee a specific resolution timeline but will endeavor to act on complaints in accordance with the {{charter}} and {{law}}. Anonymous complaints may be given lower processing priority.",
    "s5Charter": "Citizen's Charter",
    "s5Law": "Anti-Red Tape Act (RA 11032)",

    "s6Title": "6. Prohibited conduct",
    "s6Body": "Users are strictly prohibited from:",
    "s6Bullet1": "Submitting fabricated or misleading complaints",
    "s6Bullet2": "Impersonating another person or public official",
    "s6Bullet3": "Using the system for political harassment or personal vendetta",
    "s6Bullet4": "Attempting to access, alter, or disrupt the system",
    "s6Bullet5": "Uploading obscene, defamatory, or illegal content",

    "s7Title": "7. Account suspension",
    "s7Body": "The LGU reserves the right to suspend or permanently revoke access to any account found in violation of these terms, without prior notice, and to refer the matter to the appropriate authorities where warranted.",

    "s8Title": "8. Limitation of liability",
    "s8Body": "The Municipality of Santa Maria, Laguna shall not be held liable for any indirect or consequential damages arising from your use of this system, including but not limited to delays in complaint processing caused by force majeure, system downtime, or circumstances beyond the LGU's reasonable control.",

    "s9Title": "9. Amendments",
    "s9Body": "These terms may be updated from time to time by the LGU. Continued use of the system after any amendment constitutes acceptance of the revised terms. Significant changes will be communicated through the system's notification feature.",

    "s10Title": "10. Governing law",
    "s10Body": "These terms are governed by the laws of the {{country}}. Any dispute arising from the use of this system shall be subject to the jurisdiction of the proper courts in the Province of Laguna.",
    "s10Country": "Republic of the Philippines"
  },

  "footer": {
    "notRead": "Scroll to read all terms before accepting",
    "hasRead": "You have read all the terms",
    "decline": "Decline",
    "accept": "I agree to the terms"
  }
},

 "errors": {
    "retryLabel": "Try Again",
    "retryingLabel": "Retrying...",
    "network": {
      "title": "No Internet Connection",
      "message": "Please check your internet connection and try again."
    },
    "server": {
      "title": "Something Went Wrong",
      "message": "We encountered an issue on our end. Please try again later."
    },
    "notFound": {
      "title": "Not Found",
      "message": "The content you are looking for could not be found."
    },
    "unauthorized": {
      "title": "Unauthorized",
      "message": "You need to sign in to access this content."
    },
    "forbidden": {
      "title": "Access Denied",
      "message": "You do not have permission to access this content."
    },
    "timeout": {
      "title": "Request Timeout",
      "message": "The request took too long to complete. Please try again."
    },
    "generic": {
      "title": "Error",
      "message": "An unexpected error occurred. Please try again."
    }
  },

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
        update: "Update",
        back: "Back"
      },

      // Profile
      profile: {
        title: "My Profile",
        loadingProfile: "Loading profile...",
        failedToLoad: "Failed to Load Profile",
        unableToRetrieve: "Unable to retrieve your profile information.",
        location: {
          myLocation: "Your Location",
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
          phoneNumber: "Phone Number",
          gender: "GENDER",
          barangay: "BARANGAY",
          fullAddress: "FULL ADDRESS",
          yearsOld: "years old",
          male: "Male",
          female: "Female",
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
          "landslide": "Landslide / Erosion",
          "other": "Other (specify below)"
        }
      },
       "complaints": {
    "header": {
      "location": "Santa Maria, Laguna",
      "title": "My Complaints",
      "back": "Back"
    },

    "titles": {
   "noise_disturbance": "Noise Disturbance",
  "illegal_dumping": "Illegal Dumping",
  "road_damage": "Road Damage",
  "street_light_outage": "Street Light Outage",
  "flooding_drainage": "Flooding",
  "illegal_construction": "Illegal Construction",
  "stray_animals": "Stray Animals",
  "public_intoxication": "Public Intoxication",
  "illegal_vending": "Illegal Vending",
  "water_supply_issue": "Water Supply Issue",
  "garbage_collection": "Garbage Collection",
  "vandalism": "Vandalism"
},

"pagination": {
  "showing": "Showing {{start}}–{{end}} of {{total}} complaints"
},
    "search": {
      "placeholder": "Search Complaints..."
    },
    "filter": {
      "label": "Filter",
      "labelWithCount": "Filter ({{count}})",
      "title": "Filter by Status",
      "clearAll": "Clear All",
      "apply": "Apply Filters"
    },
    "count": "{{filtered}} of {{total}} complaint",
    "count_plural": "{{filtered}} of {{total}} complaints",
    "card": {
      "id": "#{{id}}"
    },
    "empty": {
      "noResults": {
        "title": "No results found",
        "description": "Try changing your filters or search terms."
      },
      "noComplaints": {
        "title": "No complaints yet",
        "description": "You haven’t submitted any complaints yet."
      }
    },
    "loading": "Fetching your complaints...",
    "error": {
      "title": "Unable to Retrieve Complaints",
      "message": "Failed to fetch complaints"
    }
  },
  
  "chatbot": {
    "ask": "Ask a question?",
     "info": "Ask me about Santa Maria, Laguna — complaints, services, documents, and more.",
     "greeting": "Hello! I'm MaryBot 👋\n\nYour FAQ assistant for the Municipality of Santa Maria, Laguna.\n\nHow can I help you?",
     "typing": "MaryBot is typing...",
      "askInput": "Type your question here...",
      "frequentQuestions": "Frequently Asked Questions",
      "suggestions": {
      "howToFileComplaint": "📋 How to file a complaint?",
      "complaintStatus": "🔍 Complaint status",
      "barangayClearance": "📄 Barangay clearance",
      "municipalServices": "🏛️ Municipal services",
      "officeHours": "⏰ Office hours",
      "contactNumbers": "📞 Contact numbers",
    
     
    },
     "placeholder": {
      "offline": "No internet connection...",
      "slow": "Slow connection...",
      "busy": "Waiting for response...",
      "default": "Ask about Santa Maria..."
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
      }, 
      
      
      "complaint_form": {
        "screen_title": "File a Complaint",
        "title_label": "Complaint Category",
        "title_description": "Select the category that best describes your complaint. If your concern doesn't fit any category, choose 'Other' and specify in the details.",
        "title_placeholder": "Select a complaint category",
        "custom_title_placeholder": "Enter your complaint title",
        "custom_title_hint": "Briefly describe your complaint in a few words",
         "profile_location_title": "Profile Location Required",
          "details_validation_repeated_chars": "Please avoid repeating the same character or symbol multiple times.",
    "details_validation_repeated_words": "Your description repeats the same word too often. Try describing the issue differently.",
    "details_validation_no_meaningful_content": "Please describe the issue using actual words, not just numbers or symbols.",
    "profile_location_desc": "You haven't set your location yet. Tap here to update your profile before submitting.",
  "custom_title_validation_spaces": "Title cannot be blank or spaces only.",
  "custom_title_validation_repeated_chars": "Title contains too many repeated characters.",
  "custom_title_validation_repeated_words": "Title contains too many repeated words.",
    "details_description": "Describe your complaint clearly. Include when it happened, who is affected, and any relevant details that will help the barangay address it promptly.",

    "next_step_hint": "Next: Pin where the incident happened on the map.",
      "next_step":"Next: Pin Location",

    "attachment_photo_tag": "JPG, PNG",
    "attachment_video_tag": "MP4, MOV",
    "attachment_any_tag": "ANY",
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


      "location_step": {
    "title": "Where did this happen?",
   

    "instruction": "Tap the map to place a pin, or use your current location",

    "loading_map": "Loading map…",
    "map_error_title": "Map failed to load",
    "map_error_desc": "Check your connection and try again.",
    "reload_map": "Reload Map",

    "gps_error_permission": "Location permission denied. Please enable it in your device Settings.",
    "gps_error_unavailable": "Your position could not be determined. Make sure GPS is enabled.",
    "gps_error_timeout": "Location request timed out. Move to an open area and try again.",
    "gps_error_unknown": "Could not get your location. Please try again.",

    "gps_button": "My Location",
    "gps_getting": "Getting…",
    "gps_wait": "Wait {{seconds}}s",
    "gps_cooldown": "You can use \"My Location\" again in {{seconds}}s",

    "barangay_pin": "Barangay Pin",
    "or_hint": "or tap / drag pin on map",

    "confirm_location": "Confirm Location",

    "next_title": "Next: Pin Location"
  },

    "complaintPreview": {
    "back": "Back",
    "title": "Complaint Preview",
    "refNo": "Ref. No.",
    "submit": "Submit Complaint",
    "submitting": "Submitting...",
    "edit": "← Go back and edit",

    "sections": {
      "complainantInfo": "Complainant Information",
      "complaintDetails": "Complaint Details",
      "attachments": "Attachments",
      "subject": "Subject",
      "description": "Description",
      "fullName": "Full Name",
      "address": "Address",
      "filedTo": "Filed To",
      "dateFiled": "Date Filed"
    },

    "attachments": {
      "count": "Attachments ({{count}})"
    },

    "status": {
      "read": "READ",
      "hasRead": "You have read the terms.",
      "notRead": "Please scroll to read all terms.",
      "accept": "I have read and agree to the Terms and Agreement."
    }
  },


 "postIncidentFeedback": {
"title": "Rate Your Experience",
"heading": "How was your experience?",
"subheading": "Your feedback helps us improve barangay services and respond better to residents.",
"ratingPrompt": "Please rate your overall experience",
"commentLabel": "Additional comments (optional)",
"commentPlaceholder": "Share more details about your experience...",
"submit": "Submit Feedback",

"ratingLabels": {
  "terrible": "Terrible",
  "bad": "Bad",
  "okay": "Okay",
  "good": "Good",
  "excellent": "Excellent"
},

"success": {
  "headerTitle": "Feedback Submitted",
  "title": "Thank You!",
  "message": "Your feedback has been successfully submitted. We appreciate your time and effort in helping improve our services.",
  "viewComplaints": "View My Complaints",
  "goBack": "Go Back"
},

"errorTitle": "Submission Failed",
"errorMessage": "Something went wrong while submitting your feedback. Please try again."

},
      complaintDetail: {
        "feedbackButton": "Submit Feedback",
    loading: "Loading complaint details…",
 
    error: {
      title: "Something went wrong",
      message: "Failed to load complaint details.",
    },
 
    header: {
      complaintId: "Complaint #{{id}}",
    },
 
    // ── Status chip labels ──────────────────────────────────────────────────
    status: {
      submitted: "Submitted",
      underReview: "Under Review",
      resolved: "Resolved",
      forwardedLgu: "Forwarded to LGU",
      forwardedDept: "Forwarded to Dept.",
      deptReview: "Dept. Review",
         "underReviewLgu": "Under Review ng LGU",
      "rejectedBarangay": "Rejected by Barangay",
      rejectedLgu: "Rejected by LGU",
      rejectedDept: "Rejected by Dept.",
      "resolvedBarangay": "Resolved by Barangay",
"resolvedLgu":      "Resolved by LGU",
"resolvedDept":     "Resolved by Department"
    },
 
    // ── Progress tracker steps ──────────────────────────────────────────────
    tracker: {
      title: "Complaint Progress",
 
      submitted: "Submitted",
      submittedSub: "Complaint received",
 
      barangay: "Barangay Review",
      barangaySub: "Under barangay assessment",
      "rejectedBarangay": "Rejected by Barangay",
 
      lgu: "LGU Review",
      
      lguSub: "Escalated to local government",
         "lguReviewSub": "Being reviewed by the Local Government Unit",
      department: "Department Review",
      departmentSub: "Referred to concerned department",
   
      resolved: "Resolved",
      resolvedSub: "Complaint has been addressed",
       resolvedByBarangay: "Resolved at barangay level",  // ← add
  resolvedByLgu: "Resolved at LGU level",            // ← add
  resolvedByDept: "Resolved at department level",  
 
      rejectedLgu: "Rejected by LGU",
      rejectedDept: "Rejected by Department",
      rejectedSub: "Complaint was not accepted",
    },
 
    // ── Rejection banner ────────────────────────────────────────────────────
    rejection: {
      title: "Complaint Rejected",
      byLgu: "This complaint was not accepted by the Local Government Unit.",
      byDept: "This complaint was not accepted by the Department.",
      "byBarangay": "Your complaint was reviewed and rejected by the barangay."
    },
 
    // ── Section headings ────────────────────────────────────────────────────
    sections: {
      complaintInfo: "Complaint Info",
      barangay: "Handling Barangay",
      department: "Handling Department",
      remarks: "Remarks",
    },
 
    // ── Field labels ────────────────────────────────────────────────────────
    fields: {
      category: "Category",
      description: "Description",
      location: "Location",
      dateSubmitted: "Date Submitted",
      barangayName: "Barangay",
      address: "Address",
      contactNumber: "Contact Number",
      email: "Email",
      departmentName: "Department",
    },
 
    // ── Remarks / responses ─────────────────────────────────────────────────
    remarks: {
      title: "Remarks",
      newest: "Newest",
      oldest: "Oldest",
      remarkLabel: "Remark #{{number}}",
      viewAll: "View All {{count}} Remarks",
      showLess: "Show Less",
    },
  }

      ,
      "header": {
        "municipality": "Municipality of",
        "city": "Santa Maria",
        "location": "Laguna, Philippines"
      },
      "stats": {
        "heading": "Your Complaints",
        "submitted": "Submitted",
        "inProgress": "In Progress",
        "resolved": "Resolved"
      },
      "quick": {
        "heading": "Quick Access",
        "services": "My\nServices",
        "complaints": "My\nComplaints",
        "events": "My\nEvents",
        "hotlines": "Hotlines"
      },
      "announcements": {
        "heading": "Announcements",
        "all": "View All",
        "back": "Back",
        "title": "Announcements",
    "count": "announcements found",
    "search_placeholder": "Search announcements...",
    "loading": "Loading announcements...",
    "error_title": "Something went wrong",
    "error_subtitle": "We couldn't load announcements. Please try again.",
    "retry": "Try Again",
    "empty_title": "No announcements found",
    "empty_subtitle": "Try adjusting your search.",
    "badge": "New",
    "unknown": "Unknown",
    "prev": "Prev",
    "next": "Next",
    "video": "video",
    "videos": "videos",
        "tag": "Announcement",
        "posted_by": "Posted by",
        "read_more": "Read",
        "see_more": "See More",
        "remaining": "more",
        "end_of_list": "— End of list —",
      
        "empty_body": "There are no announcements at this time.",
     
        "error_body": "Could not load announcements.",
      
      },
      "media": {
        "tap_to_watch": "Tap to watch",
        "close": "Close",
        "zoom_hint": "Double-tap to zoom · Pinch to scale",
        "posted_by": "Posted by"
      },
      "time": {
        "just_now": "just now",
        "minutes_ago": "m ago",
        "hours_ago": "h ago",
        "days_ago": "d ago"
      },
      "cta": {
        "submit_complaint": "Submit a Complaint"
      },

      "greeting": {
        "morning": "Good Morning",
        "afternoon": "Good Afternoon",
        "evening": "Good Evening"
      },

      "home": {
        "resident": "Resident",
        "stay_updated": "Stay updated with your community today.",
        "weather_fair": "Fair",

        "errors" : {
          "screenTitle": "Unable to Load Home Screen",
        }
      },


        "emergency": {
    "title": "Emergency",
    "bannerText": "Only call in a real emergency. Misuse of emergency lines is a punishable offense.",
    "callButton": "Call",
    "disclaimer": "For non-emergency concerns, please visit your nearest barangay hall.",
    "sections": {
      "hotlines": "Emergency Hotlines",
      "evacuationCenters": "Evacuation Centers"
    },
    "services": {
      "pnp": "Philippine National Police",
      "bfp": "Bureau of Fire Protection"
    },
    "modal": {
      "title": "Confirm Call",
      "body": "Do you want to call {{service}}?",
      "cancel": "Cancel",
      "confirm": "Call Now"
    },
    "dialerUnavailableTitle": "Cannot Place Call",
    "dialerUnavailableMessage": "Your device does not support phone calls.",
    "evacuation": {
      "notice": "These centers are designated evacuation areas during emergencies. Proceed to the nearest one if instructed by local authorities.",
      "fetchingAddress": "Fetching address…",
      "addressUnavailable": "Address unavailable",
      "mapUnavailable": "Map unavailable",
      "viewRoute": "View Route",
      "getRoute": "Get Route",
      "calculatingRoute": "Calculating route…",
      "away": "away",
      "routeModal": {
        "subtitle": "Best route via OSRM · OpenStreetMap",
        "legendUser": "Your location",
        "legendDest": "Evacuation center",
        "legendRoute": "Route",
        "loadingMap": "Loading map…"
      }
    }
  }, 


  "registerValidation": {
  "firstNameRequired": "First name is required.",
  "firstNameMinLength": "First name must be at least 2 characters long.",
  "firstNameMaxLength": "First name must be at most {{max}} characters long.",
  "firstNameInvalidChars": "First name must not contain numbers or special characters.",
  "firstNameLettersOnly": "First name must only contain letters.",
  "firstNameRepeatedChars": "First name must not contain repeated characters.",
  "firstNameRepeatedWords": "First name must not contain repeated words.",
  "firstNameSingleLetters": "First name must not consist of single letters.",
    "idNumberInvalidChars": "ID number can only contain letters, numbers, hyphens, and spaces",
  "idNumberMustHaveDigit": "ID number must contain at least one number",
  "idNumberTooManyLetters": "Invalid ID number format",
  "idNumberTooShort": "ID number is too short",
  "idNumberTooLong": "ID number is too long",
  "idNumberRepeatedChars": "ID number cannot be all the same characters",
  "idNumberPatternRepeat": "ID number cannot be a repeating pattern",

  "middleNameMinLength": "Middle name must be at least 2 characters long.",
  "middleNameMaxLength": "Middle name must be at most {{max}} characters long.",
  "middleNameInvalidChars": "Middle name must not contain numbers or special characters.",
  "middleNameLettersOnly": "Middle name must only contain letters.",
  "middleNameRepeatedChars": "Middle name must not contain repeated characters.",
  "middleNameRepeatedWords": "Middle name must not contain repeated words.",
  "middleNameSingleLetters": "Middle name must not consist of single letters.",

  "lastNameRequired": "Last name is required.",
  "lastNameMinLength": "Last name must be at least 2 characters long.",
  "lastNameMaxLength": "Last name must be at most {{max}} characters long.",
  "lastNameInvalidChars": "Last name must not contain numbers or special characters.",
  "lastNameLettersOnly": "Last name must only contain letters.",
  "lastNameRepeatedChars": "Last name must not contain repeated characters.",
  "lastNameRepeatedWords": "Last name must not contain repeated words.",
  "lastNameSingleLetters": "Last name must not consist of single letters.",

  "contactNumberRequired": "Contact number is required.",
  "contactNumberInvalidChars": "Contact number must not contain letters or special characters.",
  "contactNumberInvalidLength": "Contact number must be a valid Philippine mobile number.",
  "contactNumberRepeatingDigits": "Contact number must not contain 4 or more repeating digits.",

  "emailRequired": "Email is required.",
  "emailLocalPartTooLong": "The part before '@' cannot exceed 64 characters.",
  "emailInvalidFormat": "Invalid email format. Please enter a valid email address.",
  "emailInvalidDomain": "{{domain}} is not a recognized email provider.",

  "passwordRequired": "Password is required.",
  "passwordNoSpaces": "Password must not contain spaces.",
  "passwordMinLength": "Password must be at least 8 characters long.",
  "passwordWeak": "Weak",
  "passwordMedium": "Medium",
  "passwordStrong": "Strong",
  "passwordHint": "No spaces allowed. Must be at least 8 characters.",
  "passwordMaxLength": "Password must not exceed 128 characters."
},


"notifications": {
  "emptyTitle": "All caught up!",
  "emptySubtitle": "No notifications yet. We'll let you know when something happens.",
  "type": {
    "rejected": "Rejected",
    "rejected_by_lgu": "Rejected",
    "rejected_by_department": "Rejected",
    "rejected_by_barangay": "Rejected",
    "update": "Update",
    "success": "Success",
    "complaint_resolved": "Resolved",
    "complaint_under_review": "Under Review",
    "complaint_update": "Forwarded",
    "info": "Existing Incident"
  },
  "title": {
    "rejected": "Complaint Rejected",
    "rejected_by_lgu": "Complaint Rejected",
    "rejected_by_department": "Complaint Rejected",
    "rejected_by_barangay": "Complaint Rejected",
    "update": "Complaint Update",
    "success": "Success",
    "complaint_resolved": "Complaint Resolved",
    "complaint_under_review": "Complaint Under Review",
    "complaint_update": "Complaint Forwarded to Department",
    "info": "Already Part of an Incident"
  },
  "message": {
    "update": "Your complaint has been updated.",
    "success": "Your complaint '{{title}}' has been successfully resolved.",
    "complaint_resolved": "Your complaint '{{title}}' has been resolved.",
    "complaint_under_review": "Your complaint '{{title}}' is now under review.",
    "complaint_update": "Your complaint has been forwarded to the department for further processing.",
    "rejected": "Your complaint regarding '{{title}}' has been rejected.",
    "rejected_by_lgu": "Your complaint regarding '{{title}}' has been rejected by the LGU due to insufficient information or other reasons. Please review the details and consider resubmitting a new complaint.",
    "rejected_by_department": "Your complaint regarding '{{title}}' has been rejected by the Department due to insufficient information or other reasons. Please review the details and consider resubmitting a new complaint.",
    "rejected_by_barangay": "Your complaint regarding '{{title}}' has been rejected by the Barangay due to insufficient information or other reasons. Please review the details and consider resubmitting a new complaint.",
    "info": "Your complaint is already part of an existing incident. Similar complaints have already been submitted for this incident."
  }
}, "events": {
    "upcomingEvents": "Upcoming Events",
    "seeAll": "See All",
    "loading": "Loading events…",
    "retry": "Retry",
    "failedToLoad": "Failed to load events",
    "community": "COMMUNITY",
    "details": "Details",
    "noEvents": "No upcoming events right now.\nCheck back soon!"
  }

  ,
   "viewAllEvents": {
    "title": "Events",
    "subtitle": "Community calendar",
    "searchPlaceholder": "Search events or locations…",
    "loading": "Loading events…",
    "noEventsYet": "No events yet",
    "noEventsMessage": "Check back soon for upcoming community events.",
    "noResults": "No results found",
    "noResultsMessage": "No events matched \"{{query}}\".",
    "clearSearch": "Clear Search",
    "event": "event",
    "eventsCount": "events",
    "forQuery": "for \"{{query}}\""
  },

   "eventDetails": {
    "title": "Event Details",
    "loading": "Loading event…",
    "goBack": "Go Back",

    "info": {
      "title": "Event Information",
      "date": "Date",
      "time": "Time",
      "location": "Location"
    },

    "about": "About this Event",

    "media": {
      "noPhotos": "No photos for this event",
      "attached": "{{count}} photo attached",
      "attached_plural": "{{count}} photos attached"
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

      "noAccountEmail": "Hindi pa nakaregister ang email na ito.",
"incorrectPassword": "Mali ang password. Pakisubukan muli.",
"networkError": "Hindi makakonekta. Pakisuriin ang iyong koneksyon.",
"loginFailed": "Nabigong mag-login. Pakisubukan muli.",


"otpEnterAllDigits": "Mangyaring ilagay ang lahat ng 6 na digit.",
"otpRegistrationDataNotFound": "Hindi nahanap ang datos ng pagpaparehistro. Mangyaring mag-rehistro muli.",
"otpExpired": "Nag-expire na ang iyong OTP. Mangyaring humingi ng bagong code.",
"otpIncorrect": "Mali ang code. Pakisubukan muli.",
"otpIdImagesRequired": "Kailangan ang lahat ng larawan ng ID (harap, likod, selfie na may ID).",
"otpInvalidDate": "Hindi wastong format ng petsa. Pakisuriin ang iyong petsa ng kapanganakan at mag-rehistro muli.",
"otpVerificationFailed": "Nabigong i-verify. Pakisubukan muli.",
"otpValidationError": "May error sa validation. Pakisuriin ang iyong impormasyon.",
"otpServerError": "May nangyaring mali sa aming sistema. Pakisubukan muli mamaya.",
"otpNetworkError": "Hindi makakonekta. Pakisuriin ang iyong koneksyon at subukan muli.",
"otpRequestTimeout": "Nag-timeout ang kahilingan. Pakisubukan muli.",
"otpResendNetworkError": "Hindi makakonekta. Pakisuriin ang iyong koneksyon at subukan muli.",
"otpResendTimeout": "Nag-timeout ang kahilingan. Pakisubukan muli.",
"otpResendFailed": "Nabigong muling magpadala ng OTP. Pakisubukan muli.",
"complaintServices": "Mga Serbisyo ng Reklamo",
"secureTransparentFast": "Ligtas · Transparent · Mabilis",
"badgeVerified": "Napatunayan",
"badgeInstant": "Agarang",

"fileComplaint": "Mag-file ng Reklamo",
"fileComplaintDesc": "Ligtas at kumpidensyal",
"trackMyCase": "Subaybayan ang Kaso",
"trackMyCaseDesc": "Mga update sa real-time",
"secureMessaging": "Ligtas na Mensahe",
"secureMessagingDesc": "Protektadong mensahe",
"verifiedReports": "Napatunayang Ulat",
"verifiedReportsDesc": "Mga rekord na hindi mababago",
"supportCenter": "Support Center",
"supportCenterDesc": "Tulong 24/7",
"resolutionStatus": "Katayuan ng Resolusyon",
"resolutionStatusDesc": "Transparent na proseso",


 "back": "Bumalik",
  "forgotPasswordTitle": "Nakalimutan ang Password?",
  "forgotPasswordSubtitle": "Ilagay ang iyong email at magpapadala kami ng code para ma-reset ang password mo.",
  "emailAddress": "Email Address",
  "emailPlaceholder": "Ilagay ang iyong email",
  "sendResetCode": "Magpadala ng Code",
  "rememberPassword": "Naalala mo na ang password mo? ",
  "signIn": "Mag Sign in",

  "forgotPasswordEmailRequired": "Pakilagay ang iyong email.",
  "forgotPasswordEmailInvalid": "Pakilagay ang tamang email.",
  "forgotPasswordNetworkError": "Walang internet. Paki-check ang connection at subukan ulit.",
  "forgotPasswordTimeout": "Nag-timeout ang request. Subukan ulit.",
  "forgotPasswordNotFound": "Walang account na naka-link sa email na ito.",
  "forgotPasswordValidationError": "Hindi valid ang email format.",
  "forgotPasswordServerError": "May problema sa server. Subukan ulit mamaya.",
  "forgotPasswordFailed": "Hindi naipadala ang code. Subukan ulit.",


  "resetPasswordTitle": "Gumawa ng Bagong Password",
  "resetPasswordSubtitle": "Dapat iba ang bagong password mo sa dati mong password.",

  "newPassword": "Bagong Password",
  "newPasswordPlaceholder": "Ilagay ang bagong password",
  "confirmNewPassword": "Kumpirmahin ang Password",
  "confirmPasswordPlaceholder": "Ulitin ang bagong password",

  "resetPassword": "I-reset ang Password",

  "passwordRequirements": "Mga Kailangan sa Password",
  "passwordRequirementsDetail": "Dapat hindi bababa sa 8 characters.",

  "resetPasswordNewRequired": "Pakilagay ang bagong password.",
  "resetPasswordConfirmRequired": "Pakikumpirma ang bagong password.",
  "resetPasswordTooShort": "Dapat hindi bababa sa 8 characters ang password.",
  "resetPasswordMismatch": "Hindi magkapareho ang password.",

  "resetPasswordNetworkError": "Walang internet. Paki-check ang connection at subukan ulit.",
  "resetPasswordTimeout": "Nag-timeout ang request. Subukan ulit.",
  "resetPasswordOtpPending": "Hindi pa tapos ang OTP verification. Paki-verify muna ang email mo.",
  "resetPasswordUserNotFound": "Walang account na naka-link sa email na ito.",
  "resetPasswordServerError": "May problema sa server. Subukan ulit mamaya.",
  "resetPasswordFailed": "Hindi na-reset ang password. Subukan ulit.",
  

   "notVerified": {
    "title": "Ang iyong account registration ay successful!",
    "message": "Hindi pa na-verify ang iyong account. Pakisuri ang iyong email at sundan ang verification link na ipinadala namin sa iyo.",
    "goBackButton": "Bumalik sa Pag-login",
    "refreshHint": "I-drag pababa para i-refresh"
  },

  "suspended": {
  "title": "Nasuspinde ang Account",
  "description": "Ang iyong account ay nasuspinde. Mangyaring makipag-ugnayan sa aming support team para sa tulong.",
  "contactSupport": "Makipag-ugnayan sa Support",
  "goBackButton": "Bumalik"
},
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
      registerWithEmail: 'Magrehistro gamit ang Email',
      registerWithPhone: 'Magrehistro gamit ang Phone Number',
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

      "termsModal": {
  "badge": "LGU",
  "municipality": "Munisipalidad ng Santa Maria",
  "province": "Laguna, Pilipinas",
  "title": "Mga Tuntunin at Kasunduan",
  "subtitle": "Petsa ng bisa: Enero 1, 2025 · Bersyon 1.0",
  "intro": "Pakibasa nang mabuti ang mga tuntuning ito bago gamitin ang {{appName}}. Sa pag-rehistro, sumasang-ayon ka na legal na nakatali sa mga sumusunod na probisyon.",
  "appName": "Santa Maria Laguna Complaint Management System",

  "sections": {
    "s1Title": "1. Layunin ng sistema",
    "s1Body": "Ang platform na ito ay pinapatakbo ng {{lgu}} upang tulungan ang pag-file, pagsubaybay, at resolusyon ng mga reklamo mula sa mga residente at stakeholder. Ito ay para lamang sa mga lehitimong alalahanin ng mga mamamayan sa loob ng hurisdiksyon ng Santa Maria.",

    "s2Title": "2. Kwalipikasyon",
    "s2Body": "Ang paggamit ng sistema ay bukas sa mga residente, may-ari ng negosyo, at stakeholder sa loob ng Santa Maria, Laguna. Dapat kang hindi bababa sa 18 taong gulang at magbigay ng totoong impormasyon sa panahon ng pagpaparehistro. Ang LGU ay may karapatang i-verify ang iyong pagkakakilanlan.",

    "s3Title": "3. Katumpakan ng impormasyon",
    "s3Body": "Sumasang-ayon ka na magsumite ng mga reklamo na totoo at batay sa mga tunay na pangyayari. Ang pag-file ng mga pekeng, mapanlinlang, o walang basehang reklamo ay ipinagbabawal at maaaring mapailalim sa mga batas ng Pilipinas, kasama na ang {{law}} sa usapin ng perjury at malubhang paninirang-puri.",
    "s3Law": "Revised Penal Code",

    "s4Title": "4. Proteksyon ng datos",
    "s4Body": "Ang iyong personal na datos ay kinokolekta at pinoproseso alinsunod sa {{law}}. Ang Munisipalidad ng Santa Maria, Laguna ang data controller at nangangako na:",
    "s4Law": "Republic Act No. 10173 (Data Privacy Act of 2012)",
    "s4Bullet1": "Mangolekta lamang ng datos na kailangan para sa pagpoproseso ng reklamo",
    "s4Bullet2": "Hindi ibabahagi ang iyong personal na impormasyon sa mga hindi awtorisadong third party",
    "s4Bullet3": "Ligtas na itatago ang datos at iingatan lamang ito hangga't kinakailangan ng batas",
    "s4Bullet4": "Papayagan kang humiling ng access, pagwawasto, o pagbubura ng iyong mga rekord",

    "s5Title": "5. Paghawak ng reklamo",
    "s5Body": "Ang mga reklamo na isinumite sa sistema ay susuriin ng mga awtorisadong tauhan ng LGU. Hindi ginagarantiyahan ng LGU ang isang partikular na takdang panahon ng resolusyon ngunit magsisikap na kumilos sa mga reklamo alinsunod sa {{charter}} at {{law}}. Ang mga anonymous na reklamo ay maaaring bigyang mas mababang priyoridad.",
    "s5Charter": "Citizen's Charter",
    "s5Law": "Anti-Red Tape Act (RA 11032)",

    "s6Title": "6. Mga ipinagbabawal na gawi",
    "s6Body": "Mahigpit na ipinagbabawal sa mga gumagamit ang:",
    "s6Bullet1": "Magsumite ng mga pekeng o mapanlinlang na reklamo",
    "s6Bullet2": "Magpanggap bilang ibang tao o opisyal ng gobyerno",
    "s6Bullet3": "Gamitin ang sistema para sa political harassment o personal na pakikipagtalo",
    "s6Bullet4": "Subukang i-access, baguhin, o sirain ang sistema",
    "s6Bullet5": "Mag-upload ng obscene, mapanirang-puri, o ilegal na nilalaman",

    "s7Title": "7. Pagsuspinde ng account",
    "s7Body": "Ang LGU ay may karapatang suspindihin o permanenteng bawiin ang access ng anumang account na natuklasang lumalabag sa mga tuntuning ito, nang walang paunang abiso, at i-refer ang usapin sa mga naaangkop na awtoridad kung kinakailangan.",

    "s8Title": "8. Limitasyon ng pananagutan",
    "s8Body": "Ang Munisipalidad ng Santa Maria, Laguna ay hindi mananagot sa anumang hindi direkta o kaugnay na pinsala mula sa iyong paggamit ng sistema, kasama na ang mga pagkaantala sa pagpoproseso ng reklamo dahil sa force majeure, pagkatigil ng sistema, o mga pangyayaring wala sa kontrol ng LGU.",

    "s9Title": "9. Mga pagbabago",
    "s9Body": "Ang mga tuntuning ito ay maaaring ma-update paminsan-minsan ng LGU. Ang patuloy na paggamit ng sistema pagkatapos ng anumang pagbabago ay nangangahulugang tinanggap mo ang binagong mga tuntunin. Ang malalaking pagbabago ay ipaaalam sa pamamagitan ng notification feature ng sistema.",

    "s10Title": "10. Namamahalang batas",
    "s10Body": "Ang mga tuntuning ito ay pinamamahalaan ng mga batas ng {{country}}. Anumang hindi pagkakaunawaan na nagmumula sa paggamit ng sistema ay mapapailalim sa hurisdiksyon ng mga tamang korte sa Lalawigan ng Laguna.",
    "s10Country": "Republika ng Pilipinas"
  },

  "footer": {
    "notRead": "Mag-scroll para mabasa ang lahat ng tuntunin bago tanggapin",
    "hasRead": "Nabasa mo na ang lahat ng tuntunin",
    "decline": "Tanggihan",
    "accept": "Sumasang-ayon ako sa mga tuntunin"
  }
},

      // Common
      common: {
        ok: "Sige",
        cancel: "Kanselahin",
        error: "May Mali",
        loading: "Naglo-load...",
        save: "I-save",
        update: "I-update",
        back: "Bumalik"
      },

      // Profile
      profile: {
        title: "Aking Profile",
        loadingProfile: "Naglo-load ng profile...",
        failedToLoad: "Hindi Na-load ang Profile",
        unableToRetrieve: "Hindi makuha ang iyong impormasyon sa profile.",
        location: {
          myLocation: "Ang iyong Lokasyon",
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
          male: "lalaki",
          female: "babae",
          fullName: "BUONG PANGALAN",
          age: "EDAD",
          phoneNumber: "numero ng telepono",
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


       "complaintStatus": {
    "status": {
      "submitted": "Naisumite",
      "forwarded": "Ipinasa",
      "resolved": "Nalutas",
      "rejected": "Tinanggihan",
      "pending": "Nakabinbin",
      "reviewed_by_barangay": "Nasuri ng Barangay",
      "resolved_by_barangay": "Nalutas ng Barangay",
      "forwarded_to_lgu": "Ipinasa sa LGU",
      "reviewed_by_lgu": "Nasuri ng LGU",
      "resolved_by_lgu": "Nalutas ng LGU",
      "rejected_by_lgu": "Tinanggihan ng LGU",
      "forwarded_to_department": "Ipinasa sa Dept.",
      "reviewed_by_department": "Sinusuri ng Dept.",
      "resolved_by_department": "Nalutas ng Dept.",
      "rejected_by_department": "Tinanggihan ng Dept."
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
          "landslide":"Pagguho ng Lupa",
          "other": "Iba pa (tukuyin sa ibaba)"
        }
      },


      "complaints": {
    "header": {
      "location": "Santa Maria, Laguna",
      "title": "Aking mga Reklamo",
      "back": "Bumalik"
    },

    "titles": {
   "noise_disturbance": "Ingay na Nakakagambala",
  "illegal_dumping": "Ilegal na Pagtatapon ng Basura",
  "road_damage": "Pinsala sa Daan",
  "street_light_outage": "Sirang Ilaw sa Lansangan",
  "flooding_drainage": "Pagbaha",
  "illegal_construction": "Ilegal na Konstruksyon",
  "stray_animals": "Mga Ligaw na Hayop",
  "public_intoxication": "Pagkalasing sa Pampublikong Lugar",
  "illegal_vending": "Ilegal na Pagbebenta",
  "water_supply_issue": "Problema sa Suplay ng Tubig",
  "garbage_collection": "Koleksyon ng Basura",
  "vandalism": "Vandalismo"
},


"pagination": {
  "showing": "Ipinapakita ang {{start}}–{{end}} sa {{total}} mga reklamo"
},
    "search": {
      "placeholder": "Maghanap sa iyong mga reklamo..."
    },
    "filter": {
      "label": "Salain",
      "labelWithCount": "Salain ({{count}})",
      "title": "Salain ayon sa Katayuan",
      "clearAll": "Alisin Lahat",
      "apply": "Ilapat ang Mga Filter"
    },
    "count": "{{filtered}} sa {{total}} reklamo",
    "count_plural": "{{filtered}} sa {{total}} mga reklamo",
    "card": {
      "id": "#{{id}}"
    },
    "empty": {
      "noResults": {
        "title": "Walang Nahanap na Resulta",
        "description": "Subukang baguhin ang iyong mga filter o ang mga salitang hinahanap."
      },
      "noComplaints": {
        "title": "Wala Pang Reklamo",
        "description": "Wala ka pang naisusumiteng reklamo."
      }
    },
    "loading": "Kinukuha ang iyong mga reklamo...",
    "error": {
      "title": "Hindi Makuha ang mga Reklamo",
      "message": "Nabigo sa pagkuha ng mga reklamo"
    }
  },

      "complaintsScreen": {
        "header": {
          "title": "Mag-file ng Reklamo",
          "subtitle": "Pumili ng barangay para isumite ang iyong reklamo"
        },
        "search": {
          "placeholder": "Maghanap ng barangay..."
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
    

    

   
   complaintDetail: {
    loading: "Nino-load ang detalye ng reklamo…",
     "feedbackButton": "Mag-submit ng Feedback",
 
    error: {
      title: "May nangyaring mali",
      message: "Hindi ma-load ang detalye ng reklamo.",
    },
 
    header: {
      complaintId: "Reklamo #{{id}}",
    },
 
    // ── Status chip labels ──────────────────────────────────────────────────
    status: {
      submitted: "Naisumite",
      underReview: "Sinusuri",
      resolved: "Naresolba",
      forwardedLgu: "Ipinasa sa LGU",
      forwardedDept: "Ipinasa sa Dept.",
       "underReviewLgu": "Under Review ng LGU",
      deptReview: "Sinusuri ng Dept.",
      rejectedLgu: "Nireject ng LGU",
      rejectedDept: "Nireject ng Dept.",
        "resolvedBarangay": "Niresolba ng Barangay",
"resolvedLgu":      "Niresolba ng LGU",
"resolvedDept":     "Niresolba ng Department"
    },
 
    // ── Progress tracker steps ──────────────────────────────────────────────
    tracker: {
      title: "Katayuan ng Reklamo",
      "rejectedBarangay": "Nireject ng Barangay",
      submitted: "Naisumite",
      submittedSub: "Natanggap na ang reklamo",
 
      barangay: "Pagsusuri ng Barangay",
      barangaySub: "Sinusuri ng barangay",
      
      lgu: "Pagsusuri ng LGU",
      lguSub: "Ipinasa sa lokal na pamahalaan",
       "lguReviewSub": "Sinusuri ng Lgu",
      department: "Pagsusuri ng Departamento",
      departmentSub: "Ipinasa sa kaukulang departamento",
 
      resolved: "Naresolba",
      resolvedSub: "Naalagaan na ang reklamo",
       resolvedByBarangay: "Naresolba sa Barangay ",  // ← add
  resolvedByLgu: "Naresolba sa LGU",            // ← add
  resolvedByDept: "Naresolba sa Departamento",  
 
      rejectedLgu: "Tinanggihan ng LGU",
      rejectedDept: "Tinanggihan ng Departamento",
      rejectedSub: "Hindi tinanggap ang reklamo",
    },
 
    // ── Rejection banner ────────────────────────────────────────────────────
    rejection: {
      title: "Tinanggihan ang Reklamo",
      byLgu: "Hindi tinanggap ng Lokal na Pamahalaan ang inyong reklamo.",
      byDept: "Hindi tinanggap ng Departamento ang inyong reklamo.",
        "byBarangay": "Ang iyong reklamo ay nasuri at tinanggihan ng barangay."
    },
 
    // ── Section headings ────────────────────────────────────────────────────
    sections: {
      complaintInfo: "Impormasyon ng Reklamo",
      barangay: "Nangangasiwa na Barangay",
      department: "Nangangasiwa na Departamento",
      remarks: "Mga Tugon",
    },
 
    // ── Field labels ────────────────────────────────────────────────────────
    fields: {
      category: "Kategorya",
      description: "Paglalarawan",
      location: "Lokasyon",
      dateSubmitted: "Petsa ng Pagsusumite",
      barangayName: "Barangay",
      address: "Tirahan",
      contactNumber: "Numero ng Telepono",
      email: "Email",
      departmentName: "Departamento",
    },
 
    // ── Remarks / responses ─────────────────────────────────────────────────
    remarks: {
      title: "Mga Tugon",
      newest: "Pinakabago",
      oldest: "Pinakamatanda",
      remarkLabel: "Tugon #{{number}}",
      viewAll: "Tingnan Lahat ({{count}})",
      showLess: "Ipakita ang Mas Kaunti",
    },
  },

   "errors": {
    "retryLabel": "Subukang Muli",
    "retryingLabel": "Sinusubukan...",
    "network": {
      "title": "Walang Koneksyon sa Internet",
      "message": "Pakitingnan ang iyong koneksyon sa internet at subukang muli."
    },
    "server": {
      "title": "May Nangyaring Mali",
      "message": "Nakatagpo kami ng problema sa aming panig. Pakisubukan muli mamaya."
    },
    "notFound": {
      "title": "Hindi Mahanap",
      "message": "Ang nilalaman na hinahanap mo ay hindi mahanap."
    },
    "unauthorized": {
      "title": "Hindi Awtorisado",
      "message": "Kailangan mong mag-sign in upang ma-access ang nilalamang ito."
    },
    "forbidden": {
      "title": "Tinanggihan ang Access",
      "message": "Wala kang pahintulot na ma-access ang nilalamang ito."
    },
    "timeout": {
      "title": "Nag-timeout ang Kahilingan",
      "message": "Masyadong matagal ang kahilingan. Pakisubukan muli."
    },
    "generic": {
      "title": "Error",
      "message": "Nagkaroon ng hindi inaasahang error. Pakisubukan muli."
    }
  },
      "complaint_form": {
        "screen_title": "Maghain ng Reklamo",
        "title_label": "Kategorya ng Reklamo",
        "title_placeholder": "Pumili ng kategorya ng reklamo",
        "title_description": "Pumili ng kategorya na pinaka-angkop sa iyong reklamo. Kung walang kategorya ang tumutugma, piliin ang 'Iba pa' at tukuyin sa ibaba.",
        "custom_title_placeholder": "Ilagay ang pamagat ng inyong reklamo",
        "custom_title_hint": "Ilarawan ang inyong reklamo nang maikli",
        "details_label": "Detalye ng Reklamo",
         "profile_location_title": "Kailangang I-set ang Lokasyon sa Profile",
    "profile_location_desc": "Hindi mo pa naitatakda ang iyong lokasyon. I-tap ito para i-update ang iyong profile bago magsumite.",
 "custom_title_validation_spaces": "Ang pamagat ay hindi maaaring blangko o may mga espasyo lamang.",
  "custom_title_validation_repeated_chars": "Ang pamagat ay naglalaman ng napakaraming paulit-ulit na mga character.",
  "custom_title_validation_repeated_words": "Ang pamagat ay naglalaman ng napakaraming paulit-ulit na mga salita.",
    "details_description": "Ilarawan nang malinaw ang iyong reklamo. Ilagay kung kailan ito nangyari, sino ang apektado, at iba pang detalye upang agad itong matugunan ng barangay.",
     "details_validation_repeated_chars": "Mangyaring huwag paulit-ulitin ang parehong karakter o simbolo nang maraming beses.",
    "details_validation_repeated_words": "Paulit-ulit ang salita sa iyong paglalarawan. Subukang ilarawan ang problema sa ibang paraan.",
    "details_validation_no_meaningful_content": "Mangyaring ilarawan ang isyu gamit ang tunay na mga salita, hindi lang mga numero o simbolo.",
    "next_step_hint": "Sunod: I-pin ang lugar kung saan nangyari ang insidente sa mapa.",
     "next_step":"Susunod: I-pin ang Lokasyon sa Mapa",
    "attachment_photo_tag": "JPG, PNG",
    "attachment_video_tag": "MP4, MOV",
    "attachment_any_tag": "ANUMAN",
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

      "location_step": {
    "title": "Saan ito nangyari?",
   

    "instruction": "I-tap ang mapa para maglagay ng pin, o gamitin ang iyong kasalukuyang lokasyon",

    "loading_map": "Ikinakarga ang mapa…",
    "map_error_title": "Nabigong i-load ang mapa",
    "map_error_desc": "Suriin ang iyong koneksyon at subukang muli.",
    "reload_map": "I-reload ang Mapa",

    "gps_error_permission": "Tinanggihan ang location permission. I-enable ito sa Settings ng iyong device.",
    "gps_error_unavailable": "Hindi matukoy ang iyong lokasyon. Tiyaking naka-on ang GPS.",
    "gps_error_timeout": "Nag-time out ang location request. Lumipat sa open area at subukang muli.",
    "gps_error_unknown": "Hindi makuha ang iyong lokasyon. Subukang muli.",

    "gps_button": "Aking Lokasyon",
    "gps_getting": "Kinukuha…",
    "gps_wait": "Maghintay ng {{seconds}}s",
    "gps_cooldown": "Maaari mong gamitin muli ang \"Aking Lokasyon\" sa loob ng {{seconds}}s",

    "barangay_pin": "Barangay Pin",
    "or_hint": "o i-tap / i-drag ang pin sa mapa",

    "confirm_location": "Kumpirmahin ang Lokasyon",

    "next_title": "Sunod: I-pin ang Lokasyon"
  },

"complaintPreview": {
    "back": "Bumalik",
    "title": "Preview ng Reklamo",
    "refNo": "Ref. No.",
    "submit": "Isumite ang Reklamo",
    "submitting": "Isinusumite...",
    "edit": "← Bumalik at i-edit",

    "sections": {
      "complainantInfo": "Impormasyon ng Nagrereklamo",
      "complaintDetails": "Detalye ng Reklamo",
      "attachments": "Mga Kalakip",
      "subject": "Paksa",
      "description": "Paglalarawan",
      "fullName": "Buong Pangalan",
      "address": "Tirahan",
      "filedTo": "Isinampa Sa",
      "dateFiled": "Petsa ng Pagsumite"
    },

    "attachments": {
      "count": "Mga Kalakip ({{count}})"
    },

    "status": {
      "read": "NABASA",
      "hasRead": "Nabasa mo na ang mga tuntunin.",
      "notRead": "I-scroll para mabasa ang lahat ng tuntunin.",
      "accept": "Nabasa at sumasang-ayon ako sa mga Tuntunin at Kasunduan."
    }
  },


      "header": {
        "municipality": "Munisipalidad ng",
        "city": "Santa Maria",
        "location": "Laguna, Pilipinas"
      },
      "stats": {
        "heading": "Mga Reklamo Mo",
        "submitted": "Isinumite",
        "inProgress": "Naproseso",
        "resolved": "Nalutas"
      },
      "quick": {
        "heading": "Mabilis na Access",
        "services": "Mga\nSerbisyo",
        "complaints": "Mga\nReklamo",
        "events": "Mga\nKaganapan",
        "hotlines": "Hotlines"
      },
      "announcements": {
        "heading": "Mga Anunsyo",
        "all": "Tingnan Lahat",
       "back": "Bumalik",
           "title": "Mga Anunsyo",
    "count": "anunsyo ang nahanap",
    "search_placeholder": "Maghanap ng anunsyo...",
    "loading": "Nilo-load ang mga anunsyo...",
    "error_title": "May naganap na error",
    "error_subtitle": "Hindi ma-load ang mga anunsyo. Subukan muli.",
    "retry": "Subukan Muli",
    "empty_title": "Walang nahanap na anunsyo",
    "empty_subtitle": "Subukan baguhin ang iyong paghahanap.",
    "badge": "Bago",
    "unknown": "Hindi Kilala",
    "prev": "Nakaraan",
    "next": "Susunod",
    "video": "video",
    "videos": "mga video",
        "tag": "Anunsyo",
        "read_more": "Basahin",
        "see_more": "Tignan Pa",
        "remaining": "pa",
        "posted_by": "Ipinost ni",
        "end_of_list": "— Katapusan ng listahan —",
    
        "empty_body": "Wala pang anunsyo sa kasalukuyan.",
      
        "error_body": "Hindi ma-load ang mga anunsyo.",
       
        
      },
      "media": {
        "tap_to_watch": "I-tap para manood",
        "close": "Isara",
        "zoom_hint": "I-double tap para mag-zoom · Pinch para mag-scale",
        "posted_by": "Ini-post ni"
      },
      "time": {
        "just_now": "kararating lang",
        "minutes_ago": "m ang nakakaraan",
        "hours_ago": "h ang nakakaraan",
        "days_ago": "d ang nakakaraan"
      },
      "cta": {
        "submit_complaint": "Magsumite ng Reklamo"
      },
      "greeting": {
        "morning": "Magandang Umaga",
        "afternoon": "Magandang Hapon",
        "evening": "Magandang Gabi"
      },

      "home": {
        "resident": "Residente",
        "stay_updated": "Manatiling updated sa iyong komunidad ngayong araw.",
        "weather_fair": "Maaliwalas",

           "errors" : {
          "screenTitle": "Hindi Ma-load ang Home Screen",
        }
      },

      "chatbot":{
        "ask": "Tanong?",
        "info": "Tanungin mo ako tungkol sa Santa Maria, Laguna — reklamo, serbisyo, dokumento, at higit pa",
        "greeting": "Kamusta! Ako si MaryBot 👋\n\nAng iyong FAQ assistant para sa Munisipalidad ng Santa Maria, Laguna.\n\nAno ang maipaglilingkod ko sa iyo?",
         "frequentQuestions": "Mga Madalas na Tanong",
          "askInput": "I-type ang iyong tanong...",
         "typing": "Nagtatype...",
          "suggestions": {
      "howToFileComplaint": "📋 Paano mag-file ng reklamo?",
      "complaintStatus": "🔍 Status ng aking reklamo",
      "barangayClearance": "📄 Barangay clearance",
      "municipalServices": "🏛️ Mga serbisyo ng munisipyo",
      "officeHours": "⏰ Oras ng opisina",
      "contactNumbers": "📞 Mga contact numbers",
   
     
    },
     "placeholder": {
      "offline": "Walang koneksyon sa internet...",
      "slow": "Mabagal ang koneksyon...",
      "busy": "Naghihintay sa sagot...",
      "default": "Magtanong tungkol sa Santa Maria..."
    }
      },

     "emergency": {
    "title": "Emergency",
    "bannerText": "Tumawag lamang sa tunay na emergency. Ang maling paggamit ng linya ng emergency ay may kaukulang parusa.",
    "callButton": "Tumawag",
    "disclaimer": "Para sa mga hindi emergency na alalahanin, bisitahin ang pinakamalapit na barangay hall.",
    "sections": {
      "hotlines": "Mga Emergency Hotline",
      "evacuationCenters": "Mga Evacuation Center"
    },
    "services": {
      "pnp": "Philippine National Police",
      "bfp": "Bureau of Fire Protection"
    },
    "modal": {
      "title": "Kumpirmahin ang Tawag",
      "body": "Nais mo bang tawagan ang {{service}}?",
      "cancel": "Kanselahin",
      "confirm": "Tumawag Ngayon"
    },
    "dialerUnavailableTitle": "Hindi Makatawag",
    "dialerUnavailableMessage": "Hindi sinusuportahan ng iyong device ang pagtawag.",
    "evacuation": {
      "notice": "Ang mga sentrong ito ay itinalagang lugar ng evacuation sa panahon ng emergency. Pumunta sa pinakamalapit kapag inutusan ng lokal na awtoridad.",
      "fetchingAddress": "Kinukuha ang address…",
      "addressUnavailable": "Hindi available ang address",
      "mapUnavailable": "Hindi available ang mapa",
      "viewRoute": "Tingnan ang Ruta",
      "getRoute": "Kunin ang Ruta",
      "calculatingRoute": "Kinakalkula ang ruta…",
      "away": "ang layo",
      "routeModal": {
        "subtitle": "Pinakamaikling ruta via OSRM · OpenStreetMap",
        "legendUser": "Iyong lokasyon",
        "legendDest": "Evacuation center",
        "legendRoute": "Ruta",
        "loadingMap": "Nilo-load ang mapa…"
      }
    }
  }, 

  "ordinance": {
  "badge": "Opisyal na Rekord",
  "title": "Manatiling updated sa mga ordinansa ng Santa Maria",
  "subtitle": "Tingnan ang mga opisyal na batas at regulasyon ng Munisipalidad ng Santa Maria, Laguna — kahit saan, kahit kailan.",
  "cta": "Tingnan ang mga Ordinansa"
},
  "registerValidation": {
  "firstNameRequired": "Kailangan ang pangalan.",
  "firstNameMinLength": "Ang pangalan ay dapat hindi mas maikli sa 2 karakter.",
  "firstNameMaxLength": "Ang pangalan ay dapat hindi hihigit sa {{max}} karakter.",
  "firstNameInvalidChars": "Ang pangalan ay hindi dapat may numero o espesyal na karakter.",
  "firstNameLettersOnly": "Ang pangalan ay dapat may mga letra lamang.",
  "firstNameRepeatedChars": "Ang pangalan ay hindi dapat may paulit-ulit na karakter.",
  "firstNameRepeatedWords": "Ang pangalan ay hindi dapat may paulit-ulit na salita.",
  "firstNameSingleLetters": "Ang pangalan ay hindi dapat binubuo ng iisang letra.",
    "idNumberInvalidChars": "Ang ID number ay maaari lamang maglaman ng mga letra, numero, gitling, at espasyo",
  "idNumberMustHaveDigit": "Ang ID number ay dapat maglaman ng kahit isang numero",
  "idNumberTooManyLetters": "Hindi wastong format ng ID number",
  "idNumberTooShort": "Ang ID number ay masyadong maikli",
  "idNumberTooLong": "Ang ID number ay masyadong mahaba",
  "idNumberRepeatedChars": "Ang ID number ay hindi maaaring pawang magkaparehong character",
  "idNumberPatternRepeat": "Ang ID number ay hindi maaaring paulit-ulit na pattern",

  "middleNameMinLength": "Ang gitnang pangalan ay dapat hindi mas maikli sa 2 karakter.",
  "middleNameMaxLength": "Ang gitnang pangalan ay dapat hindi hihigit sa {{max}} karakter.",
  "middleNameInvalidChars": "Ang gitnang pangalan ay hindi dapat may numero o espesyal na karakter.",
  "middleNameLettersOnly": "Ang gitnang pangalan ay dapat may mga letra lamang.",
  "middleNameRepeatedChars": "Ang gitnang pangalan ay hindi dapat may paulit-ulit na karakter.",
  "middleNameRepeatedWords": "Ang gitnang pangalan ay hindi dapat may paulit-ulit na salita.",
  "middleNameSingleLetters": "Ang gitnang pangalan ay hindi dapat binubuo ng iisang letra.",

  "lastNameRequired": "Kailangan ang apelyido.",
  "lastNameMinLength": "Ang apelyido ay dapat hindi mas maikli sa 2 karakter.",
  "lastNameMaxLength": "Ang apelyido ay dapat hindi hihigit sa {{max}} karakter.",
  "lastNameInvalidChars": "Ang apelyido ay hindi dapat may numero o espesyal na karakter.",
  "lastNameLettersOnly": "Ang apelyido ay dapat may mga letra lamang.",
  "lastNameRepeatedChars": "Ang apelyido ay hindi dapat may paulit-ulit na karakter.",
  "lastNameRepeatedWords": "Ang apelyido ay hindi dapat may paulit-ulit na salita.",
  "lastNameSingleLetters": "Ang apelyido ay hindi dapat binubuo ng iisang letra.",

  "contactNumberRequired": "Kailangan ang numero ng telepono.",
  "contactNumberInvalidChars": "Ang numero ay hindi dapat may letra o espesyal na karakter.",
  "contactNumberInvalidLength": "Ang numero ay dapat isang wastong Philippine mobile number.",
  "contactNumberRepeatingDigits": "Ang numero ay hindi dapat may 4 o higit pang paulit-ulit na digit.",

  "emailRequired": "Kailangan ang email.",
  "emailLocalPartTooLong": "Ang bahagi bago ang '@' ay hindi dapat hihigit sa 64 karakter.",
  "emailInvalidFormat": "Hindi wastong format ng email. Mangyaring maglagay ng wastong email.",
  "emailInvalidDomain": "Ang {{domain}} ay hindi isang kilalang email provider.",

  "passwordRequired": "Kailangan ang password.",
  "passwordNoSpaces": "Ang password ay hindi dapat may espasyo.",
  "passwordMinLength": "Ang password ay dapat hindi mas maikli sa 8 karakter.",
  "passwordWeak": "Mahina",
  "passwordMedium": "Katamtaman",
  "passwordStrong": "Malakas",
  "passwordHint": "Walang espasyo. Hindi dapat mas maikli sa 8 karakter.",
  "passwordMaxLength": "Ang password ay hindi dapat hihigit sa 128 karakter."
},

  "feedback" : {
     "card_badge": "Magbigay ng Feedback",
  "card_title": "Tulungan ninyo kaming pagandahin pa",
  "card_subtitle": "Ang inyong mga mungkahi ay makakatulong para mas gumanda ang app para sa lahat sa Santa Maria.",
  "card_cta": "Magbigay ng Feedback",
  "screen_title": "Feedback sa App",
  "hero_title": "Tulungan ninyo kaming pagandahin pa",
  "hero_subtitle": "Malaking tulong ang inyong feedback para mapabuti namin ang app para sa lahat sa Santa Maria.",
  "rating_label": "Paano ninyo ire-rate ang app?",
  "rating_poor": "Hindi Maganda",
  "rating_fair": "Ayos Lang",
  "rating_good": "Maganda",
  "rating_very_good": "Napakaganda",
  "rating_excellent": "Napakahusay",
  "message_label": "Karagdagang komento",
  "message_optional": "(opsyonal)",
  "message_placeholder": "Sabihin sa amin kung ano ang inyong naiisip, kung may kulang, o kung paano pa namin mapapabuti ang app...",
  "submit_button": "I-submit ang Feedback",
  "submitting": "Isinusumite...",
  "success_title": "Salamat!",
  "success_message": "Matagumpay na naisumite ang inyong feedback. Salamat sa pagtulong na mapabuti ang app.",
  "success_cta": "Bumalik sa Home",
  "error_no_rating": "Pumili muna ng rating bago i-submit.",
  "error_too_many": "Masyado nang maraming submissions. Maghintay muna ng isang minuto at subukan ulit.",
  "error_not_found": "Hindi mahanap ang user. Mag-login ulit at subukan muli.",
  "error_server": "May nagkaroon ng problema sa server. Subukan ulit mamaya.",
  "error_no_internet": "Walang internet connection. Pakisuri ang inyong network at subukan ulit.",
  "error_generic": "May naganap na hindi inaasahang error. Subukan ulit."
  },


"postIncidentFeedback": {
"title": "I-rate ang Iyong Karanasan",
"heading": "Kumusta ang iyong karanasan?",
"subheading": "Mahalaga ang iyong feedback upang mapabuti ang serbisyo ng barangay at mas mahusay na makatulong sa mga residente.",
"ratingPrompt": "Paki-rate ang iyong kabuuang karanasan",
"commentLabel": "Karagdagang komento (opsyonal)",
"commentPlaceholder": "Magbahagi ng karagdagang detalye tungkol sa iyong karanasan...",
"submit": "Isumite ang Feedback",

"ratingLabels": {
  "terrible": "Napakasama",
  "bad": "Hindi Maganda",
  "okay": "Katamtaman",
  "good": "Maganda",
  "excellent": "Napakaganda"
},

"success": {
  "headerTitle": "Naipasa ang Feedback",
  "title": "Maraming Salamat!",
  "message": "Matagumpay na naipasa ang iyong feedback. Pinahahalagahan namin ang iyong oras at tulong sa pagpapabuti ng aming mga serbisyo.",
  "viewComplaints": "Tingnan ang Aking Mga Reklamo",
  "goBack": "Bumalik"
},

"errorTitle": "Hindi Maipasa",
"errorMessage": "Nagkaroon ng problema sa pagpapasa ng iyong feedback. Pakisubukang muli."

},

"notifications": {
  "emptyTitle": "Wala kang bagong notification!",
  "emptySubtitle": "Walang mga notification pa. Inonotify ka namin kapag may nangyari.",
  "type": {
   "rejected": "Rejected",
    "rejected_by_lgu": "Rejected",
    "rejected_by_department": "Rejected",
    "rejected_by_barangay": "Rejected",
    "update": "Update",
    "success": "Matagumpay",
    "complaint_resolved": "Nalutas",
    "complaint_under_review": "Sinusuri",
    "complaint_update": "Ipinasa",
    "info": "Kasalukuyang Insidente"
  },
  "title": {
   "rejected": "Nireject ang Reklamo",
    "rejected_by_lgu": "Nirejected ng LGU ang Reklamo",
    "rejected_by_department": "Nirejected ng Department ang Reklamo",
    "rejected_by_barangay": "Nirejected ng Barangay ang Reklamo",
    "update": "Update sa Reklamo",
    "success": "Matagumpay",
    "complaint_resolved": "Nalutas ang Reklamo",
    "complaint_under_review": "Reklamo ay Nirereview",
    "complaint_update": "Reklamo ay Ipinasa sa Departamento",
    "info": "Bahagi na ng Isang Insidente"
  },
  "message": {
    "rejected": "Ang iyong reklamo '{{title}}' ay hindi tinanggap. Mangyaring suriin ang mga detalye at subukan muli.",
    "rejected_by_lgu": "Ang iyong reklamo '{{title}}' ay hindi tinanggap ng LGU. Mangyaring suriin ang mga detalye at subukan muli.",
    "rejected_by_department": "Ang iyong reklamo '{{title}}' ay hindi tinanggap ng Department. Mangyaring suriin ang mga detalye at subukan muli.",
    "rejected_by_barangay": "Ang iyong reklamo '{{title}}' ay hindi tinanggap ng Barangay. Mangyaring suriin ang mga detalye at subukan muli.",
    "update": "Na-update na ang iyong reklamo.",
    "success": "Ang iyong reklamo '{{title}}' ay matagumpay na naresolba.",
    "complaint_resolved": "Ang iyong reklamo na '{{title}}' ay nalutas na.",
    "complaint_under_review": "Ang iyong reklamo na '{{title}}' ay kasalukuyang sinusuri.",
    "complaint_update": "Ang iyong reklamo ay ipinasa na sa departamento para sa karagdagang pagproseso.",
    "info": "Ang iyong reklamo ay bahagi na ng isang kasalukuyang insidente. Katulad na mga reklamo ay naisumite na para sa insidenteng ito."
  }
}, 

"events": {
    "upcomingEvents": "Mga Paparating na Event",
    "seeAll": "Tingnan Lahat",
    "loading": "Naglo-load ng events…",
    "retry": "Subukan Muli",
    "failedToLoad": "Hindi ma-load ang mga event",
    "community": "KOMUNIDAD",
    "details": "Detalye",
    "noEvents": "Walang paparating na event sa ngayon.\nBumalik muli mamaya!"
  },


   "viewAllEvents": {
    "title": "Mga Event",
    "subtitle": "Kalendaryo ng komunidad",
    "searchPlaceholder": "Maghanap ng event o lokasyon…",
    "loading": "Naglo-load ng events…",
    "noEventsYet": "Walang event sa ngayon",
    "noEventsMessage": "Bumalik muli para sa mga paparating na community event.",
    "noResults": "Walang nahanap",
    "noResultsMessage": "Walang event na tumugma sa \"{{query}}\".",
    "clearSearch": "I-clear ang Search",
    "event": "event",
    "eventsCount": "mga event",
    "forQuery": "para sa \"{{query}}\""
  },

   "eventDetails": {
    "title": "Mga Detalye ng Event",
    "loading": "Ikinakarga ang event…",
    "goBack": "Bumalik",

    "info": {
      "title": "Impormasyon ng Event",
      "date": "Petsa",
      "time": "Oras",
      "location": "Lokasyon"
    },

    "about": "Tungkol sa Event na Ito",

    "media": {
      "noPhotos": "Walang larawan para sa event na ito",
      "attached": "{{count}} larawan naka-attach",
      "attached_plural": "{{count}} mga larawan naka-attach"
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

      callback('en');
    }
  },
  init: () => { },
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {

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