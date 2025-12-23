import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Bell, Shield, LogOut, ChevronRight, CreditCard } from 'lucide-react';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: <Car className="w-5 h-5" />, label: 'My Vehicles', subtitle: '1 vehicle added' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Saved Addresses', subtitle: '2 addresses' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Payment Methods', subtitle: 'UPI, Card' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', subtitle: 'Manage alerts' },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', subtitle: 'Account settings' },
  ];

  return (
    <div className="min-h-screen bg-background safe-area-inset-top">
      <div className="px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=rahul"
            alt="Profile"
            className="w-16 h-16 rounded-full border-2 border-primary"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Rahul Sharma</h1>
            <p className="text-sm text-muted-foreground">+91 98765 43210</p>
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
