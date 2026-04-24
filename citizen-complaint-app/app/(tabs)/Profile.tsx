import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LocationPermissionModal } from '@/components/modals/LocationPermissionModal';
import { LocationPicker } from '@/components/modals/LocationPicker';
import { LocationCard } from '@/components/location/Locationcard';
import ErrorScreen from '@/screen/general/ErrorScreen';
import { handleApiError } from '@/utils/general/errorHandler';
import { useProfileLogic } from '@/hooks/general/useProfile';
import {
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Home,
  CheckCircle,
  AlertCircle,
  Map,
  LogOut,
  Settings,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import GeneralToast from '@/components/Toast/GeneralToast';
import { formatName } from '@/utils/general/name';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// LogoutConfirmModal
// ---------------------------------------------------------------------------
interface LogoutConfirmModalProps {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function LogoutConfirmModal({
  visible,
  loading = false,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        {/* Card — stop event propagation so taps inside don't close the modal */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            width: '100%',
            backgroundColor: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Icon strip */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 28,
              paddingBottom: 16,
              backgroundColor: '#FEF2F2',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={28} color="#DC2626" />
            </View>
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#111827',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {t('profile.logout.confirmTitle', { defaultValue: 'Log out of your account?' })}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {t('profile.logout.confirmMessage', {
                defaultValue:
                  'You will need to sign in again to access your account.',
              })}
            </Text>
          </View>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: 24,
              paddingVertical: 20,
            }}
          >
            {/* Cancel */}
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>
                {t('profile.logout.cancel', { defaultValue: 'Cancel' })}
              </Text>
            </TouchableOpacity>

            {/* Confirm */}
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: loading ? '#FCA5A5' : '#DC2626',
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LogOut size={16} color="#fff" />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
                {loading
                  ? t('profile.logout.loggingOut', { defaultValue: 'Logging out…' })
                  : t('profile.logout.confirm', { defaultValue: 'Log out' })}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();

  // Local state for the logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const {
    userData,
    loading,
    hasLocation,
    showLocationModal,
    showMapPicker,
    locationLoading,
    updateLocationMutation,
    setShowLocationModal,
    setShowMapPicker,
    handleAllowLocation,
    handleLocationFromMap,
    handleLogout,
    fetchCurrentUser,
    toastType,
    toastMessage,
    setToastVisible,
    toastVisible,
  } = useProfileLogic();

  // Wrap the original handleLogout so we can show a loading state and close the modal
  const handleLogoutConfirmed = async () => {
    try {
      setLogoutLoading(true);
      await handleLogout(); // now just clears token + user, no Alert inside
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text className="text-neutral-600 mt-4">{t('profile.loadingProfile')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    const error = new Error('Failed to load profile');
    const appError = handleApiError(error);
    return (
      <ErrorScreen
        type={appError.type}
        title={t('profile.failedToLoad')}
        message={t('profile.unableToRetrieve')}
        onRetry={fetchCurrentUser}
      />
    );
  }

  const displayIdentifier = userData.email?.trim() || userData.phone_number?.trim() || null;
  const fullName = [userData.first_name, userData.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ backgroundColor: THEME.primary }} className="px-6 pt-6 pb-12">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">{t('profile.title')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/settings')}
              className="bg-white/20 rounded-full p-2"
              activeOpacity={0.7}
            >
              <Settings size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View className="px-6 -mt-8">
          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            {/* Profile Image */}
            <View className="items-center mb-6">
              {userData.profile_image ? (
                <Image
                  source={{ uri: userData.profile_image }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View
                  style={{ backgroundColor: THEME.primary + '1A' }}
                  className="w-24 h-24 rounded-full items-center justify-center"
                >
                  <User size={40} color={THEME.primary} />
                </View>
              )}

              {!!fullName && (
                <Text className="text-xl font-bold text-neutral-900 mt-4">
                  {formatName(fullName)}
                </Text>
              )}

              {!!displayIdentifier && (
                <Text className="text-neutral-600 text-sm mt-1">{displayIdentifier}</Text>
              )}
            </View>

            {/* Location Status — Not Enabled */}
            {!hasLocation && (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <AlertCircle size={20} color="#F59E0B" />
                  <View className="flex-1 ml-3">
                    <Text className="text-amber-900 font-semibold text-sm">
                      {t('profile.location.required')}
                    </Text>
                    <Text className="text-amber-700 text-xs mt-1">
                      {t('profile.location.requiredMessage')}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 gap-2">
                  <TouchableOpacity
                    onPress={() => setShowLocationModal(true)}
                    disabled={updateLocationMutation.isPending}
                    style={{
                      backgroundColor: updateLocationMutation.isPending
                        ? THEME.primary + 'AA'
                        : THEME.primary,
                    }}
                    className="rounded-lg py-2.5 items-center flex-row justify-center"
                    activeOpacity={0.8}
                  >
                    {updateLocationMutation.isPending ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="text-white font-semibold text-sm ml-2">
                          {t('profile.location.saving')}
                        </Text>
                      </>
                    ) : (
                      <>
                        <MapPin size={16} color="#fff" />
                        <Text className="text-white font-semibold text-sm ml-2">
                          {t('profile.location.autoDetect')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowMapPicker(true)}
                    disabled={updateLocationMutation.isPending}
                    style={{ borderColor: THEME.primary }}
                    className="bg-white border rounded-lg py-2.5 items-center flex-row justify-center"
                    activeOpacity={0.8}
                  >
                    <Map size={16} color={THEME.primary} />
                    <Text
                      style={{ color: THEME.primary }}
                      className="font-semibold text-sm ml-2"
                    >
                      {t('profile.location.pinOnMap')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Location Status — Enabled */}
            {hasLocation && (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-center mb-2">
                  <CheckCircle size={20} color="#10B981" />
                  <Text className="text-green-900 font-semibold text-sm ml-2">
                    {t('profile.location.enabled')}
                  </Text>
                </View>
                <Text className="text-green-700 text-xs">
                  {t('profile.location.enabledMessage')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Location Map Card */}
        {hasLocation && (
          <View className="px-6 mt-6">
            <Text className="text-lg font-bold text-neutral-900 mb-4">
              {t('profile.location.myLocation')}
            </Text>
            <LocationCard
              latitude={userData.latitude}
              longitude={userData.longitude}
              onUpdatePress={() => setShowMapPicker(true)}
              updateLabel={t('profile.location.updateLocation')}
            />
          </View>
        )}

        {/* Personal Information */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-neutral-900 mb-4">
            {t('profile.personalInfo.title')}
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            {!!userData.email?.trim() && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Mail size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      {t('profile.personalInfo.email')}
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">{userData.email}</Text>
                </View>
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {!!userData.phone_number?.trim() && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Phone size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      {t('profile.personalInfo.phoneNumber')}
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">{userData.phone_number}</Text>
                </View>
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {!!fullName && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <User size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      {t('profile.personalInfo.fullName')}
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">{formatName(fullName)}</Text>
                </View>
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {!!userData.age && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Calendar size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      {t('profile.personalInfo.age')}
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">
                    {userData.age} {t('profile.personalInfo.yearsOld')}
                  </Text>
                </View>
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {!!userData.gender?.trim() && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <User size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      {t('profile.personalInfo.gender')}
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900 capitalize">
                    {userData.gender}
                  </Text>
                </View>
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {!!userData.barangay?.trim() && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      {t('profile.personalInfo.barangay')}
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">{userData.barangay}</Text>
                </View>
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {!!userData.full_address?.trim() && (
              <View>
                <View className="flex-row items-center mb-2">
                  <Home size={16} color="#6B7280" />
                  <Text className="text-xs font-medium text-neutral-500 ml-2">
                    {t('profile.personalInfo.fullAddress')}
                  </Text>
                </View>
                <Text className="text-base text-neutral-900">
                  {userData.full_address}
                  {!!userData.zip_code?.trim() && `, ${userData.zip_code}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Account Information */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-neutral-900 mb-4">
            {t('profile.accountInfo.title')}
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            {!!userData.created_at && (
              <View>
                <Text className="text-xs font-medium text-neutral-500 mb-2">
                  {t('profile.accountInfo.memberSince')}
                </Text>
                <Text className="text-base text-neutral-900">
                  {new Date(userData.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Logout Button — now opens the confirmation modal */}
        <View className="px-6 mt-6 mb-6">
          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            className="bg-red-50 border border-red-200 rounded-xl py-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#DC2626" />
            <Text className="text-red-600 font-semibold text-base ml-2">
              {t('profile.logout.title')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        loading={locationLoading || updateLocationMutation.isPending}
        onAllow={handleAllowLocation}
        onCancel={() => setShowLocationModal(false)}
      />

      {/* Map Picker Modal */}
      <LocationPicker
        visible={showMapPicker}
        initialLatitude={userData.latitude ? parseFloat(userData.latitude) : undefined}
        initialLongitude={userData.longitude ? parseFloat(userData.longitude) : undefined}
        onConfirm={handleLocationFromMap}
        onCancel={() => setShowMapPicker(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onConfirm={handleLogoutConfirmed}
        onCancel={() => !logoutLoading && setShowLogoutModal(false)}
      />

      <GeneralToast
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        message={toastMessage}
        type={toastType}
      />
    </SafeAreaView>
  );
}