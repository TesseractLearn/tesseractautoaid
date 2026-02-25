import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('autoaid_role');
    return (saved as UserRole) || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const syncRoleFromDB = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.role) {
        setRoleState(data.role as UserRole);
        localStorage.setItem('autoaid_role', data.role);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  const ensureProfileExists = async (authUser: User) => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!existing) {
        const fullName = authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] || 'User';
        await supabase.from('profiles').insert({ user_id: authUser.id, full_name: fullName });
      }
    } catch (err) {
      console.error('Error ensuring profile:', err);
    }
  };

  useEffect(() => {
    // 1. Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Reject unverified email users
        if (newSession?.user && !newSession.user.email_confirmed_at) {
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event !== 'INITIAL_SESSION') {
          setIsLoading(false);
        }

        // Sync role + profile on sign-in
        if (newSession?.user?.email_confirmed_at &&
      (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log('[Auth] Event:', event, 'email_confirmed:', newSession.user.email_confirmed_at);
          setTimeout(() => {
            syncRoleFromDB(newSession.user.id);
            ensureProfileExists(newSession.user);
          }, 0);
        }
      }
    );

    // 2. Check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (error || !existingSession) {
        // No session — that's fine, user just isn't logged in
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify the session is still valid with getUser
      supabase.auth.getUser().then(({ data: { user: verifiedUser }, error: userError }) => {
        if (userError || !verifiedUser || !verifiedUser.email_confirmed_at) {
          // Check if it's a network error — if so, trust the cached session
          const msg = userError?.message?.toLowerCase() || '';
          const isNetwork = msg.includes('fetch') || msg.includes('network') || msg.includes('timeout');

          if (isNetwork && existingSession.user) {
            // Network issue — keep the cached session, don't destroy tokens
            setSession(existingSession);
            setUser(existingSession.user);
            syncRoleFromDB(existingSession.user.id).catch(() => {});
          } else {
            // Genuine auth error — clear session
            supabase.auth.signOut().catch(() => {});
            setSession(null);
            setUser(null);
            setRoleState(null);
            localStorage.removeItem('autoaid_role');
          }
        } else {
          setSession(existingSession);
          setUser(verifiedUser);
          syncRoleFromDB(verifiedUser.id);
        }
        setIsLoading(false);
      });
    }).catch(() => {
      // Network failure — don't clear anything, just finish loading
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('autoaid_role', newRole);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoleState(null);
    localStorage.removeItem('autoaid_role');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!session && !!user,
      user, session, role, setRole, logout, isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
