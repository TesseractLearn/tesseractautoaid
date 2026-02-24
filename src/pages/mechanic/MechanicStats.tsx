import React from 'react';
import { BarChart3 } from 'lucide-react';
import StatsTab from '@/components/mechanic/StatsTab';

const MechanicStats: React.FC = () => (
  <div className="min-h-screen bg-background">
    <header className="bg-gradient-hero text-primary-foreground safe-area-inset-top px-4 pt-4 pb-5">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Performance
      </h1>
      <p className="text-xs text-primary-foreground/70 mt-0.5">Your stats & analytics</p>
    </header>
    <div className="px-4 py-4">
      <StatsTab />
    </div>
  </div>
);

export default MechanicStats;
