import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  issue_description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  radius_km: number;
  target_mechanic_id: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

interface ServiceRequestResponse {
  id: string;
  request_id: string;
  mechanic_id: string;
  status: string;
  created_at: string;
}

interface MechanicWithDetails {
  id: string;
  full_name: string;
  phone: string | null;
  specialization: string | null;
  rating: number | null;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const useServiceRequests = () => {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [responses, setResponses] = useState<(ServiceRequestResponse & { mechanic?: MechanicWithDetails })[]>([]);
  const [loading, setLoading] = useState(false);

  // Create a service request (broadcast or direct)
  const createRequest = useCallback(async (params: {
    serviceType: string;
    issueDescription?: string;
    latitude: number;
    longitude: number;
    address?: string;
    targetMechanicId?: string;
    radiusKm?: number;
  }) => {
    if (!user) return null;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          service_type: params.serviceType,
          issue_description: params.issueDescription || null,
          latitude: params.latitude,
          longitude: params.longitude,
          address: params.address || null,
          target_mechanic_id: params.targetMechanicId || null,
          radius_km: params.radiusKm || 10,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      setActiveRequest(data);
      toast.success(params.targetMechanicId ? 'Request sent to mechanic!' : 'Request broadcasted to nearby mechanics!');
      return data;
    } catch (err: any) {
      toast.error('Failed to send request: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cancel a request
  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);
      if (error) throw error;
      setActiveRequest(null);
      setResponses([]);
      toast.info('Request cancelled');
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    }
  }, []);

  // Accept a mechanic's response
  const acceptResponse = useCallback(async (responseId: string, mechanicId: string, requestId: string) => {
    try {
      // Update request status
      await supabase
        .from('service_requests')
        .update({ status: 'accepted', target_mechanic_id: mechanicId })
        .eq('id', requestId);

      // Create booking from the request
      if (activeRequest) {
        await supabase.from('bookings').insert({
          user_id: activeRequest.user_id,
          mechanic_id: mechanicId,
          service_type: activeRequest.service_type,
          issue_description: activeRequest.issue_description,
          latitude: activeRequest.latitude,
          longitude: activeRequest.longitude,
          address: activeRequest.address,
          status: 'accepted',
        });
      }

      setActiveRequest(null);
      toast.success('Mechanic accepted! They are on their way.');
    } catch (err: any) {
      toast.error('Failed to accept: ' + err.message);
    }
  }, [activeRequest]);

  // Listen for responses to user's active request
  useEffect(() => {
    if (!activeRequest) return;

    // Fetch existing responses
    const fetchResponses = async () => {
      const { data } = await supabase
        .from('service_request_responses')
        .select('*')
        .eq('request_id', activeRequest.id);
      
      if (data) {
        // Fetch mechanic details for each response
        const withMechanics = await Promise.all(
          data.map(async (r) => {
            const { data: mech } = await supabase
              .from('mechanics')
              .select('*')
              .eq('id', r.mechanic_id)
              .single();
            return { ...r, mechanic: mech || undefined };
          })
        );
        setResponses(withMechanics);
      }
    };

    fetchResponses();

    // Real-time subscription for new responses
    const channel = supabase
      .channel(`request-responses-${activeRequest.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_request_responses',
          filter: `request_id=eq.${activeRequest.id}`,
        },
        async (payload) => {
          const newResponse = payload.new as ServiceRequestResponse;
          const { data: mech } = await supabase
            .from('mechanics')
            .select('*')
            .eq('id', newResponse.mechanic_id)
            .single();
          
          setResponses(prev => [...prev, { ...newResponse, mechanic: mech || undefined }]);
          toast.success(`${mech?.full_name || 'A mechanic'} responded to your request!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRequest]);

  // Check for existing active request on mount
  useEffect(() => {
    if (!user) return;
    
    const checkActive = async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setActiveRequest(data);
    };

    checkActive();
  }, [user]);

  return {
    activeRequest,
    responses,
    loading,
    createRequest,
    cancelRequest,
    acceptResponse,
  };
};
