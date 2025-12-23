import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, User, VehicleOwner, Mechanic } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  login: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo
const mockVehicleOwner: VehicleOwner = {
  id: 'user-1',
  role: 'user',
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  phone: '+91 98765 43210',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
  createdAt: new Date(),
  vehicles: [
    {
      id: 'v1',
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2021,
      licensePlate: 'MH 12 AB 1234',
      color: 'White',
      type: 'car',
    },
  ],
  savedAddresses: [],
};

const mockMechanic: Mechanic = {
  id: 'mech-1',
  role: 'mechanic',
  name: 'Raju Kumar',
  email: 'raju@example.com',
  phone: '+91 87654 32109',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raju',
  createdAt: new Date(),
  isOnline: true,
  isVerified: true,
  kycStatus: 'approved',
  skills: ['puncture', 'battery', 'engine', 'towing'],
  rating: 4.8,
  totalJobs: 234,
  earnings: 125000,
  location: { lat: 19.076, lng: 72.8777 },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const login = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (otp === '123456') {
      setIsAuthenticated(true);
      setUser(role === 'mechanic' ? mockMechanic : mockVehicleOwner);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRoleState(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, setRole, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
