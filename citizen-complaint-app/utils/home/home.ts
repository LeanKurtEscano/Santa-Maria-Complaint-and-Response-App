// utils/home.ts
import { UploaderInfo } from '@/types/general/home';


export function getGreeting() {
  const h = new Date().getHours();

  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  return 'greeting.evening';
}
export function timeAgo(iso: string, lang: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const tl = lang === 'tl';
  if (m < 1)  return tl ? 'kararating lang'                 : 'just now';
  if (m < 60) return tl ? `${m}m ang nakakaraan`            : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return tl ? `${h}h ang nakakaraan`            : `${h}h ago`;
  return        tl ? `${Math.floor(h / 24)}d ang nakakaraan` : `${Math.floor(h / 24)}d ago`;
}

export function uploaderLabel(u: UploaderInfo) {
  if (u.first_name || u.last_name)
    return [u.first_name, u.last_name].filter(Boolean).join(' ');
  return u.email.split('@')[0];
}