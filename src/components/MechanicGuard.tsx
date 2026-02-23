import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';

const MechanicGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const { data: mechanicProfile, isLoading } = useMechanicProfile();

  if (role !== 'mechanic') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!mechanicProfile) {
    return <Navigate to="/mechanic/register" replace />;
  }

  return <>{children}</>;
};

export default MechanicGuard;
