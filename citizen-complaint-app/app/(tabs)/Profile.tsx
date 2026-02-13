import React, { useState, useEffect } from 'react';
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
import { useCurrentUser } from '@/store/useCurrentUserStore';
import { useLocationPermission } from '@/hooks/general/useLocationPermission';
import { LocationPermissionModal } from '@/components/modals/LocationPermissionModal';
import { LocationPicker } from '@/components/modals/LocationPicker';
import {
  User,
  MapPin,
  Mail,
  Calendar,
  Home,
  CheckCircle,
  AlertCircle,
  Map,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { userData, loading, fetchCurrentUser } = useCurrentUser();
  const { locationLoading, requestLocationPermission } = useLocationPermission();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);



  // Handle location permission from modal (auto-detect)
  const handleAllowLocation = async () => {
    const result = await requestLocationPermission();

    if (result.granted && result.latitude && result.longitude) {
      // Option 1: Save directly
      await saveLocationToBackend(result.latitude, result.longitude);
      
      // Option 2: Show map for fine-tuning
      // setShowLocationModal(false);
      // setShowMapPicker(true);
    }
  };

  // Handle location from map picker (manual pin)
  const handleLocationFromMap = async (latitude: number, longitude: number) => {
    await saveLocationToBackend(latitude, longitude);
    setShowMapPicker(false);
  };

  // Save location to backend
  const saveLocationToBackend = async (latitude: number, longitude: number) => {
    try {
      // TODO: Call API to update user location
      // await userApiClient.patch('/profile/location', {
      //   latitude: latitude,
      //   longitude: longitude,
      // });

      console.log('Location saved:', { latitude, longitude });

      // Refresh user data after updating location
      await fetchCurrentUser();
      
      setShowLocationModal(false);
      
      Alert.alert(
        'Success',
        'Your location has been saved successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert(
        'Error',
        'Failed to save location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Show loading state
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

  // Show error state if no user data
  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <AlertCircle size={48} color="#EF4444" />
          <Text className="text-xl font-bold text-neutral-900 mt-4">
            Failed to Load Profile
          </Text>
          <Text className="text-neutral-600 text-center mt-2">
            Unable to retrieve your profile information.
          </Text>
          <TouchableOpacity
            onPress={fetchCurrentUser}
            className="bg-primary-600 rounded-xl px-6 py-3 mt-6"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
                    className="bg-amber-600 rounded-lg py-2.5 items-center flex-row justify-center"
                    activeOpacity={0.8}
                  >
                    <MapPin size={16} color="#fff" />
                    <Text className="text-white font-semibold text-sm ml-2">
                      Auto-Detect Location
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowMapPicker(true)}
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
                
                {/* Show coordinates */}
                <View className="bg-white rounded-lg p-3 mb-2">
                  <Text className="text-xs text-neutral-500 mb-1">Coordinates:</Text>
                  <Text className="text-xs text-neutral-700 font-mono">
                    Lat: {userData.latitude.toFixed(6)}
                  </Text>
                  <Text className="text-xs text-neutral-700 font-mono">
                    Lng: {userData.longitude.toFixed(6)}
                  </Text>
                </View>

                {/* Update Location Button */}
                <TouchableOpacity
                  onPress={() => setShowMapPicker(true)}
                  className="bg-green-100 border border-green-300 rounded-lg py-2 items-center flex-row justify-center"
                  activeOpacity={0.8}
                >
                  <Map size={14} color="#059669" />
                  <Text className="text-green-700 font-medium text-xs ml-2">
                    Update Location
                  </Text>
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
      </ScrollView>

      {/* Location Permission Modal (Auto-Detect) */}
      <LocationPermissionModal
        visible={showLocationModal}
        loading={locationLoading}
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