export interface User {
    id: bigint;
    first_name: string;
    middle_name: string;
    last_name: string;
    age: number;
    birthdate: Date;
    email: string;
    phone_number: string;
    status: bigint;
    longitude: number;
    latitude: number;
    role: string;
    is_administrator: boolean;
    profile: string;
    suffix: string;
  }