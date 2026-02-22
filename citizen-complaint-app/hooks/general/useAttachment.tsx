import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import useToast from '@/hooks/general/useToast';

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
  setToastVisible: (visible: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  hideToast: () => void;
}

const MAX_ATTACHMENTS = 3;

export const useAttachments = (): UseAttachmentsReturn => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const { showToast, hideToast, toastVisible, setToastVisible, toastMessage, toastType } = useToast();

  // Ref always holds the live count — never goes stale inside async functions
  const attachmentCountRef = useRef(0);

  const setAttachmentsSync = (updater: (prev: Attachment[]) => Attachment[]) => {
    setAttachments((prev) => {
      const next = updater(prev);
      attachmentCountRef.current = next.length;
      return next;
    });
  };

  const getRemainingSlots = (): number => MAX_ATTACHMENTS - attachmentCountRef.current;

  const checkAttachmentLimit = (): boolean => {
    if (attachmentCountRef.current >= MAX_ATTACHMENTS) {
      showToast(`You can only attach up to ${MAX_ATTACHMENTS} files`, 'error');
      return false;
    }
    return true;
  };

  const checkIfPickingInProgress = (): boolean => {
    if (isPickingFile) {
      showToast('Another file picker is already in progress', 'error');
      return false;
    }
    return true;
  };

  const mergeAttachments = (
    candidates: Attachment[],
    type: 'photo' | 'video' | 'document',
  ) => {
    setAttachmentsSync((prev) => {
      const slotsLeft = MAX_ATTACHMENTS - prev.length;
      if (slotsLeft <= 0) {
        setTimeout(() => showToast(`Attachment limit of ${MAX_ATTACHMENTS} already reached`, 'error'), 0);
        return prev;
      }

      const toAdd = candidates.slice(0, slotsLeft);
      const skipped = candidates.length - toAdd.length;
      const count = toAdd.length;

      setTimeout(() => {
        if (skipped > 0) {
          showToast(
            `Only ${count} ${type}${count > 1 ? 's' : ''} added — limit of ${MAX_ATTACHMENTS} reached`,
            'info',
          );
        } else {
          showToast(
            `${count} ${type}${count > 1 ? 's' : ''} attached successfully`,
            'success',
          );
        }
      }, 0);

      return [...prev, ...toAdd];
    });
  };

  const handlePickImage = async () => {
    if (!checkAttachmentLimit() || !checkIfPickingInProgress()) return;
    setIsPickingFile(true);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setIsPickingFile(false);
      showToast('Camera roll permission is required to attach photos', 'error');
      return;
    }

    try {
      const remaining = getRemainingSlots();

      if (remaining < MAX_ATTACHMENTS) {
        showToast(
          `${remaining} slot${remaining > 1 ? 's' : ''} left — select up to ${remaining} more photo${remaining > 1 ? 's' : ''}`,
          'info',
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });

      setShowAttachmentModal(false);
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const candidates: Attachment[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        }));
        mergeAttachments(candidates, 'photo');
      }
    } catch (error) {
      setShowAttachmentModal(false);
      setIsPickingFile(false);
      showToast('Failed to pick image. Please try again.', 'error');
      console.error('Image picker error:', error);
    }
  };

  const handlePickVideo = async () => {
    if (!checkAttachmentLimit() || !checkIfPickingInProgress()) return;
    setIsPickingFile(true);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setIsPickingFile(false);
      showToast('Camera roll permission is required to attach videos', 'error');
      return;
    }

    try {
      const remaining = getRemainingSlots();

      if (remaining < MAX_ATTACHMENTS) {
        showToast(
          `${remaining} slot${remaining > 1 ? 's' : ''} left — select up to ${remaining} more video${remaining > 1 ? 's' : ''}`,
          'info',
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });

      setShowAttachmentModal(false);
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const candidates: Attachment[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'video',
          name: asset.fileName || `video_${Date.now()}_${index}.mp4`,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        }));
        mergeAttachments(candidates, 'video');
      }
    } catch (error) {
      setShowAttachmentModal(false);
      setIsPickingFile(false);
      showToast('Failed to pick video. Please try again.', 'error');
      console.error('Video picker error:', error);
    }
  };

  const handlePickDocument = async () => {
    if (!checkAttachmentLimit() || !checkIfPickingInProgress()) return;
    setIsPickingFile(true);

    try {
      const remaining = getRemainingSlots();

      // Always notify for documents since DocumentPicker ignores selectionLimit
      showToast(
        `${remaining} slot${remaining > 1 ? 's' : ''} left — only the first ${remaining} document${remaining > 1 ? 's' : ''} will be added`,
        'info',
      );

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      setShowAttachmentModal(false);
      setIsPickingFile(false);

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const candidates: Attachment[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'file',
          name: asset.name,
          mimeType: asset.mimeType || undefined,
          size: asset.size || undefined,
        }));
        mergeAttachments(candidates, 'document');
      }
    } catch (error) {
      setShowAttachmentModal(false);
      setIsPickingFile(false);
      showToast('Failed to pick document. Please try again.', 'error');
      console.error('Document picker error:', error);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachmentsSync((prev) => prev.filter((att) => att.id !== id));
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const resetAttachments = () => {
    setAttachmentsSync(() => []);
  };

  return {
    attachments,
    setToastVisible,
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
    toastVisible,
    toastMessage,
    toastType,
    hideToast,
  };
};