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
    // Restore role from localStorage
    const savedRole = localStorage.getItem('autoaid_role');
    return (savedRole as UserRole) || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle profile creation for OAuth users
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          // Defer the profile check to avoid Supabase deadlock
          setTimeout(() => {
            ensureProfileExists(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure profile exists for OAuth users (Google, etc.)
  const ensureProfileExists = async (user: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile from OAuth data
        const fullName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         'User';
        
        await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: fullName,
          });
      }
    } catch (err) {
      console.error('Error ensuring profile exists:', err);
    }
  };

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

  const isAuthenticated = !!session && !!user;

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      session,
      role, 
      setRole, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
