/**
 * IMPORTANT: Add these permissions to your app.json or app.config.js:
 * 
 * For iOS (in "ios" section):
 * "infoPlist": {
 *   "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to attach images to complaints.",
 *   "NSCameraUsageDescription": "This app needs access to your camera to take photos for complaints."
 * }
 * 
 * For Android (in "android" section):
 * "permissions": [
 *   "READ_EXTERNAL_STORAGE",
 *   "WRITE_EXTERNAL_STORAGE",
 *   "CAMERA"
 * ]
 */

import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Upload, FileText, Video, Image as ImageIcon, ArrowLeft } from 'lucide-react-native';
import { useAttachments,Attachment } from '@/hooks/general/useAttachment';

export default function ComplaintFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const barangayName = params.barangayName as string || 'Barangay';
  const barangayId = params.id as string;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  
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
  } = useAttachments();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a complaint title');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Required Field', 'Please enter a complaint message');
      return;
    }

    setIsSubmitting(true);

  
    console.log('Submitting complaint:', {
      barangayId,
      title,
      message,
      attachments
    });


    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        'Your complaint has been submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              resetAttachments();
              router.back();
            }
          }
        ]
      );
    }, 1000);
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} color="#3B82F6" />;
      case 'video':
        return <Video size={20} color="#3B82F6" />;
      default:
        return <FileText size={20} color="#3B82F6" />;
    }
  };

  const renderAttachment = (attachment: Attachment) => {
    return (
      <View
        key={attachment.id}
        className="bg-white border border-gray-200 rounded-xl p-3 mb-2 flex-row items-center"
      >
        <View className="bg-blue-50 p-2 rounded-lg mr-3">
          {getAttachmentIcon(attachment.type)}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {attachment.name}
          </Text>
          {attachment.size && (
            <Text className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveAttachment(attachment.id)}
          className="p-2 bg-red-50 rounded-lg ml-2"
        >
          <X size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-2 -ml-2"
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">
            New Complaint
          </Text>
          <Text className="text-sm text-blue-600">
            {barangayName}
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Complaint Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a brief title for your complaint"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
          <Text className="text-xs text-gray-500 mt-1 text-right">
            {title.length}/100
          </Text>
        </View>

        {/* Message Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Complaint Details <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your complaint in detail..."
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[160px]"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/1000
          </Text>
        </View>

        {/* Attachments Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Attachments (Optional)
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            You can attach up to 3 files (photos, videos, or documents)
          </Text>

          {/* Attachment List */}
          {attachments.map((attachment) => renderAttachment(attachment))}

          {/* Add Attachment Button */}
          {attachments.length < 3 && (
            <TouchableOpacity
              onPress={() => setShowAttachmentModal(true)}
              className="bg-white border-2 border-dashed border-blue-300 rounded-xl py-6 items-center justify-center"
            >
              <View className="bg-blue-50 p-3 rounded-full mb-2">
                <Upload size={24} color="#3B82F6" />
              </View>
              <Text className="text-blue-600 font-semibold text-sm">
                Add Attachment
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                {attachments.length}/3 files attached
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Information Box */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-sm text-blue-900 font-semibold mb-1">
            Please Note
          </Text>
          <Text className="text-xs text-blue-800 leading-5">
            • Your complaint will be reviewed by the barangay office{'\n'}
            • You will receive updates on your complaint status{'\n'}
            • Please provide accurate and detailed information
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`py-4 rounded-xl items-center justify-center ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'
          }`}
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white font-semibold text-base">
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attachment Type Modal */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowAttachmentModal(false)}
        >
          <Pressable 
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">
                  Add Attachment
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAttachmentModal(false)}
                  className="p-2 -mr-2"
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                Choose the type of file you want to attach
              </Text>
            </View>

            {/* Modal Options */}
            <View className="px-4 py-4">
              {/* Photo Option */}
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-blue-50 rounded-xl mb-3 ${
                  isPickingFile ? 'opacity-50' : 'active:bg-blue-100'
                }`}
              >
                <View className="bg-blue-600 p-3 rounded-full mr-4">
                  <ImageIcon size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    Photo
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Choose from gallery
                  </Text>
                </View>
                <View className="bg-blue-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    JPG, PNG
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Video Option */}
              <TouchableOpacity
                onPress={handlePickVideo}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-purple-50 rounded-xl mb-3 ${
                  isPickingFile ? 'opacity-50' : 'active:bg-purple-100'
                }`}
              >
                <View className="bg-purple-600 p-3 rounded-full mr-4">
                  <Video size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    Video
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Choose from gallery
                  </Text>
                </View>
                <View className="bg-purple-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    MP4, MOV
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Document Option */}
              <TouchableOpacity
                onPress={handlePickDocument}
                disabled={isPickingFile}
                className={`flex-row items-center p-4 bg-green-50 rounded-xl mb-3 ${
                  isPickingFile ? 'opacity-50' : 'active:bg-green-100'
                }`}
              >
                <View className="bg-green-600 p-3 rounded-full mr-4">
                  <FileText size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-0.5">
                    Document
                  </Text>
                  <Text className="text-sm text-gray-600">
                    PDF, Word, Excel, etc.
                  </Text>
                </View>
                <View className="bg-green-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    ANY
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => setShowAttachmentModal(false)}
                className="bg-gray-100 py-3.5 rounded-xl active:bg-gray-200"
              >
                <Text className="text-center text-gray-700 font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}