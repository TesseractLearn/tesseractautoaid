import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BookingOffer {
  id: string;
  booking_id: string;
  mechanic_id: string;
  status: string;
  score: number;
  eta_minutes: number | null;
  created_at: string;
  mechanic?: {
    id: string;
    full_name: string;
    phone: string | null;
    specialization: string | null;
    rating: number | null;
    latitude: number;
    longitude: number;
  };
}

interface ActiveBooking {
  id: string;
  status: string;
  service_type: string;
  mechanic_id: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export const useServiceRequests = () => {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [offers, setOffers] = useState<BookingOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // Create a booking and trigger dispatch
  const createRequest = useCallback(async (params: {
    serviceType: string;
    issueDescription?: string;
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    if (!user) return null;
    setLoading(true);

    try {
      // Create booking with pending status
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          service_type: params.serviceType,
          issue_description: params.issueDescription || null,
          latitude: params.latitude,
          longitude: params.longitude,
          address: params.address || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      setActiveBooking(booking);

      // Trigger dispatch algorithm
      setDispatching(true);
      const { data: dispatchResult, error: dispatchErr } = await supabase.functions.invoke('dispatch-booking', {
        body: { bookingId: booking.id },
      });

      if (dispatchErr) {
        console.error('Dispatch error:', dispatchErr);
        toast.error('Failed to find mechanics');
      } else if (dispatchResult?.status === 'no_mechanic_found') {
        toast.error('No mechanics available nearby. Try again later.');
        setActiveBooking(prev => prev ? { ...prev, status: 'no_mechanic_found' } : null);
      } else {
        toast.success(`Request sent to ${dispatchResult?.offersCount || 0} nearby mechanics!`);
        setActiveBooking(prev => prev ? { ...prev, status: 'offer_sent' } : null);

        // Schedule timeout check after 60 seconds
        setTimeout(async () => {
          await supabase.functions.invoke('handle-offer-timeout', {
            body: { bookingId: booking.id },
          });
        }, 60000);
      }

      setDispatching(false);
      return booking;
    } catch (err: any) {
      toast.error('Failed to send request: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cancel a booking
  const cancelRequest = useCallback(async (bookingId: string) => {
    try {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      // Expire all offers
      await supabase
        .from('booking_offers')
        .update({ status: 'expired' })
        .eq('booking_id', bookingId);

      setActiveBooking(null);
      setOffers([]);
      toast.info('Request cancelled');
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    }
  }, []);

  // Listen for booking updates and offers
  useEffect(() => {
    if (!activeBooking) return;

    // Fetch existing offers
    const fetchOffers = async () => {
      const { data } = await supabase
        .from('booking_offers')
        .select('*')
        .eq('booking_id', activeBooking.id)
        .eq('status', 'accepted');

      // Note: 'accepted' here means mechanic accepted the offer
      if (data && data.length > 0) {
        const withMechanics = await Promise.all(
          data.map(async (o) => {
            const { data: mech } = await supabase
              .from('mechanics')
              .select('*')
              .eq('id', o.mechanic_id)
              .single();
            return { ...o, mechanic: mech || undefined };
          })
        );
        setOffers(withMechanics);
      }
    };

    fetchOffers();

    // Real-time: listen for booking status changes
    const bookingChannel = supabase
      .channel(`booking-${activeBooking.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${activeBooking.id}`,
      }, (payload) => {
        const updated = payload.new as ActiveBooking;
        setActiveBooking(updated);
        if (updated.status === 'accepted') {
          toast.success('A mechanic has accepted! They are on their way.');
        } else if (updated.status === 'no_mechanic_found') {
          toast.error('No mechanics available. Please try again.');
        }
      })
      .subscribe();

    // Real-time: listen for new offer acceptances
    const offersChannel = supabase
      .channel(`booking-offers-${activeBooking.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booking_offers',
        filter: `booking_id=eq.${activeBooking.id}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const offer = payload.new as BookingOffer;
          if (offer.status === 'accepted') {
            // Mechanic accepted - fetch their details
            const { data: mech } = await supabase
              .from('mechanics')
              .select('*')
              .eq('id', offer.mechanic_id)
              .single();
            setOffers(prev => {
              const exists = prev.find(o => o.id === offer.id);
              if (exists) return prev.map(o => o.id === offer.id ? { ...offer, mechanic: mech || undefined } : o);
              return [...prev, { ...offer, mechanic: mech || undefined }];
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(offersChannel);
    };
  }, [activeBooking?.id]);

  // Check for existing active booking on mount
  useEffect(() => {
    if (!user) return;

    const checkActive = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'offer_sent', 'searching'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setActiveBooking(data);
    };

    checkActive();
  }, [user]);

  return {
    activeBooking,
    offers,
    loading,
    dispatching,
    createRequest,
    cancelRequest,
  };
};
