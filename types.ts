
export type Language = 'am' | 'en';

export enum UserRole {
  RECEPTION = 'RECEPTION',
  LOCAL_POLICE = 'LOCAL_POLICE',
  SUPER_POLICE = 'SUPER_POLICE'
}

export interface UserAccount {
  phoneNumber: string;
  password: string;
  username: string;
  role: UserRole;
  isVerified: boolean;
  isProfileComplete: boolean;
  otpCode?: string;
}

export interface HotelProfile {
  id: string;
  name: string;
  address: string;
  zone: string;
  receptionistName: string;
  phoneNumber: string;
  digitalIdPhoto?: string;
}

export interface PoliceProfile {
  name: string;
  address: string;
  zone: string;
}

export interface Guest {
  id: string;
  fullName: string;
  idPhoto: string;
  nationality: string;
  roomNumber: string;
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelZone: string;
  receptionistName: string;
  receptionistPhone: string;
  checkInDate: string;
  isWanted?: boolean;
}

export interface WantedPerson {
  id: string;
  fullName: string;
  photo: string;
  description: string;
  crime: string;
  postedDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'danger' | 'info' | 'success';
  timestamp: string;
  targetZone?: string;
  guestId?: string;
}
