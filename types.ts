
export type Language = 'am' | 'en';

export enum UserRole {
  RECEPTION = 'RECEPTION',
  POLICE = 'POLICE'
}

export interface HotelProfile {
  name: string;
  address: string;
  receptionistName: string;
}

export interface Guest {
  id: string;
  fullName: string;
  idPhoto: string;
  nationality: string;
  roomNumber: string;
  hotelName: string;
  hotelAddress: string;
  receptionistName: string;
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
  guestId?: string;
}
