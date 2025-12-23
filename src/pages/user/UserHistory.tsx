import React from 'react';
import { Clock } from 'lucide-react';

const UserHistory: React.FC = () => (
  <div className="min-h-screen bg-background safe-area-inset-top px-4 py-6">
    <h1 className="text-xl font-bold text-foreground mb-6">Booking History</h1>
    <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
      <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">No bookings yet</p>
      <p className="text-xs text-muted-foreground mt-1">Your completed bookings will appear here</p>
    </div>
  </div>
);

export default UserHistory;
