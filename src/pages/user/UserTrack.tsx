import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, MessageCircle, Clock, CheckCircle2, Search, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ActiveBooking {
  id: string;
  status: string;
  service_type: string;
  mechanic: {
    id: string;
    full_name: string;
    phone: string;
    specialization: string;
    rating: number;
  } | null;
}

const UserTrack: React.FC = () => {
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveBooking();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchActiveBooking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveBooking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          service_type,
          mechanic_id
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'accepted', 'mechanic_arriving', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.mechanic_id) {
        // Fetch mechanic details separately
        const { data: mechanicData } = await supabase
          .from('mechanics')
          .select('id, full_name, phone, specialization, rating')
          .eq('id', data.mechanic_id)
          .maybeSingle();

        setActiveBooking({
          ...data,
          mechanic: mechanicData
        });
      } else if (data) {
        setActiveBooking({
          ...data,
          mechanic: null
        });
      } else {
        setActiveBooking(null);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Finding a mechanic...';
      case 'accepted':
        return 'Mechanic accepted your request';
      case 'mechanic_arriving':
        return 'Mechanic is on the way';
      case 'in_progress':
        return 'Repair in progress';
      default:
        return 'Processing...';
    }
  };

  const getEstimatedTime = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Searching...';
      case 'accepted':
        return 'Preparing to arrive';
      case 'mechanic_arriving':
        return '8-15 mins';
      case 'in_progress':
        return 'Working on it';
      default:
        return '--';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No active booking - show empty state
  if (!activeBooking) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Empty state illustration */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6 animate-pulse">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            No Active Booking
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-xs">
            You haven't hired any mechanic yet. Find nearby mechanics and book a service.
          </p>
          
          <Button 
            onClick={() => navigate('/user')} 
            className="gap-2"
            size="lg"
          >
            <Wrench className="w-5 h-5" />
            Find Mechanics
          </Button>
        </div>
      </div>
    );
  }

  // Active booking exists - show tracking
  return (
    <div className="min-h-screen bg-background">
      {/* Map Placeholder */}
      <div className="h-[45vh] bg-gradient-to-b from-primary/20 to-secondary relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{getStatusText(activeBooking.status)}</p>
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
            <span className="font-semibold text-foreground">
              {activeBooking.status === 'mechanic_arriving' 
                ? `Mechanic arriving in ${getEstimatedTime(activeBooking.status)}`
                : getStatusText(activeBooking.status)
              }
            </span>
          </div>

          {/* Mechanic Info */}
          {activeBooking.mechanic ? (
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeBooking.mechanic.full_name}`}
                  alt="Mechanic"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-foreground">{activeBooking.mechanic.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {activeBooking.mechanic.rating || 'New'} • {activeBooking.mechanic.specialization || 'General'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" asChild>
                  <a href={`tel:${activeBooking.mechanic.phone}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-secondary/50 rounded-xl">
              <p className="text-muted-foreground">Searching for available mechanics...</p>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-5 h-5 ${activeBooking.status !== 'pending' ? 'text-success' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${activeBooking.status !== 'pending' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Booking confirmed
              </span>
            </div>
            <div className="flex items-center gap-3">
              {activeBooking.status === 'mechanic_arriving' ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              ) : (
                <CheckCircle2 className={`w-5 h-5 ${activeBooking.status === 'in_progress' ? 'text-success' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-sm ${activeBooking.status === 'mechanic_arriving' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                Mechanic on the way
              </span>
            </div>
            <div className="flex items-center gap-3">
              {activeBooking.status === 'in_progress' ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              ) : (
                <Clock className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${activeBooking.status === 'in_progress' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                Repair in progress
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTrack;
