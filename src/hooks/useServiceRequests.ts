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

export interface NearbyMechanic {
  id: string;
  full_name: string;
  specialization: string | null;
  rating: number | null;
  latitude: number;
  longitude: number;
  is_available: boolean | null;
  distance: number;
  eta_minutes: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useServiceRequests = () => {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [offers, setOffers] = useState<BookingOffer[]>([]);
  const [nearbyMechanics, setNearbyMechanics] = useState<NearbyMechanic[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);

  // Fetch nearby mechanics based on booking location
  const fetchNearbyMechanics = useCallback(async (lat: number, lng: number, radiusKm = 150) => {
    setMechanicsLoading(true);
    console.log('[FindMechanics] Fetching nearby mechanics at', lat, lng, 'radius:', radiusKm);
    try {
      const { data, error } = await supabase
        .from('mechanics_public')
        .select('id, user_id, full_name, specialization, latitude, longitude, rating, is_available, is_verified, address, services_offered, profile_photo_url, experience_years, total_jobs_count, total_rating_count, active_jobs_count, recent_jobs_count, avg_response_time, avg_eta, total_earnings, created_at, updated_at');

      if (error) throw error;

      console.log('[FindMechanics] Raw mechanics from DB:', data?.length, data?.map(m => ({ id: m.id, name: m.full_name, user_id: m.user_id, available: m.is_available })));
      console.log('[FindMechanics] Current user id:', user?.id);

      const mechanics: NearbyMechanic[] = (data || [])
        .filter(m => {
          const isSelf = m.user_id === user?.id;
          if (isSelf) console.log('[FindMechanics] Filtering out self:', m.full_name);
          return !isSelf;
        })
        .map(m => {
          const dist = haversineDistance(lat, lng, m.latitude, m.longitude);
          return {
            id: m.id,
            full_name: m.full_name,
            specialization: m.specialization,
            rating: m.rating ? Number(m.rating) : null,
            latitude: m.latitude,
            longitude: m.longitude,
            is_available: m.is_available,
            distance: Math.round(dist * 10) / 10,
            eta_minutes: Math.round((dist / 20) * 60),
          };
        })
        .filter(m => {
          const inRadius = m.distance <= radiusKm;
          if (!inRadius) console.log('[FindMechanics] Filtered by radius:', m.full_name, m.distance, 'km');
          return inRadius;
        })
        .sort((a, b) => a.distance - b.distance);

      console.log('[FindMechanics] Final nearby mechanics:', mechanics.length, mechanics.map(m => ({ name: m.full_name, dist: m.distance, available: m.is_available })));
      setNearbyMechanics(mechanics);
    } catch (err) {
      console.error('[FindMechanics] Failed to fetch nearby mechanics:', err);
    } finally {
      setMechanicsLoading(false);
    }
  }, [user]);

  // Create a booking and trigger dispatch
  const createRequest = useCallback(async (params: {
    serviceType: string;
    issueDescription?: string;
    latitude: number;
    longitude: number;
    address?: string;
    selectedProblems?: string[];
    severity?: string;
    estimatedPriceMin?: number;
    estimatedPriceMax?: number;
  }) => {
    if (!user) return null;
    setLoading(true);

    try {
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
          selected_problems: params.selectedProblems || [],
          severity: params.severity || 'medium',
          estimated_price_min: params.estimatedPriceMin || null,
          estimated_price_max: params.estimatedPriceMax || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setActiveBooking(booking);

      // Fetch nearby mechanics for display
      fetchNearbyMechanics(params.latitude, params.longitude);

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
  }, [user, fetchNearbyMechanics]);

  // User manually selects a mechanic (Path A)
  const selectMechanic = useCallback(async (mechanicId: string) => {
    if (!activeBooking) return;
    setSelecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('user-select-mechanic', {
        body: { bookingId: activeBooking.id, mechanicId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || 'Mechanic selected!');
      setActiveBooking(prev => prev ? { ...prev, status: 'accepted', mechanic_id: mechanicId } : null);
    } catch (err: any) {
      toast.error('Failed to select mechanic: ' + err.message);
    } finally {
      setSelecting(false);
    }
  }, [activeBooking]);

  // Cancel a booking
  const cancelRequest = useCallback(async (bookingId: string) => {
    try {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      await supabase
        .from('booking_offers')
        .update({ status: 'expired' })
        .eq('booking_id', bookingId);

      setActiveBooking(null);
      setOffers([]);
      setNearbyMechanics([]);
      toast.info('Request cancelled');
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    }
  }, []);

  // Listen for booking updates and offers
  useEffect(() => {
    if (!activeBooking) return;

    const fetchOffers = async () => {
      const { data } = await supabase
        .from('booking_offers')
        .select('*')
        .eq('booking_id', activeBooking.id)
        .eq('status', 'accepted');

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

      if (data) {
        setActiveBooking(data);
        fetchNearbyMechanics(data.latitude, data.longitude);
      }
    };

    checkActive();
  }, [user, fetchNearbyMechanics]);

  return {
    activeBooking,
    offers,
    nearbyMechanics,
    loading,
    dispatching,
    selecting,
    mechanicsLoading,
    createRequest,
    cancelRequest,
    selectMechanic,
    fetchNearbyMechanics,
  };
};
