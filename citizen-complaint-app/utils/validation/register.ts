export const validateFirstName = (firstName: string): string => {
  const regex = /^[A-Za-z]+([-][A-Za-z]+)*$/; // Allows hyphenated (e.g. Mary-Jane)
  const invalidCharsRegex = /[^A-Za-z-]/; // Only letters and hyphens
  const repeatedCharRegex = /(.)\1{2,}/; // 3+ repeated characters
  const maxLength = 50;
  const minLength = 2;

  if (!firstName || !firstName.trim()) return "First name is required.";

  const trimmed = firstName.trim();

  if (trimmed.length < minLength) return "First name must be at least 2 characters long.";
  if (trimmed.length > maxLength) return `First name must be at most ${maxLength} characters long.`;

  if (invalidCharsRegex.test(trimmed)) return "First name must not contain numbers or special characters.";
  if (!regex.test(trimmed)) return "First name must only contain letters.";
  if (repeatedCharRegex.test(trimmed.toLowerCase())) return "First name must not contain repeated characters.";

  return "";
};

export const validateLastName = (lastName: string): string => {
  const regex = /^[A-Za-z]+([ -][A-Za-z]+)*$/; // Allows hyphenated or spaced (e.g. De La Cruz)
  const invalidCharsRegex = /[^A-Za-z\s-]/; // Only letters, spaces, and hyphens
  const repeatedCharRegex = /(.)\1{2,}/; // 3+ repeated characters
  const maxLength = 50;
  const minLength = 2;

  if (!lastName || !lastName.trim()) return "Last name is required.";

  const trimmed = lastName.trim();

  if (trimmed.length < minLength) return "Last name must be at least 2 characters long.";
  if (trimmed.length > maxLength) return `Last name must be at most ${maxLength} characters long.`;

  if (invalidCharsRegex.test(trimmed)) return "Last name must not contain numbers or special characters.";
  if (!regex.test(trimmed)) return "Last name must only contain letters.";
  if (repeatedCharRegex.test(trimmed.toLowerCase())) return "Last name must not contain repeated characters.";

  return "";
};
export const validateUsername = (username: string) => {
  const minLen = 4;
  const maxLen = 50;

  // Allow spaces now
  const invalidCharsRegex = /[^a-zA-Z0-9._\s]/; // Allow letters, numbers, dots, underscores, spaces
  const consecutiveSymbolsRegex = /[._]{2,}/; // No consecutive dots or underscores
  const startsOrEndsWithSymbol = /^[._]|[._]$/; // Can't start or end with dot or underscore
  const onlyNumbersRegex = /^\d+$/; // Prevent all numbers
  const repeatedCharRegex = /(.)\1{3,}/; // Prevent 4+ same consecutive characters

  if (!username || !username.trim()) 
    return "Username is required.";

  const trimmed = username.trim();

  // Length check
  if (trimmed.length < minLen)
    return `Username must be at least ${minLen} characters long.`;

  if (trimmed.length > maxLen)
    return `Username must be at most ${maxLen} characters long.`;

  // Invalid characters (now allows spaces)
  if (invalidCharsRegex.test(trimmed))
    return "Username can only contain letters, numbers, dots, underscores, or spaces.";

  // Consecutive symbols
  if (consecutiveSymbolsRegex.test(trimmed))
    return "Username cannot contain consecutive dots or underscores.";

  // Start or end with symbol
  if (startsOrEndsWithSymbol.test(trimmed))
    return "Username cannot start or end with a dot or underscore.";

  // Repeated characters (e.g., aaaaa)
  if (repeatedCharRegex.test(trimmed))
    return "Username must not contain long sequences of the same character.";

  // Only numbers
  if (onlyNumbersRegex.test(trimmed))
    return "Username cannot contain only numbers.";

  // ✅ If all checks pass
  return null;
};




export const validateEmail = (email: string) => {
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
 ]
 
     email = email.trim();
 
     if (!email) return "Email is required.";
 
     const localPart = email.split('@')[0];
     if (localPart.length > 64) {
         return "The local part (before the '@') of the email address cannot exceed 64 characters.";
     }
 
     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}(\.[a-z]{2,})?$/;
 
     if (!emailRegex.test(email)) {
         return "Invalid email format. Please enter a valid email address.";
     }
 
     const domain = email.split('@')[1];
 
     // Strict validation to ensure no invalid trailing patterns after valid government email domains
     const isStrictGovPh = validProviders.some(provider => new RegExp(`^${provider}$`).test(domain));
 
     if (!isStrictGovPh) {
         return `Invalid email domain. ${domain} is not a recognized email provider.`;
     }
 
}


export const validateContactNumber = (contactNumber: string): string => {
    if (!contactNumber) return "Contact number is required.";

    const trimmedNumber = contactNumber.trim();

    // Already in '9123456789' format (without leading 0)
    if (/[^0-9]/.test(trimmedNumber)) {
        return "Contact number must not contain letters or special characters.";
    }

    // Must be exactly 10 digits after +63
    if (trimmedNumber.length !== 10) {
        return "Contact number must be a valid Philippine mobile number.";
    }

    // Check for 4 or more repeating digits
    if (/(\d)\1{3,}/.test(trimmedNumber)) {
        return "Contact number must not contain 4 or more repeating digits.";
    }

    return "";
};