import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface IncomingRequest {
  id: string;
  user_id: string;
  service_type: string;
  issue_description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  user_name?: string;
}

export const useMechanicRequests = () => {
  const { user } = useAuth();
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
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

  // Fetch pending requests
  const fetchRequests = useCallback(async () => {
    if (!mechanicId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch user profiles for display names
      const withNames = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', req.user_id)
            .single();
          return { ...req, user_name: profile?.full_name || 'Unknown User' };
        })
      );

      setRequests(withNames);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, [mechanicId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time subscription for new requests
  useEffect(() => {
    if (!mechanicId) return;

    const channel = supabase
      .channel('mechanic-incoming-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
        },
        async (payload) => {
          const newReq = payload.new as IncomingRequest;
          if (newReq.status !== 'pending') return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', newReq.user_id)
            .single();

          const withName = { ...newReq, user_name: profile?.full_name || 'Unknown User' };
          setRequests(prev => [withName, ...prev]);
          toast.info('🔔 New service request nearby!', { duration: 5000 });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
        },
        (payload) => {
          const updated = payload.new as IncomingRequest;
          if (updated.status !== 'pending') {
            setRequests(prev => prev.filter(r => r.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mechanicId]);

  // Accept a request
  const acceptRequest = useCallback(async (requestId: string) => {
    if (!mechanicId) return;

    try {
      // Insert response
      const { error } = await supabase
        .from('service_request_responses')
        .insert({
          request_id: requestId,
          mechanic_id: mechanicId,
          status: 'accepted',
        });

      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request accepted! User has been notified.');
    } catch (err: any) {
      toast.error('Failed to accept: ' + err.message);
    }
  }, [mechanicId]);

  // Decline a request
  const declineRequest = useCallback(async (requestId: string) => {
    if (!mechanicId) return;

    try {
      await supabase
        .from('service_request_responses')
        .insert({
          request_id: requestId,
          mechanic_id: mechanicId,
          status: 'rejected',
        });

      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.info('Request declined');
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
