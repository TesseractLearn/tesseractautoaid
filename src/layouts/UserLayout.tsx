import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import UserBottomNav from '@/components/navigation/UserBottomNav';

const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <UserBottomNav />
    </div>
  );
};

export default UserLayout;
