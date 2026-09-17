/**
 * Philippine ID Number Validation by ID Type
 *
 * Formats based on official Philippine government ID number standards:
 * - Driver's License: LTO format A00-00-000000 (1 letter + 2d + 2d + 6d)
 * - National ID (PhilSys): 16-digit PhilSys number
 * - Passport: DFA format A0000000 (old) or AA0000000 (ePassport)
 * - UMID: SSS/GSIS CRN format ####-#######-# (12 digits)
 * - SSS: ##-#######-# (10 digits)
 * - PhilHealth: 12-digit PIN (############)
 * - TIN ID: usually 9–12 digits or formatted with hyphens
 * - Voter's ID: COMELEC precinct-based, loose alphanumeric (7–13 chars)
 * - Postal ID: PhilPost alphanumeric, varies by region (10–15 chars)
 * - Barangay ID: No national standard, free-form (3–30 chars)
 * - Senior Citizen ID: government-issued, usually 10–20 alphanumeric chars
 * - PWD ID: government-issued, usually 8–20 alphanumeric chars
 * - PRC ID: professional license ID, usually 6–20 alphanumeric chars
 * - Student ID: Institution-specific, free-form (3–30 chars)
 */

type TFunction = (key: string, options?: Record<string, any>) => string;

interface IdValidationRule {
  regex?: RegExp;
  minLength?: number;
  maxLength?: number;
  format: string; // human-readable format hint shown in error
}

const ID_RULES: Record<string, IdValidationRule> = {
  nationalId: {
    // PhilSys national ID: 16 digits
    regex: /^\d{16}$/,
    format: '16 digits (e.g. 1233-1233-1322-1312)',
  },
  driversLicense: {
    // Format: A00-00-000000 (e.g. D01-23-456789)
    regex: /^[A-Z]\d{2}-\d{2}-\d{6}$/,
    format: 'A00-00-000000 (e.g. D01-23-456789)',
  },
  passport: {
    // Old format: A0000000 (1 letter + 7 digits)
    // ePassport:  AA0000000 (2 letters + 7 digits)
    regex: /^[A-Z]{1,2}\d{7}$/,
    format: 'A0000000 or AA0000000 (e.g. P1234567 or EC1234567)',
  },
  umid: {
    // CRN format: ####-#######-# (12 digits with dashes)
    regex: /^\d{4}-\d{7}-\d{1}$/,
    format: '####-#######-# (e.g. 0012-3456789-0)',
  },
  sss: {
    // SSS number: ##-#######-# (10 digits with dashes)
    regex: /^\d{2}-\d{7}-\d{1}$/,
    format: '##-#######-# (e.g. 01-2345678-9)',
  },
  philhealth: {
    // PhilHealth PIN: 12 digits, no dashes
    regex: /^\d{12}$/,
    format: '############  (e.g. 012345678901)',
  },
  tinId: {
    // TIN commonly appears as 9 or 12 digits, sometimes with hyphen separators
    regex: /^(?:\d{9}|\d{12}|\d{3}-\d{3}-\d{3}-\d{3}|\d{3}-\d{3}-\d{3})$/,
    format: '9 or 12 digits, or a hyphenated format (e.g. 123-456-789 or 123-456-789-000)',
  },
  votersId: {
    // COMELEC precinct-based, no strict national standard
    // Alphanumeric, typically 7–13 characters
    regex: /^[A-Z0-9\-]{7,13}$/,
    format: '7–13 alphanumeric characters (e.g. 1234567 or ABC-1234567)',
  },
  postalId: {
    // PhilPost format varies by region, alphanumeric 10–15 chars
    regex: /^[A-Z0-9\-]{10,15}$/,
    format: '10–15 alphanumeric characters (e.g. PH1234567890)',
  },
  barangayId: {
    // No national standard, just reasonable length
    minLength: 3,
    maxLength: 30,
    format: '3–30 characters',
  },
  seniorCitizenId: {
    minLength: 5,
    maxLength: 30,
    format: '5–30 characters',
  },
  pwdId: {
    minLength: 5,
    maxLength: 30,
    format: '5–30 characters',
  },
  prcId: {
    minLength: 6,
    maxLength: 30,
    format: '6–30 characters',
  },
  studentId: {
    // Institution-specific, just reasonable length
    minLength: 3,
    maxLength: 30,
    format: '3–30 characters',
  },
};

