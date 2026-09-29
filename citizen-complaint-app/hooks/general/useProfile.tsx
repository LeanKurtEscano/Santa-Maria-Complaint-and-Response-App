import { useState } from 'react';
import { Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { useLocationPermission } from '@/hooks/general/useLocationPermission';
import { userApiClient } from '@/lib/client/user';
import { handleApiError } from '@/utils/general/errorHandler';
import { useTranslation } from 'react-i18next';
import useToast from './useToast';
import { useQueryClient } from '@tanstack/react-query';
import { authApiClient } from '@/lib/client/user';
export const useProfileLogic = () => {
  const { t } = useTranslation();
  const { toastType, toastMessage, showToast, setToastVisible, toastVisible } = useToast();
  const queryClient = useQueryClient();

const [locationError, setLocationError] = useState<string | null>(null);
  const userData = useCurrentUser((s) => s.userData);
const loading = useCurrentUser((s) => s.loading);
const isAuthenticated = useCurrentUser((s) => s.isAuthenticated);
const fetchCurrentUser = useCurrentUser((s) => s.fetchCurrentUser);
const clearUser = useCurrentUser((s) => s.clearUser);
  const { locationLoading, requestLocationPermission } = useLocationPermission();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      console.log('Sending location update:', { latitude, longitude });
      const response = await userApiClient.put('/update-current-location', {
        latitude,
        longitude,
      });
      console.log('Location update response:', response.data);
      return response.data;
    },
    onSuccess: async () => {
      console.log('Location update successful, fetching user data...');
      setShowLocationModal(false);
      setShowMapPicker(false);
      queryClient.invalidateQueries({ queryKey: ['evacuation-centers', 'nearby'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'recent'] });
      showToast(t('profile.location.success.message'), 'success');
      await fetchCurrentUser(true);
    },
    onError: (error) => {
      const httpStatus = (error as any)?.response?.status;
      const detail = (error as any)?.response?.data?.detail;

      if (
        httpStatus === 400 &&
        typeof detail === 'string' &&
        (detail.includes('Location of the complaint must be within Santa Maria, Laguna.') ||
          detail.includes('Coordinates do not match the provided barangay name.'))
      ) {
        Alert.alert(
          'Location not supported',
          'You must be a resident of Santa Maria, Laguna to use this app.',
          [{ text: 'OK' }],
        );
        setShowMapPicker(false);
        setShowLocationModal(false);
        return;
      }

      const appError = handleApiError(error);
      showToast(appError.message, 'error');
      setShowMapPicker(false);
      setShowLocationModal(false);
    },
  });

const handleAllowLocation = async () => {
  setShowLocationModal(false); // close right away, the screen shows the loading state

  const result = await requestLocationPermission();

  if (result.granted && result.latitude != null && result.longitude != null) {
    updateLocationMutation.mutate({
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString(),
    });
    return;
  }

  if (result.reason === 'denied') {
    if (result.canAskAgain === false) {
      setShowMapPicker(true);
    } else {
      showToast(t('profile.location.permissionDenied.tryAgain'), 'error');
    }
    return;
  }

  showToast(
    result.reason === 'services_disabled'
      ? t('profile.location.servicesDisabled')
      : t('profile.location.fetchFailed'),
    'error',
  );
};

  const handleLocationFromMap = async (latitude: number, longitude: number) => {
    updateLocationMutation.mutate({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });

   
  };


// Throws on failure so the screen can show the error inside the logout modal.
const handleLogout = async (): Promise<void> => {
  try {
    // Fail after 10s instead of hanging forever on a slow connection
    await authApiClient.post('/logout-resident', undefined, { timeout: 10000 });
  } catch (error: any) {
    // Session already expired on the server, so treat as logged out
    if (error?.response?.status !== 401) {
      throw error;
    }
  }

  clearUser();

  queryClient.invalidateQueries({
    queryKey: ['announcements', 'recent'],
  });
};

  const hasLocation = userData?.latitude && userData?.longitude;

  return {
    // State
    userData,
    loading,
    hasLocation,
    showLocationModal,
    showMapPicker,
    locationLoading,
    updateLocationMutation,
    isAuthenticated,

    // Actions
    setShowLocationModal,
    setShowMapPicker,
    handleAllowLocation,
    handleLocationFromMap,
    handleLogout,
    fetchCurrentUser,
    toastMessage,
    toastType,
    showToast,
    setToastVisible,
    toastVisible,
  };
};