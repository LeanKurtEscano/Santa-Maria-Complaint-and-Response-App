import { TFunction } from 'i18next';

export const validateFirstName = (firstName: string, t: TFunction): string => {
  const regex = /^[A-Za-z]+([ -][A-Za-z]+)*$/;
  const invalidCharsRegex = /[^A-Za-z\s-]/;
  const repeatedCharRegex = /(.)\1{2,}/;
  const maxLength = 50;
  const minLength = 2;

  if (!firstName || !firstName.trim()) return t('registerValidation.firstNameRequired');

  const trimmed = firstName.trim();

  if (trimmed.length < minLength) return t('registerValidation.firstNameMinLength');
  if (trimmed.length > maxLength) return t('registerValidation.firstNameMaxLength', { max: maxLength });
  if (invalidCharsRegex.test(trimmed)) return t('registerValidation.firstNameInvalidChars');
  if (!regex.test(trimmed)) return t('registerValidation.firstNameLettersOnly');
  if (repeatedCharRegex.test(trimmed.toLowerCase())) return t('registerValidation.firstNameRepeatedChars');

  const tokens = trimmed.toLowerCase().split(/[\s-]+/);
  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size < tokens.length) return t('registerValidation.firstNameRepeatedWords');
  if (tokens.every((token) => token.length === 1)) return t('registerValidation.firstNameSingleLetters');

  return "";
};

export const validateMiddleName = (middleName: string, t: TFunction): string => {
  const regex = /^[A-Za-z]+([ -][A-Za-z]+)*$/;
  const invalidCharsRegex = /[^A-Za-z\s-]/;
  const repeatedCharRegex = /(.)\1{2,}/;
  const maxLength = 50;
  const minLength = 2;

  if (!middleName || !middleName.trim()) return "";

  const trimmed = middleName.trim();

  if (trimmed.length < minLength) return t('registerValidation.middleNameMinLength');
  if (trimmed.length > maxLength) return t('registerValidation.middleNameMaxLength', { max: maxLength });
  if (invalidCharsRegex.test(trimmed)) return t('registerValidation.middleNameInvalidChars');
  if (!regex.test(trimmed)) return t('registerValidation.middleNameLettersOnly');
  if (repeatedCharRegex.test(trimmed.toLowerCase())) return t('registerValidation.middleNameRepeatedChars');

  const tokens = trimmed.toLowerCase().split(/[\s-]+/);
  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size < tokens.length) return t('registerValidation.middleNameRepeatedWords');
  if (tokens.every((token) => token.length === 1)) return t('registerValidation.middleNameSingleLetters');

  return "";
};

export const validateLastName = (lastName: string, t: TFunction): string => {
  const regex = /^[A-Za-z]+([ -][A-Za-z]+)*$/;
  const invalidCharsRegex = /[^A-Za-z\s-]/;
  const repeatedCharRegex = /(.)\1{2,}/;
  const maxLength = 50;
  const minLength = 2;

  if (!lastName || !lastName.trim()) return t('registerValidation.lastNameRequired');

  const trimmed = lastName.trim();

  if (trimmed.length < minLength) return t('registerValidation.lastNameMinLength');
  if (trimmed.length > maxLength) return t('registerValidation.lastNameMaxLength', { max: maxLength });
  if (invalidCharsRegex.test(trimmed)) return t('registerValidation.lastNameInvalidChars');
  if (!regex.test(trimmed)) return t('registerValidation.lastNameLettersOnly');
  if (repeatedCharRegex.test(trimmed.toLowerCase())) return t('registerValidation.lastNameRepeatedChars');

  const tokens = trimmed.toLowerCase().split(/[\s-]+/);
  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size < tokens.length) return t('registerValidation.lastNameRepeatedWords');
  if (tokens.every((token) => token.length === 1)) return t('registerValidation.lastNameSingleLetters');

  return "";
};

export const validateContactNumber = (contactNumber: string, t: TFunction): string => {
  if (!contactNumber) return t('registerValidation.contactNumberRequired');

  const trimmedNumber = contactNumber.trim();

  if (/[^0-9]/.test(trimmedNumber)) return t('registerValidation.contactNumberInvalidChars');
  if (trimmedNumber.length !== 10) return t('registerValidation.contactNumberInvalidLength');
  if (/(\d)\1{3,}/.test(trimmedNumber)) return t('registerValidation.contactNumberRepeatingDigits');

  return "";
};

