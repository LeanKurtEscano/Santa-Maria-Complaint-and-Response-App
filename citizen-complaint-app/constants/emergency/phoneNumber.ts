export interface EmergencyContact {
  id: string;
  /** i18n key for the service name, e.g. "emergency.services.pnp" */
  nameKey: string;
  phoneNumber: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'pnp',
    nameKey: 'emergency.services.pnp',
    phoneNumber: '117',
  },
  {
    id: 'bfp',
    nameKey: 'emergency.services.bfp',
    phoneNumber: '(02) 8426-0219',
  },
];


