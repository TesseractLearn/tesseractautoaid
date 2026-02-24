import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Briefcase, Wallet, BarChart3 } from 'lucide-react';
import ProfileTab from '@/components/mechanic/ProfileTab';
import JobsTab from '@/components/mechanic/JobsTab';
import EarningsTab from '@/components/mechanic/EarningsTab';
import StatsTab from '@/components/mechanic/StatsTab';

const MechanicProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero text-primary-foreground safe-area-inset-top px-4 pt-4 pb-5">
        <h1 className="text-lg font-bold">My Dashboard</h1>
        <p className="text-xs text-primary-foreground/70 mt-0.5">Manage your profile, jobs & earnings</p>
      </header>

      <div className="-mt-2 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-12 bg-card border-b border-border rounded-none px-1 grid grid-cols-4">
            <TabsTrigger value="profile" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="jobs" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Briefcase className="w-4 h-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Wallet className="w-4 h-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0 px-4 py-4">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="jobs" className="mt-0 px-4 py-4">
            <JobsTab />
          </TabsContent>
          <TabsContent value="earnings" className="mt-0 px-4 py-4">
            <EarningsTab />
          </TabsContent>
          <TabsContent value="stats" className="mt-0 px-4 py-4">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MechanicProfile;
