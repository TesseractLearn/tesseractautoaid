import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase } from 'lucide-react';
import JobsTab from '@/components/mechanic/JobsTab';

const MechanicJobs: React.FC = () => (
  <div className="min-h-screen bg-background">
    <header className="bg-gradient-hero text-primary-foreground safe-area-inset-top px-4 pt-4 pb-5">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Briefcase className="w-5 h-5" /> My Jobs
      </h1>
      <p className="text-xs text-primary-foreground/70 mt-0.5">Active & completed jobs</p>
    </header>
    <div className="px-4 py-4">
      <JobsTab />
    </div>
  </div>
);

export default MechanicJobs;
