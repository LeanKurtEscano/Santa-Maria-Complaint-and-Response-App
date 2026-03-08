
import {
  ClipboardList, CheckCircle, Circle,
  Users, TreePine, Heart, Droplets,
  Lock, ShieldCheck, FileSearch, MessageCircle,
  ClipboardCheck, Headphones,
} from 'lucide-react-native';

export const STAT_ITEMS = [
  { tKey: 'stats.submitted',   value: 24, Icon: ClipboardList, dot: '#93C5FD' },
  { tKey: 'stats.in_progress', value: 11, Icon: Circle,        dot: '#FCD34D' },
  { tKey: 'stats.resolved',    value: 13, Icon: CheckCircle,   dot: '#6EE7B7' },
] as const;

export const UPCOMING_EVENTS = [
  { id: 1, title: 'Barangay Assembly',    date: 'Mar 15', day: 'Sat', location: 'Covered Court', color: '#2563EB', bg: '#EFF6FF', Icon: Users },
  { id: 2, title: 'Tree Planting Drive',  date: 'Mar 18', day: 'Tue', location: 'City Park',     color: '#059669', bg: '#ECFDF5', Icon: TreePine },
  { id: 3, title: 'Free Medical Mission', date: 'Mar 22', day: 'Sat', location: 'Health Center', color: '#DC2626', bg: '#FEF2F2', Icon: Heart },
  { id: 4, title: 'Water Bill Payment',   date: 'Mar 31', day: 'Mon', location: 'City Hall',     color: '#0891B2', bg: '#F0F9FF', Icon: Droplets },
] as const;

export const FEATURED_SERVICES = [
  { label: 'File a Complaint',  desc: 'Secure & confidential',   Icon: ClipboardList,  accent: '#60A5FA', glow: 'rgba(96,165,250,0.20)',   badge: 'FAST' },
  { label: 'Track My Case',     desc: 'Real-time updates',        Icon: FileSearch,     accent: '#34D399', glow: 'rgba(52,211,153,0.20)',   badge: 'LIVE' },
  { label: 'Secure Messaging',  desc: 'Protected Messages',     Icon: Lock,           accent: '#A78BFA', glow: 'rgba(167,139,250,0.20)',  badge: null   },
  { label: 'Verified Reports',  desc: 'Tamper-proof records',     Icon: ShieldCheck,    accent: '#FCD34D', glow: 'rgba(252,211,77,0.20)',   badge: null   },
  { label: 'Support Center',    desc: '24/7 assistance',          Icon: Headphones,     accent: '#F87171', glow: 'rgba(248,113,113,0.20)', badge: '24/7' },
  { label: 'Resolution Status', desc: 'Transparent process',      Icon: ClipboardCheck, accent: '#38BDF8', glow: 'rgba(56,189,248,0.20)',   badge: null   },
] as const;

export const PAGE_SIZE = 5;
export const HEADER_SCROLL_DISTANCE = 80;