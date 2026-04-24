export interface EmergencyContact {
  id: string;
  name: string;  // direct name, no i18n needed
  phoneNumber: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'pnp',
    name: 'Philippine National Police',
    phoneNumber: '117',
  },
  {
    id: 'bfp',
    name: 'Bureau of Fire Protection',
    phoneNumber: '(02) 8426-0219',
  },
  {
    id: 'sarah',
    name: 'Sarah Hotline',
    phoneNumber: '639530547660',
  },
];