export const validateEmail = (email: string, t: TFunction): string => {
  const validProviders = [
    'gmail.com', 'yahoo.com', 'yahoo.com.ph', 'outlook.com', 'hotmail.com', 'aol.com',
    'icloud.com', 'gov.ph', 'dfa.gov.ph', 'dip.gov.ph', 'deped.gov.ph', 'neda.gov.ph',
    'doh.gov.ph', 'dti.gov.ph', 'dswd.gov.ph', 'dbm.gov.ph', 'pcso.gov.ph', 'pnp.gov.ph',
    'bsp.gov.ph', 'prc.gov.ph', 'psa.gov.ph', 'dpwh.gov.ph', 'lto.gov.ph', 'boi.gov.ph',
    'hotmail.co.uk', 'hotmail.fr', 'msn.com', 'yahoo.fr', 'wanadoo.fr', 'orange.fr',
    'comcast.net', 'yahoo.co.uk', 'yahoo.com.br', 'yahoo.com.in', 'live.com',
    'rediffmail.com', 'free.fr', 'gmx.de', 'web.de', 'yandex.ru', 'ymail.com',
    'libero.it', 'uol.com.br', 'bol.com.br', 'mail.ru', 'cox.net', 'hotmail.it',
    'sbcglobal.net', 'sfr.fr', 'live.fr', 'verizon.net', 'live.co.uk', 'googlemail.com',
    'yahoo.es', 'ig.com.br', 'live.nl', 'bigpond.com', 'terra.com.br', 'yahoo.it',
    'neuf.fr', 'yahoo.de', 'alice.it', 'rocketmail.com', 'att.net', 'laposte.net',
    'facebook.com', 'bellsouth.net', 'yahoo.in', 'hotmail.es', 'charter.net',
    'yahoo.ca', 'yahoo.com.au', 'rambler.ru', 'hotmail.de', 'tiscali.it', 'shaw.ca',
    'yahoo.co.jp', 'sky.com', 'earthlink.net', 'optonline.net', 'freenet.de',
    't-online.de', 'aliceadsl.fr', 'virgilio.it', 'home.nl', 'qq.com', 'telenet.be',
    'me.com', 'yahoo.com.ar', 'tiscali.co.uk', 'yahoo.com.mx', 'voila.fr', 'gmx.net',
    'mail.com', 'planet.nl', 'tin.it', 'live.it', 'ntlworld.com', 'arcor.de',
    'yahoo.co.id', 'frontiernet.net', 'hetnet.nl', 'live.com.au', 'yahoo.com.sg',
    'zonnet.nl', 'club-internet.fr', 'juno.com', 'optusnet.com.au', 'blueyonder.co.uk',
    'bluewin.ch', 'skynet.be', 'sympatico.ca', 'windstream.net', 'mac.com',
    'centurytel.net', 'chello.nl', 'live.ca', 'aim.com', 'bigpond.net.au',
    'up.edu.ph', 'addu.edu.ph', 'ateneo.edu.ph', 'dlsu.edu.ph', 'ust.edu.ph', 'lu.edu.ph'
  ];

  email = email.trim();

  if (!email) return t('registerValidation.emailRequired');

  const localPart = email.split('@')[0];
  if (localPart.length > 64) return t('registerValidation.emailLocalPartTooLong');

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}(\.[a-z]{2,})?$/;
  if (!emailRegex.test(email)) return t('registerValidation.emailInvalidFormat');

  const domain = email.split('@')[1];
  const isValidDomain = validProviders.some(provider => new RegExp(`^${provider}$`).test(domain));
  if (!isValidDomain) return t('registerValidation.emailInvalidDomain', { domain });

  return "";
};



export const validatePassword = (password: string, t: TFunction): string => {
  if (!password) return t('registerValidation.passwordRequired');
  if (password.includes(' ')) return t('registerValidation.passwordNoSpaces');
  if (password.length < 8) return t('registerValidation.passwordMinLength');
  if (password.length > 128) return t('registerValidation.passwordMaxLength');
  return "";
};



export const validateIdNumber = (value: string, t: any): string | undefined => {
  if (!value || value.trim() === '') return t('required');

  // Only allow alphanumeric, hyphens, and spaces
  if (!/^[a-zA-Z0-9\- ]+$/.test(value)) {
    return t('registerValidation.idNumberInvalidChars');
  }

  // Must contain at least one digit
  if (!/\d/.test(value)) {
    return t('registerValidation.idNumberMustHaveDigit');
  }

  // No more than 6 consecutive letters
  if (/[a-zA-Z]{7,}/.test(value)) {
    return t('registerValidation.idNumberTooManyLetters');
  }

  // Length: 6–30 characters (including spaces/hyphens)
  const stripped = value.replace(/[\s-]/g, '');
  if (stripped.length < 6) return t('registerValidation.idNumberTooShort');
  if (stripped.length > 30) return t('registerValidation.idNumberTooLong');

  // Reject all same characters (AAAAAA, 111111)
  if (/^([a-zA-Z0-9])\1+$/.test(stripped)) {
    return t('registerValidation.idNumberRepeatedChars');
  }

  // Reject repeating patterns (ABCABC, 121212)
  if (/^(.+)\1+$/.test(stripped)) {
    return t('registerValidation.idNumberPatternRepeat');
  }

  return undefined;
};