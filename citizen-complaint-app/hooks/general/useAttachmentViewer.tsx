// hooks/general/useAttachmentViewer.ts
import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import { Attachment } from '@/hooks/general/useAttachment';

export type ViewerState =
  | { type: 'closed' }
  | { type: 'image'; attachment: Attachment }
  | { type: 'video'; attachment: Attachment }
  | { type: 'opening_file'; attachment: Attachment };

export function useAttachmentViewer() {
  const [viewer, setViewer] = useState<ViewerState>({ type: 'closed' });
  const [isOpening, setIsOpening] = useState(false);

  const openAttachment = useCallback(async (attachment: Attachment) => {
    if (attachment.type === 'image') {
      setViewer({ type: 'image', attachment });
      return;
    }

    if (attachment.type === 'video') {
      setViewer({ type: 'video', attachment });
      return;
    }

    // Document / file — open with native handler
    setIsOpening(true);
    try {
      const uri = attachment.uri;

      if (Platform.OS === 'android') {
        // On Android, use IntentLauncher to open with system app
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: attachment.mimeType ?? getMimeFromName(attachment.name),
        });
      } else {
        // On iOS, share sheet is the standard way to open files
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: attachment.mimeType ?? getMimeFromName(attachment.name),
            dialogTitle: attachment.name,
          });
        } else {
          Alert.alert('Cannot open file', 'No app available to open this file type.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open the file. Please try again.');
      console.warn('AttachmentViewer: open error', err);
    } finally {
      setIsOpening(false);
    }
  }, []);

  const closeViewer = useCallback(() => {
    setViewer({ type: 'closed' });
  }, []);

  return { viewer, isOpening, openAttachment, closeViewer };
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };
  return map[ext] ?? 'application/octet-stream';
}