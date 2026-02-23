import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMechanicProfile = () => {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['mechanic-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanics')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated && !!user,
  });
};
