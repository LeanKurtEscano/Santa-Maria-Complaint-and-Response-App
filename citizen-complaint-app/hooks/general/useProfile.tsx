import { useState } from 'react';
import { Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { useLocationPermission } from '@/hooks/general/useLocationPermission';
import { userApiClient } from '@/lib/client/user';
import { handleApiError } from '@/utils/general/errorHandler';
import * as secureStorage from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import useToast from './useToast';
export const useProfileLogic = () => {
  const { t } = useTranslation();
  const { toastType,toastMessage, showToast, setToastVisible,toastVisible } = useToast();

  const { userData, loading, fetchCurrentUser, clearUser } = useCurrentUser();
  const { locationLoading, requestLocationPermission } = useLocationPermission();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      const response = await userApiClient.put('/update-current-location', {
        latitude,
        longitude,
      });
      return response.data;
    },
    onSuccess: async () => {
      await fetchCurrentUser();

      setShowLocationModal(false);
      setShowMapPicker(false);

      Alert.alert(
        t('profile.location.success.title'),
        t('profile.location.success.message'),
        [{ text: t('common.ok') }]
      );
    },
    onError: (error) => {
      const appError = handleApiError(error);
      showToast(appError.message, 'error');
      setShowMapPicker(false);
      setShowLocationModal(false);
     
      
      
    },
  });

  const handleAllowLocation = async () => {
    const result = await requestLocationPermission();

    if (result.granted && result.latitude && result.longitude) {
      updateLocationMutation.mutate({
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString(),
      });
    } else if (!result.granted) {
      setShowLocationModal(false);

      Alert.alert(
        t('profile.location.permissionDenied.title'),
        t('profile.location.permissionDenied.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('profile.location.useMap'),
            onPress: () => setShowMapPicker(true)
          }
        ]
      );
    }
  };

  const handleLocationFromMap = async (latitude: number, longitude: number) => {
    updateLocationMutation.mutate({ 
      latitude: latitude.toString(), 
      longitude: longitude.toString() 
    });
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout.title'),
      t('profile.logout.confirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.logout.title'),
          style: 'destructive',
          onPress: async () => {
            await secureStorage.deleteItemAsync('complaint_token');
            clearUser();
          },
        },
      ],
      { cancelable: true }
    );
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
    toastVisible
  };
};