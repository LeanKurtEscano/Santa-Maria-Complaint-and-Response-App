export interface MediaItem {
  id: number;
  announcement_id: number;
  media_url: string;
  media_type: 'image' | 'video';
}

export interface UploaderInfo {
  id: number;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  uploader_id: number;
  uploader: UploaderInfo;
  created_at: string;
  updated_at: string;
  media: MediaItem[];
}