export const validateIdNumberByType = (
  idNumber: string,
  idType: string,
  t: TFunction
): string | null => {
  if (!idNumber || idNumber.trim() === '') {
    return t('required');
  }

  const trimmed = idNumber.trim().toUpperCase();
  const normalized = trimmed.replace(/[\s-]/g, '');
  const rule = ID_RULES[idType];

  // If no rule found for this ID type, just do a basic length check
  if (!rule) {
    if (trimmed.length < 3) return t('idNumberTooShort') || 'ID number is too short';
    return null;
  }

  // Regex-based validation
  if (rule.regex) {
    if (!rule.regex.test(idType === 'nationalId' ? normalized : trimmed)) {
      return (
        t('invalidIdFormat', { format: rule.format }) ||
        `Invalid formaat. Expected: ${rule.format}`
      );
    }
    return null;
  }

  // Length-based validation (for free-form IDs)
  if (rule.minLength !== undefined && trimmed.length < rule.minLength) {
    return (
      t('idNumberTooShort') ||
      `ID number must be at least ${rule.minLength} characters`
    );
  }
  if (rule.maxLength !== undefined && trimmed.length > rule.maxLength) {
    return (
      t('idNumberTooLong') ||
      `ID number must not exceed ${rule.maxLength} characters`
    );
  }

  return null;
};

/**
 * Returns a placeholder string for the ID number input
 * based on the selected ID type.
 */
export const getIdNumberPlaceholder = (idType: string): string => {
  const placeholders: Record<string, string> = {
    nationalId: '1233-1233-1322-1312',
    driversLicense: 'D01-23-456789',
    passport: 'P1234567 or EC1234567',
    umid: '0012-3456789-0',
    sss: '01-2345678-9',
    philhealth: '012345678901',
    tinId: '123-456-789 or 123-456-789-000',
    votersId: '1234567 or ABC-1234567',
    postalId: 'PH1234567890',
    barangayId: 'e.g. BRG-2024-001',
    seniorCitizenId: 'e.g. 1234567890',
    pwdId: 'e.g. PWD-2024-001',
    prcId: 'e.g. 1234567',
    studentId: 'e.g. 2024-00001',
  };
  return placeholders[idType] || 'Enter your ID number';
};

/**
 * Returns a hint string shown below the ID number field
 * based on the selected ID type.
 */
export const getIdNumberHint = (idType: string): string => {
  const hints: Record<string, string> = {
    nationalId: 'Enter your 16-digit PhilSys National ID number',
    driversLicense: 'Format: A00-00-000000 (e.g. D01-23-456789)',
    passport: 'Format: A0000000 (old) or AA0000000 (ePassport)',
    umid: 'Format: ####-#######-# (12-digit CRN on your UMID card)',
    sss: 'Format: ##-#######-# (10-digit SSS number)',
    philhealth: 'Enter your 12-digit PhilHealth Identification Number (PIN)',
    tinId: 'Enter your TIN ID number (9 or 12 digits, with or without hyphens)',
    votersId: 'Enter your COMELEC Voter ID number (7–13 characters)',
    postalId: 'Enter your PhilPost Postal ID number (10–15 characters)',
    barangayId: 'Enter the ID number as printed on your Barangay ID',
    seniorCitizenId: 'Enter the ID number printed on your Senior Citizen ID',
    pwdId: 'Enter the ID number printed on your PWD ID',
    prcId: 'Enter the ID number printed on your PRC ID',
    studentId: 'Enter the ID number as printed on your School ID',
  };
  return hints[idType] || '';
};

/** Formats the PhilSys number for display without changing the stored digits. */
export const formatNationalId = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1-');
};