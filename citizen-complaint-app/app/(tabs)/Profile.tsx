import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { useLocationPermission } from '@/hooks/general/useLocationPermission';
import { LocationPermissionModal } from '@/components/modals/LocationPermissionModal';
import { LocationPicker } from '@/components/modals/LocationPicker';
import { userApiClient } from '@/lib/client/user';
import ErrorScreen from '@/screen/general/ErrorScreen';
import { handleApiError } from '@/utils/general/errorHandler';
import {
  User,
  MapPin,
  Mail,
  Calendar,
  Home,
  CheckCircle,
  AlertCircle,
  Map,
  LogOut,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { userData, loading, fetchCurrentUser } = useCurrentUser();
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
        'Success',
        'Your location has been saved successfully!',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      const appError = handleApiError(error);
      
      console.error('Error saving location:', appError);
      
      Alert.alert(
        'Error',
        appError.message,
        [{ text: 'OK' }]
      );
    },
  });

  // Handle location permission from modal (auto-detect)
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
        'Permission Denied',
        'Location permission was denied. You can still set your location manually using the map.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Use Map', 
            onPress: () => setShowMapPicker(true)
          }
        ]
      );
    }
  };

  // Handle location from map picker (manual pin)
  const handleLocationFromMap = async (latitude: number, longitude: number) => {
    updateLocationMutation.mutate({ latitude: latitude.toString(), longitude: longitude.toString() });
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement your logout logic here
            // Example:
            // await logoutUser();
            // navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            console.log('Logout pressed - implement your logout logic');
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-neutral-600 mt-4">Loading profile...</Text>
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
        title="Failed to Load Profile"
        message="Unable to retrieve your profile information."
        onRetry={fetchCurrentUser}
      />
    );
  }

  const hasLocation = userData.latitude && userData.longitude;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-6 pb-12">
          <Text className="text-white text-2xl font-bold">My Profile</Text>
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
                <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center">
                  <User size={40} color="#2563EB" />
                </View>
              )}
              <Text className="text-xl font-bold text-neutral-900 mt-4">
                {userData.first_name} {userData.last_name}
              </Text>
              <Text className="text-neutral-600 text-sm mt-1">{userData.email}</Text>
            </View>

            {/* Location Status */}
            {!hasLocation && (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <AlertCircle size={20} color="#F59E0B" />
                  <View className="flex-1 ml-3">
                    <Text className="text-amber-900 font-semibold text-sm">
                      Location Required
                    </Text>
                    <Text className="text-amber-700 text-xs mt-1">
                      Enable location access to file complaints in your area.
                    </Text>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View className="mt-3 gap-2">
                  <TouchableOpacity
                    onPress={() => setShowLocationModal(true)}
                    disabled={updateLocationMutation.isPending}
                    className={`rounded-lg py-2.5 items-center flex-row justify-center ${
                      updateLocationMutation.isPending 
                        ? 'bg-amber-400' 
                        : 'bg-amber-600'
                    }`}
                    activeOpacity={0.8}
                  >
                    {updateLocationMutation.isPending ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="text-white font-semibold text-sm ml-2">
                          Saving...
                        </Text>
                      </>
                    ) : (
                      <>
                        <MapPin size={16} color="#fff" />
                        <Text className="text-white font-semibold text-sm ml-2">
                          Auto-Detect Location
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowMapPicker(true)}
                    disabled={updateLocationMutation.isPending}
                    className="bg-white border border-amber-600 rounded-lg py-2.5 items-center flex-row justify-center"
                    activeOpacity={0.8}
                  >
                    <Map size={16} color="#D97706" />
                    <Text className="text-amber-600 font-semibold text-sm ml-2">
                      Pin on Map
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {hasLocation && (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-center mb-2">
                  <CheckCircle size={20} color="#10B981" />
                  <Text className="text-green-900 font-semibold text-sm ml-2">
                    Location Enabled
                  </Text>
                </View>
                <Text className="text-green-700 text-xs mb-3">
                  You can now file complaints in your area.
                </Text>

                {/* Update Location Button */}
                <TouchableOpacity
                  onPress={() => setShowMapPicker(true)}
                  disabled={updateLocationMutation.isPending}
                  className="bg-green-100 border border-green-300 rounded-lg py-2 items-center flex-row justify-center"
                  activeOpacity={0.8}
                >
                  {updateLocationMutation.isPending ? (
                    <>
                      <ActivityIndicator size="small" color="#059669" />
                      <Text className="text-green-700 font-medium text-xs ml-2">
                        Updating...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Map size={14} color="#059669" />
                      <Text className="text-green-700 font-medium text-xs ml-2">
                        Update Location
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Personal Information */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-neutral-900 mb-4">
            Personal Information
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            {/* Email */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Mail size={16} color="#6B7280" />
                <Text className="text-xs font-medium text-neutral-500 ml-2">
                  EMAIL
                </Text>
              </View>
              <Text className="text-base text-neutral-900">{userData.email}</Text>
            </View>

            {/* Divider */}
            <View className="h-px bg-neutral-200 my-4" />

            {/* Full Name */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <User size={16} color="#6B7280" />
                <Text className="text-xs font-medium text-neutral-500 ml-2">
                  FULL NAME
                </Text>
              </View>
              <Text className="text-base text-neutral-900">
                {userData.first_name} {userData.last_name}
              </Text>
            </View>

            {/* Divider */}
            <View className="h-px bg-neutral-200 my-4" />

            {/* Age */}
            {userData.age && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Calendar size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      AGE
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">
                    {userData.age} years old
                  </Text>
                </View>

                {/* Divider */}
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {/* Gender */}
            {userData.gender && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <User size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      GENDER
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900 capitalize">
                    {userData.gender}
                  </Text>
                </View>

                {/* Divider */}
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {/* Barangay */}
            {userData.barangay && (
              <>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="text-xs font-medium text-neutral-500 ml-2">
                      BARANGAY
                    </Text>
                  </View>
                  <Text className="text-base text-neutral-900">
                    {userData.barangay}
                  </Text>
                </View>

                {/* Divider */}
                <View className="h-px bg-neutral-200 my-4" />
              </>
            )}

            {/* Full Address */}
            {userData.full_address && (
              <View>
                <View className="flex-row items-center mb-2">
                  <Home size={16} color="#6B7280" />
                  <Text className="text-xs font-medium text-neutral-500 ml-2">
                    FULL ADDRESS
                  </Text>
                </View>
                <Text className="text-base text-neutral-900">
                  {userData.full_address}
                  {userData.zip_code && `, ${userData.zip_code}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Account Information */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-neutral-900 mb-4">
            Account Information
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            {/* Role */}
            <View className="mb-4">
              <Text className="text-xs font-medium text-neutral-500 mb-2">
                ACCOUNT ROLE
              </Text>
              <Text className="text-base text-neutral-900 capitalize">
                {userData.role}
              </Text>
            </View>

            {/* Divider */}
            <View className="h-px bg-neutral-200 my-4" />

            {/* Created At */}
            {userData.created_at && (
              <View>
                <Text className="text-xs font-medium text-neutral-500 mb-2">
                  MEMBER SINCE
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

        {/* Logout Button */}
        <View className="px-6 mt-6 mb-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-xl py-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#DC2626" />
            <Text className="text-red-600 font-semibold text-base ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Permission Modal (Auto-Detect) */}
      <LocationPermissionModal
        visible={showLocationModal}
        loading={locationLoading || updateLocationMutation.isPending}
        onAllow={handleAllowLocation}
        onCancel={() => setShowLocationModal(false)}
      />

      {/* Map-Based Location Picker (Manual Pin) */}
      <LocationPicker
        visible={showMapPicker}
        initialLatitude={userData.latitude}
        initialLongitude={userData.longitude}
        onConfirm={handleLocationFromMap}
        onCancel={() => setShowMapPicker(false)}
      />
    </SafeAreaView>
  );
}