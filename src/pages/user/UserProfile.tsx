import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Car, Bell, Shield, LogOut, ChevronRight, CreditCard, History, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  address: string | null;
  service_type: string;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { profile, displayName, isLoading: profileLoading } = useUserProfile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBookingHistory();
    }
  }, [user]);

  const fetchBookingHistory = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('id, address, service_type, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setBookings(data);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { 
      icon: <Car className="w-5 h-5" />, 
      label: 'My Vehicles', 
      subtitle: vehicleCount > 0 ? `${vehicleCount} vehicle${vehicleCount > 1 ? 's' : ''} added` : 'No vehicles added' 
    },
    { 
      icon: <History className="w-5 h-5" />, 
      label: 'Booking History', 
      subtitle: bookings.length > 0 ? `${bookings.length} recent booking${bookings.length > 1 ? 's' : ''}` : 'No bookings yet' 
    },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Payment Methods', subtitle: 'UPI, Card' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', subtitle: 'Manage alerts' },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', subtitle: 'Account settings' },
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset-top">
      <div className="px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName || 'user'}`}
            alt="Profile"
            className="w-16 h-16 rounded-full border-2 border-primary"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {displayName || 'Loading...'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email || profile?.phone || ''}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
