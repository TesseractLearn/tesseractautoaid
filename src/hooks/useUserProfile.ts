import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
}

export const useUserProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      } else if (!error) {
        // Profile might not exist yet, try to get name from user metadata
        const metaName = user.user_metadata?.full_name;
        if (metaName) {
          setProfile({ full_name: metaName, phone: null });
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = profile?.full_name || 
                      user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      null;
  
  // Get avatar URL from Google OAuth or generate one
  const avatarUrl = user?.user_metadata?.avatar_url || 
                    user?.user_metadata?.picture || 
                    null;

  return {
    profile,
    displayName,
    avatarUrl,
    isLoading,
    refetch: fetchProfile,
  };
};
