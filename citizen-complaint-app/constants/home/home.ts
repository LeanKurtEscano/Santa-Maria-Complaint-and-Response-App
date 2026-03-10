
import {
  ClipboardList, CheckCircle, Circle,
  TreePine,  Droplets,
  Lock, ShieldCheck, FileSearch, MessageCircle,
  ClipboardCheck, Headphones,
} from 'lucide-react-native';


import { Users, Leaf, Music, BookOpen, Heart } from 'lucide-react-native';

export const STAT_ITEMS = [
  { tKey: 'stats.submitted',   value: 24, Icon: ClipboardList, dot: '#93C5FD' },
  { tKey: 'stats.inProgress', value: 11, Icon: Circle,        dot: '#FCD34D' },
  { tKey: 'stats.resolved',    value: 13, Icon: CheckCircle,   dot: '#6EE7B7' },
] as const;


export const FEATURED_SERVICES = [
  { labelKey: 'fileComplaint',      descKey: 'fileComplaintDesc',      Icon: ClipboardList,  accent: '#60A5FA', glow: 'rgba(96,165,250,0.20)',  badge: 'FAST' },
  { labelKey: 'trackMyCase',        descKey: 'trackMyCaseDesc',        Icon: FileSearch,     accent: '#34D399', glow: 'rgba(52,211,153,0.20)',  badge: 'LIVE' },
  { labelKey: 'secureMessaging',    descKey: 'secureMessagingDesc',    Icon: Lock,           accent: '#A78BFA', glow: 'rgba(167,139,250,0.20)', badge: null   },
  { labelKey: 'verifiedReports',    descKey: 'verifiedReportsDesc',    Icon: ShieldCheck,    accent: '#FCD34D', glow: 'rgba(252,211,77,0.20)',  badge: null   },
  { labelKey: 'supportCenter',      descKey: 'supportCenterDesc',      Icon: Headphones,     accent: '#F87171', glow: 'rgba(248,113,113,0.20)', badge: '24/7' },
  { labelKey: 'resolutionStatus',   descKey: 'resolutionStatusDesc',   Icon: ClipboardCheck, accent: '#38BDF8', glow: 'rgba(56,189,248,0.20)',  badge: null   },
] as const;

export const PAGE_SIZE = 5;
export const HEADER_SCROLL_DISTANCE = 80;


// constants/home/home.ts  — UPCOMING_EVENTS section
// Replace or merge this into your existing home constants file.
// Images use Unsplash for dummy placeholders — swap with real assets later.

export const UPCOMING_EVENTS = [
  {
    id: '1',
    title: 'Barangay Assembly',
    date: 'MAR 15',
    day: 'Saturday',
    location: 'Barangay Hall, Poblacion',
    color: '#2563EB',
    bg: '#EFF6FF',
    Icon: Users,
    image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=400&q=80',
    // community meeting / assembly
  },
  {
    id: '2',
    title: 'Tree Planting Drive',
    date: 'MAR 18',
    day: 'Tuesday',
    location: 'Cabooan Forest Area',
    color: '#16A34A',
    bg: '#F0FDF4',
    Icon: Leaf,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80',
    // tree planting / nature
  },
  {
    id: '3',
    title: 'Marilag Festival',
    date: 'MAR 22',
    day: 'Saturday',
    location: 'Municipal Plaza',
    color: '#D97706',
    bg: '#FFFBEB',
    Icon: Music,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80',
    // festival / celebration
  },
  {
    id: '4',
    title: 'Literacy Program',
    date: 'MAR 25',
    day: 'Tuesday',
    location: 'Santa Maria Central School',
    color: '#7C3AED',
    bg: '#F5F3FF',
    Icon: BookOpen,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    // education / school
  },
  {
    id: '5',
    title: 'Health & Wellness Fair',
    date: 'APR 2',
    day: 'Wednesday',
    location: 'Rural Health Unit',
    color: '#DC2626',
    bg: '#FEF2F2',
    Icon: Heart,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
    // health / medical
  },
];