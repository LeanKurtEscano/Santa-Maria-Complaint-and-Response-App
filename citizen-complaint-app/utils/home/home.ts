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



// LGU Smart Uploader Label Formatter

const BARANGAY_DICT: Record<string, string> = {
  bagongpook: "Bagong Pook",
  parangngbuho: "Parang Ng Buho",
  kayhakat: "Kayhakat"
};

const POBLACION_MAP: Record<string, string> = {
  uno: "Uno",
  dos: "Dos",
  tres: "Tres",
  quatro: "Quatro",
  cuatro: "Quatro"
};

export function uploaderLabel(u: UploaderInfo): string {
  if (!u) return '';

  let text = '';

  if (u.first_name || u.last_name) {
    text = [u.first_name, u.last_name].filter(Boolean).join(' ');
  } else if (u.email) {
    text = u.email.split('@')[0];
  } else {
    return '';
  }

  return filipinoSmartFormat(text);
}

function filipinoSmartFormat(input: string): string {
  if (!input) return '';

  let normalized = input
    .toLowerCase()
    .trim()
    .replace(/[\s._-]+/g, '');

  // Special barangay dictionary
  if (BARANGAY_DICT[normalized]) {
    return BARANGAY_DICT[normalized];
  }

  // Poblacion number pattern
  const poblacionMatch = normalized.match(
    /^poblacion(uno|dos|tres|quatro|cuatro)$/
  );

  if (poblacionMatch) {
    return `Poblacion ${POBLACION_MAP[poblacionMatch[1]]}`;
  }

  // Default smart capitalization (camelCase + merged usernames)
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}