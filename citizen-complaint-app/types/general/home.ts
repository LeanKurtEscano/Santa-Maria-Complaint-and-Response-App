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



export interface MyStats {
  total_complaints: number;
  resolved_complaints: number;
  pending_complaints: number;
}


export interface EventMedia { id: number; media_url: string; media_type: string; uploaded_at: string; }
export interface EventData  { id: number; event_name: string; description?: string; date: string; location?: string; media: EventMedia[]; }