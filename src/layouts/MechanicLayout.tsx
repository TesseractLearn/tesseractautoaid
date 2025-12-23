import React from 'react';
import { Outlet } from 'react-router-dom';
import MechanicBottomNav from '@/components/navigation/MechanicBottomNav';

const MechanicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <MechanicBottomNav />
    </div>
  );
};

export default MechanicLayout;
