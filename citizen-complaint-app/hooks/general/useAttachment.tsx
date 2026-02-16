import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export interface Attachment {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'file';
  name: string;
  mimeType?: string;
  size?: number;
}

interface UseAttachmentsReturn {
  attachments: Attachment[];
  isPickingFile: boolean;
  showAttachmentModal: boolean;
  setShowAttachmentModal: (show: boolean) => void;
  handlePickImage: () => Promise<void>;
  handlePickVideo: () => Promise<void>;
  handlePickDocument: () => Promise<void>;
  handleRemoveAttachment: (id: string) => void;
  formatFileSize: (bytes?: number) => string;
  resetAttachments: () => void;
}

const MAX_ATTACHMENTS = 3;

export const useAttachments = (): UseAttachmentsReturn => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const checkAttachmentLimit = (): boolean => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert('Limit Reached', `You can only attach up to ${MAX_ATTACHMENTS} files`);
      return false;
    }
    return true;
  };

  const checkIfPickingInProgress = (): boolean => {
    if (isPickingFile) {
      Alert.alert('Please Wait', 'Another file picker is already in progress');
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    if (!checkAttachmentLimit() || !checkIfPickingInProgress()) return;

    setIsPickingFile(true);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setIsPickingFile(false);
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to access your photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      setShowAttachmentModal(false);
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        };
        setAttachments((prev) => [...prev, newAttachment]);
        Alert.alert('Success', 'Photo attached successfully!');
      }
    } catch (error) {
      setShowAttachmentModal(false);
      setIsPickingFile(false);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const handlePickVideo = async () => {
    if (!checkAttachmentLimit() || !checkIfPickingInProgress()) return;

    setIsPickingFile(true);

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setIsPickingFile(false);
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to access your videos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      setShowAttachmentModal(false);
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'video',
          name: asset.fileName || `video_${Date.now()}.mp4`,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        };
        setAttachments((prev) => [...prev, newAttachment]);
        Alert.alert('Success', 'Video attached successfully!');
      }
    } catch (error) {
      setShowAttachmentModal(false);
      setIsPickingFile(false);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
      console.error('Video picker error:', error);
    }
  };

  const handlePickDocument = async () => {
    if (!checkAttachmentLimit() || !checkIfPickingInProgress()) return;

    setIsPickingFile(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      setShowAttachmentModal(false);
      setIsPickingFile(false);

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('Document picker was cancelled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'file',
          name: asset.name,
          mimeType: asset.mimeType || undefined,
          size: asset.size || undefined,
        };
        setAttachments((prev) => [...prev, newAttachment]);
        Alert.alert('Success', 'Document attached successfully!');
      }
    } catch (error) {
      setShowAttachmentModal(false);
      setIsPickingFile(false);
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const resetAttachments = () => {
    setAttachments([]);
  };

  return {
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
  };
};