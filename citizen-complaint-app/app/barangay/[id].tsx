/**
 * ComplaintFormScreen.tsx  — parent / orchestrator
 *
 * Owns ALL shared state and passes slices down to each step.
 * Steps are pure presentational components; they call callbacks,
 * never touch state directly.
 *
 * Flow:
 *   instructions  →  form  →  location  →  preview (ComplaintLetterPreview)  →  submit
 */

import GeneralToast from '@/components/Toast/GeneralToast';
import { Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAttachments } from '@/hooks/general/useAttachment';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { PRESET_TITLE_KEYS, OTHER_KEY, PresetTitle } from '@/constants/localization/complaint-title-key';
import { getBarangayCoords,DEFAULT_COORDS } from '@/constants/general/barangay';
import ComplaintLetterPreview from '@/components/letter-preview/ComplaintLetterPreview';
import { complaintApiClient } from '@/lib/client/complaint';
import { askForNotificationPermission } from '@/hooks/general/usePushNotifications';
import { InstructionsStep } from '@/components/complaint/complaint-proccess/InstructionStep';
import { FormStep } from '@/components/complaint/complaint-proccess/FormStep';
import { LocationStep } from '@/components/complaint/complaint-proccess/LocationStep';
import { COMPLAINT_DETAILS_MAX_LENGTH, COMPLAINT_DETAILS_MIN_LENGTH } from '@/components/complaint/complaint-proccess/FormStep';
import useToastStore from '@/store/useGlobalModal';
import { userApiClient } from '@/lib/client/user';
// ─── Step type ────────────────────────────────────────────────────────────────
type Step = 'instructions' | 'form' | 'location';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ComplaintFormScreen() {
  const { t } = useTranslation();
  const { userData, fetchCurrentUser } = useCurrentUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  // ── Route params ────────────────────────────────────────────────────────────
  const barangayName     = (params.barangayName as string) || 'Barangay';
  console.log('Received route params:', params)
  const barangayId       = params.id as string;
  const barangayAccountId = params.barangayAccountId as string;

  // Resolve barangay map centre from constants (no need to pass lat/lng in params)
  const { lat: barangayLat, lng: barangayLng } =
    getBarangayCoords(barangayName) ?? DEFAULT_COORDS;

  // ── Step ────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('instructions');
  const { showToast:showGlobalToast } = useToastStore();
  // ── Title / category ────────────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset]   = useState<PresetTitle | null>(null);
  const [customTitle, setCustomTitle]         = useState('');
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [titleError, setTitleError]           = useState('');

  // ── Message ─────────────────────────────────────────────────────────────────
  const [message, setMessage]           = useState('');
  const [messageError, setMessageError] = useState('');
  const [messageWasTouched, setMessageWasTouched] = useState(false);
  // ── Submission ──────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview]   = useState(false);

  // ── Incident location (set in LocationStep) ──────────────────────────────────
  const [incidentLocation, setIncidentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ── Attachments hook ────────────────────────────────────────────────────────
  const {
    attachments,
    isPickingFile,
    showAttachmentModal,
    setShowAttachmentModal,
    handlePickImage,
    handlePickVideo,
    handlePickDocument,
    handleRemoveAttachment,
    formatFileSize,
    resetAttachments,
    showToast,
    setToastVisible,
    toastVisible,
    toastMessage,
    toastType,
  } = useAttachments();

  // ── Refresh user on focus ────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => { fetchCurrentUser(true); }, [])
  );

  // ── Derived values ───────────────────────────────────────────────────────────
  const isOtherSelected   = selectedPreset?.key === OTHER_KEY;
  const resolvedTitle     = isOtherSelected
    ? customTitle.trim()
    : selectedPreset?.key ? t(selectedPreset.key) : '';
  const resolvedCategoryId = selectedPreset?.category_id ?? null;
  const hasProfileLocation = !!(userData?.latitude && userData?.longitude);

  // ── Handlers: title ──────────────────────────────────────────────────────────
  const handleSelectPreset = (preset: PresetTitle) => {
    setSelectedPreset(preset);
    setTitleError('');
    if (preset.key !== OTHER_KEY) setCustomTitle('');
    setShowTitlePicker(false);
  };

  const handleChangeCustomTitle = (text: string) => {
    setCustomTitle(text);
    if (text.trim().length >= 3) setTitleError('');
  };

  // ── Handlers: message ────────────────────────────────────────────────────────
  const handleChangeMessage = (text: string) => {
    setMessage(text);
    if (text.trim()) setMessageError('');
  };

 // ── Validation ───────────────────────────────────────────────────────────────
const validateForm = (): boolean => {
  let valid = true;
  if (!resolvedTitle) {
    setTitleError(t('complaint_form.error.title_required'));
    valid = false;
  } else if (isOtherSelected && customTitle.trim().length < 3) {
    setTitleError(t('complaint_form.error.title_too_short'));
    valid = false;
  } else {
    setTitleError('');
  }

  if (!message.trim()) {
    setMessageError(t('complaint_form.error.details_required'));
    valid = false;
  } else if (message.trim().length < COMPLAINT_DETAILS_MIN_LENGTH) {
    setMessageError(`Description must be at least ${COMPLAINT_DETAILS_MIN_LENGTH} characters long.`);
    valid = false;
  } else if (message.trim().length > COMPLAINT_DETAILS_MAX_LENGTH) {
    setMessageError(`Description must not exceed ${COMPLAINT_DETAILS_MAX_LENGTH} characters.`);
    valid = false;
  } else {
    setMessageError('');
  }

  // ← remove the stray setMessageError('') that was here
  return valid;
};
  // ── Form "Next" → location step ──────────────────────────────────────────────
  const handleFormNext = () => {
    if (!validateForm()) return;

    if (!hasProfileLocation) {
      Alert.alert(
        'Location Required',
        'You need to set your location in your profile before submitting a complaint.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => router.push('/(tabs)/Profile') },
        ]
      );
      return;
    }

    setStep('location');
  };

  // ── Location confirmed → open preview ────────────────────────────────────────
  const handleLocationConfirm = (lat: number, lng: number) => {
    setIncidentLocation({ latitude: lat, longitude: lng });
    setShowPreview(true);
  };

  // ── Final submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!incidentLocation) {
        showToast('Location unavailable. Please go back and try again.', 'error');
        return;
      }

      const parsedBarangayId       = parseInt(barangayId, 10);
      const parsedBarangayAccountId = barangayAccountId ? parseInt(barangayAccountId, 10) : null;

      if (isNaN(parsedBarangayId)) {
        showToast('Invalid barangay. Please go back and try again.', 'error');
        return;
      }
      if (!resolvedCategoryId) {
        showToast('Please select a complaint category.', 'error');
        return;
      }

      const complaintData = {
        title:               resolvedTitle,
        description:         message,
        barangay_id:         parsedBarangayId,
        barangay_account_id: parsedBarangayAccountId,
        latitude:            incidentLocation.latitude,
        longitude:           incidentLocation.longitude,
        category_id:         resolvedCategoryId,
      };


      console.log('Submitting complaint with data:', complaintData, 'and attachments:', attachments);

      const formData = new FormData();
      formData.append('data', JSON.stringify(complaintData));

      for (const attachment of attachments) {
        formData.append('attachments', {
          uri:  attachment.uri,
          name: attachment.name,
          type: attachment.mimeType || 'application/octet-stream',
        } as any);
      }

      const response = await complaintApiClient.post('/submit-complaint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

       if (response.status === 201) {
    showGlobalToast('Complaint submitted successfully!', 'success');
    resetAttachments();
    setSelectedPreset(null);
    setCustomTitle('');
    setMessage('');
    setIncidentLocation(null);
    setShowPreview(false);

    if(!userData?.push_notifications_enabled) { 
       // Don't prompt if user has already disabled notifications
    Alert.alert(
      '🔔 Stay Updated',
      'Do you want to receive notifications about your complaint status?',
      [
        {
          text: 'No Thanks',
          style: 'cancel',
          onPress: () => router.replace('/(tabs)/Complaints'),
        },
        {
          text: 'Yes, Notify Me',
          onPress: async () => {
            try {
              const token = await askForNotificationPermission(); // ← just call it here
              if (!token) {
                showGlobalToast('Permission denied for notifications.', 'error');
                router.push('/(tabs)/Complaints');
                return;
              }
              await userApiClient.post('/push-token', { token });
              await userApiClient.post('/enable-push-notifications', { enabled: true });
              fetchCurrentUser(true); // Refresh user data to update notification preference in store
              showGlobalToast('Notifications enabled!', 'success');
            } catch (err) {
              showGlobalToast('Failed to enable notifications.', 'error');
            } finally {
              router.replace('/(tabs)/Complaints');
            }
          },
        },
      ]
    );
  } else {
    router.replace('/(tabs)/Complaints');
  }
}
    } catch (error: any) {
      // Stay on the preview screen — just show the toast so the user
      // can retry without losing their filled-in form or pinned location.
      const detail = error?.response?.data?.detail;
      showToast(detail ?? 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
      // NOTE: setShowPreview(false) intentionally NOT called here.
      // The preview only closes on success (above) or when the user taps Back.
    }
  };

  // ── Render: preview ───────────────────────────────────────────────────────────
  if (showPreview) {
    return (
      <>
        <ComplaintLetterPreview
          barangayName={barangayName}
          title={resolvedTitle}
          message={message}
          attachments={attachments}
          onConfirmSubmit={handleSubmit}
          onBack={() => {
            setShowPreview(false);
            setStep('location');
          }}
          isSubmitting={isSubmitting}
          toastVisible={toastVisible}
          setToastVisible={setToastVisible}
          toastMessage={toastMessage}
          toastType={toastType}
        />
        <GeneralToast
          visible={toastVisible}
          onHide={() => setToastVisible(false)}
          message={toastMessage}
          type={toastType}
        />
      </>
    );
  }

  // ── Render: steps ─────────────────────────────────────────────────────────────
  if (step === 'instructions') {
    return (
      <InstructionsStep
        barangayName={barangayName}
        onProceed={() => setStep('form')}
        onBack={() => router.back()}
      />
    );
  }

  if (step === 'location') {
    return (
      <LocationStep
        barangayName={barangayName}
        barangayLat={barangayLat}
        barangayLng={barangayLng}
        onConfirm={handleLocationConfirm}
        onBack={() => setStep('form')}
      />
    );
  }

  // step === 'form'
  return (
    <>
      <FormStep
        barangayName={barangayName}
        hasProfileLocation={hasProfileLocation}
        selectedPreset={selectedPreset}
        customTitle={customTitle}
        titleError={titleError}
        showTitlePicker={showTitlePicker}
        onOpenTitlePicker={() => setShowTitlePicker(true)}
        onCloseTitlePicker={() => setShowTitlePicker(false)}
        onSelectPreset={handleSelectPreset}
        onChangeCustomTitle={handleChangeCustomTitle}
        message={message}
        messageError={messageError}
        onChangeMessage={handleChangeMessage}
        attachments={attachments}
        isPickingFile={isPickingFile}
        showAttachmentModal={showAttachmentModal}
        onOpenAttachmentModal={() => setShowAttachmentModal(true)}
        onCloseAttachmentModal={() => setShowAttachmentModal(false)}
        onPickImage={handlePickImage}
        onPickVideo={handlePickVideo}
        onPickDocument={handlePickDocument}
        onRemoveAttachment={handleRemoveAttachment}
        formatFileSize={formatFileSize}
        onBack={() => setStep('instructions')}
        onNext={handleFormNext}
      />
      <GeneralToast
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        message={toastMessage}
        type={toastType}
      />
    </>
  );
}