import React from 'react';
import { Wallet } from 'lucide-react';
import EarningsTab from '@/components/mechanic/EarningsTab';

const MechanicEarnings: React.FC = () => (
  <div className="min-h-screen bg-background">
    <header className="bg-gradient-hero text-primary-foreground safe-area-inset-top px-4 pt-4 pb-5">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Wallet className="w-5 h-5" /> Earnings
      </h1>
      <p className="text-xs text-primary-foreground/70 mt-0.5">Track your income</p>
    </header>
    <div className="px-4 py-4">
      <EarningsTab />
    </div>
  </div>
);

export default MechanicEarnings;
