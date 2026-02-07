export interface RegistrationFormData {
    // Personal Info
    firstName: string;
    middleName: string;
    lastName: string;
    suffix?: string;
    dateOfBirth: string;
    gender: string;

    // Contact
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;

    // Address
    barangay: string;
    streetAddress: string;
    zone?: string;

    // ID Verification
    idType: string;
    idNumber: string;
    idFrontImage?: string;
    idBackImage?: string;
    selfieImage?: string;

    // Terms
    agreedToTerms: boolean;
}
