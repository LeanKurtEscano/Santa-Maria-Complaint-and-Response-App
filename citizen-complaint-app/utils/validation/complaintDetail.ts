// ─── validateComplaintDetails ────────────────────────────────────────────────
// Drop this into your useComplaintForm hook (or wherever you call onNext).
// Re-export the constants so the parent and FormStep stay in sync.

import { COMPLAINT_DETAILS_MAX_LENGTH,COMPLAINT_DETAILS_MIN_LENGTH } from "@/components/complaint/complaint-proccess/FormStep";

export function validateComplaintDetails(message: string): string | null {
  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return 'Please describe your complaint before continuing.';
  }

  if (trimmed.length < COMPLAINT_DETAILS_MIN_LENGTH) {
    const remaining = COMPLAINT_DETAILS_MIN_LENGTH - trimmed.length;
    return `Description is too short — add at least ${remaining} more character${remaining !== 1 ? 's' : ''} to help us understand the issue.`;
  }

  if (trimmed.length > COMPLAINT_DETAILS_MAX_LENGTH) {
    // Should not happen due to maxLength prop, but guard anyway.
    return `Description must not exceed ${COMPLAINT_DETAILS_MAX_LENGTH} characters.`;
  }

  return null;
}

// ─── Usage in your hook ───────────────────────────────────────────────────────
//
//  const [message, setMessage] = useState('');
//  const [messageError, setMessageError] = useState('');
//  const [messageWasTouched, setMessageWasTouched] = useState(false);
//
//  function handleNext() {
//    setMessageWasTouched(true);
//    const error = validateComplaintDetails(message);
//    if (error) {
//      setMessageError(error);
//      return;           // block navigation
//    }
//    setMessageError('');
//    router.push('/next-step');
//  }
//
//  // Pass to FormStep:
//  <FormStep
//    ...
//    message={message}
//    messageError={messageError}
//    onChangeMessage={(text) => {
//      setMessage(text);
//      if (messageWasTouched) {
//        setMessageError(validateComplaintDetails(text) ?? '');
//      }
//    }}
//    messageWasTouched={messageWasTouched}
//    onMessageBlur={() => {
//      setMessageWasTouched(true);
//      setMessageError(validateComplaintDetails(message) ?? '');
//    }}
//    onNext={handleNext}
//  />