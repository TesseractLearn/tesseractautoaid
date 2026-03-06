import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface IncomingOffer {
  id: string;
  booking_id: string;
  mechanic_id: string;
  status: string;
  score: number;
  eta_minutes: number | null;
  created_at: string;
  booking?: {
    id: string;
    service_type: string;
    issue_description: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    user_id: string;
    status: string;
  };
  user_name?: string;
}

export const useMechanicRequests = () => {
  const { user } = useAuth();
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [requests, setRequests] = useState<IncomingOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Get mechanic profile
  useEffect(() => {
    if (!user) return;
    const fetchMechanic = async () => {
      const { data } = await supabase
        .from('mechanics')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setMechanicId(data.id);
    };
    fetchMechanic();
  }, [user]);

  // Fetch pending offers for this mechanic
  const fetchRequests = useCallback(async () => {
    if (!mechanicId) return;
    setLoading(true);

    try {
      const { data: offers, error } = await supabase
        .from('booking_offers')
        .select('*')
        .eq('mechanic_id', mechanicId)
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch booking and user details for each offer
      const enriched = await Promise.all(
        (offers || []).map(async (offer) => {
          const { data: booking } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', offer.booking_id)
            .single();

          let userName = 'Unknown User';
          if (booking) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', booking.user_id)
              .single();
            userName = profile?.full_name || 'Unknown User';
          }

          return { ...offer, booking: booking || undefined, user_name: userName };
        })
      );

      setRequests(enriched);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  }, [mechanicId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Polling fallback in case realtime events are missed on unstable networks
  useEffect(() => {
    if (!mechanicId) return;

    const intervalId = window.setInterval(() => {
      fetchRequests();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [mechanicId, fetchRequests]);

  // Real-time subscription for new offers
  useEffect(() => {
    if (!mechanicId) return;

    const channel = supabase
      .channel(`mechanic-offers-${mechanicId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_offers',
        filter: `mechanic_id=eq.${mechanicId}`,
      }, async (payload) => {
        const newOffer = payload.new as IncomingOffer;
        if (newOffer.status !== 'pending') return;

        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', newOffer.booking_id)
          .single();

        let userName = 'Unknown User';
        if (booking) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', booking.user_id)
            .single();
          userName = profile?.full_name || 'Unknown User';
        }

        setRequests(prev => [{ ...newOffer, booking: booking || undefined, user_name: userName }, ...prev]);
        toast.info('🔔 New job offer!', { duration: 5000 });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'booking_offers',
        filter: `mechanic_id=eq.${mechanicId}`,
      }, (payload) => {
        const updated = payload.new as IncomingOffer;
        if (updated.status !== 'pending') {
          setRequests(prev => prev.filter(r => r.id !== updated.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mechanicId]);

  // Accept an offer via edge function
  const acceptRequest = useCallback(async (offerId: string) => {
    if (!mechanicId) return;

    const offer = requests.find(r => r.id === offerId);
    if (!offer) return;

    try {
      const { data, error } = await supabase.functions.invoke('accept-offer', {
        body: { bookingId: offer.booking_id, mechanicId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRequests(prev => prev.filter(r => r.id !== offerId));
      toast.success('Job accepted! Navigate to the customer.');
    } catch (err: any) {
      toast.error('Failed to accept: ' + err.message);
    }
  }, [mechanicId, requests]);

  // Decline an offer
  const declineRequest = useCallback(async (offerId: string) => {
    if (!mechanicId) return;

    try {
      await supabase
        .from('booking_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId)
        .eq('mechanic_id', mechanicId);

      setRequests(prev => prev.filter(r => r.id !== offerId));
      toast.info('Offer declined');
    } catch (err: any) {
      toast.error('Failed to decline: ' + err.message);
    }
  }, [mechanicId]);

  return {
    requests,
    loading,
    acceptRequest,
    declineRequest,
    refreshRequests: fetchRequests,
  };
};
