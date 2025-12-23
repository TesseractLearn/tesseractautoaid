// User Roles
export type UserRole = 'user' | 'mechanic';

// User Types
export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: Date;
}

export interface VehicleOwner extends User {
  role: 'user';
  vehicles: Vehicle[];
  savedAddresses: Address[];
}

export interface Mechanic extends User {
  role: 'mechanic';
  isOnline: boolean;
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  skills: ServiceType[];
  rating: number;
  totalJobs: number;
  earnings: number;
  location?: Coordinates;
}

// Vehicle
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  type: 'car' | 'bike' | 'truck' | 'auto';
}

// Services
export type ServiceType = 
  | 'puncture'
  | 'towing'
  | 'engine'
  | 'battery'
  | 'emergency'
  | 'ac'
  | 'brakes'
  | 'oil_change'
  | 'general';

export interface Service {
  id: ServiceType;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  estimatedTime: string;
}

// Booking
export type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'mechanic_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  mechanicId: string;
  vehicleId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  location: Address;
  issueDescription: string;
  issueImages?: string[];
  estimatedPrice: number;
  finalPrice?: number;
  createdAt: Date;
  completedAt?: Date;
  rating?: number;
  review?: string;
}

// Location
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: Coordinates;
}

// Job Request (for mechanics)
export interface JobRequest {
  id: string;
  booking: Booking;
  user: VehicleOwner;
  vehicle: Vehicle;
  distance: number;
  estimatedArrivalTime: string;
}

// Chat
export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

// Earnings
export interface Earning {
  id: string;
  mechanicId: string;
  bookingId: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'paid';
  date: Date;
}
