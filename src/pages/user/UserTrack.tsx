import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';

const UserTrack: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Map Placeholder */}
      <div className="h-[45vh] bg-gradient-to-b from-primary/20 to-secondary relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Mechanic is on the way</p>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-card rounded-t-3xl -mt-6 relative z-10 min-h-[55vh] animate-slide-up">
        <div className="w-12 h-1 bg-border rounded-full mx-auto mt-3" />
        
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="font-semibold text-foreground">Mechanic arriving in 8 mins</span>
          </div>

          {/* Mechanic Info */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=raju"
                alt="Mechanic"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold text-foreground">Raju Kumar</p>
                <p className="text-xs text-muted-foreground">⭐ 4.8 • Puncture Expert</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-sm text-foreground">Booking confirmed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <span className="text-sm text-foreground font-medium">Mechanic on the way</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Repair in progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTrack;
