import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MechanicBottomNav from '@/components/navigation/MechanicBottomNav';
import IncomingRequestBanner from '@/components/mechanic/IncomingRequestBanner';

const MechanicLayout: React.FC = () => {
  const location = useLocation();
  // Don't show banner on home page since it already shows requests inline
  const showBanner = location.pathname !== '/mechanic/home';

  return (
    <div className="min-h-screen bg-background pb-20">
      {showBanner && <IncomingRequestBanner />}
      <Outlet />
      <MechanicBottomNav />
    </div>
  );
};

export default MechanicLayout;
