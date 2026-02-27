import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LocationBar from '@/components/LocationBar';
import { 
  Bell, 
  ChevronRight,
  Clock,
  Wrench,
  Loader2,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  PunctureIcon, 
  TowingIcon, 
  EngineIcon, 
  BatteryIcon,
  WrenchIcon 
} from '@/components/icons/ServiceIcons';
import autoaidLogo from '@/assets/autoaid-logo.png';

interface ServiceCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, name, description, onClick }) => (
  <button
    onClick={onClick}
    className="service-card flex flex-col items-center text-center p-4 min-w-[100px]"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 text-primary">
      {icon}
    </div>
    <span className="text-sm font-medium text-foreground">{name}</span>
    <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
  </button>
);

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { displayName, isLoading: profileLoading } = useUserProfile();
  const { 
    latitude, 
    longitude, 
    accuracy,
    source,
    loading: locationLoading, 
    permissionState, 
    hasLocation,
    requestLocation,
    setManualLocation,
  } = useGeolocation();
  const { placeName, isLoading: geocodeLoading } = useReverseGeocode(latitude, longitude);

  // Location is now auto-requested by useGeolocation when permission is already granted

  const firstName = displayName?.split(' ')[0] || null;

  // Fetch recent bookings
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRecent = async () => {
      setBookingsLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('id, service_type, status, created_at, address, estimated_price, final_price')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentBookings(data || []);
      setBookingsLoading(false);
    };
    fetchRecent();
  }, [user]);

  const services = [
    { icon: <PunctureIcon size={24} />, name: 'Puncture', description: 'Flat tire fix', path: 'puncture' },
    { icon: <BatteryIcon size={24} />, name: 'Battery', description: 'Jump start', path: 'battery' },
    { icon: <TowingIcon size={24} />, name: 'Towing', description: 'Vehicle tow', path: 'towing' },
    { icon: <EngineIcon size={24} />, name: 'Engine', description: 'Engine issues', path: 'engine' },
    { icon: <WrenchIcon size={24} />, name: 'General', description: 'All repairs', path: 'general' },
  ];



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground safe-area-inset-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-sm text-primary-foreground/80">
                {profileLoading ? 'Welcome' : firstName ? `Hi, ${firstName}` : 'Welcome'}
              </span>
              <div className="flex items-center gap-2">
                <img src={autoaidLogo} alt="AutoAid" className="h-8 w-8" />
                <span className="font-bold text-lg">AutoAid</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Bell className="w-5 h-5" />
            </Button>
          </div>

          {/* Location Bar */}
          <LocationBar
            latitude={latitude}
            longitude={longitude}
            accuracy={accuracy}
            source={source}
            placeName={placeName}
            loading={locationLoading}
            geocodeLoading={geocodeLoading}
            hasLocation={hasLocation}
            onRequestLocation={requestLocation}
            variant="header"
          />
        </div>
      </header>

      {/* Find Mechanics Button */}
      <div className="px-4 -mt-4 relative z-10">
        <Button
          variant="default"
          size="lg"
          className="w-full shadow-xl bg-primary hover:bg-primary/90"
          onClick={() => navigate('/user/find-mechanics')}
        >
          <Wrench className="w-5 h-5" />
          Find Mechanics
        </Button>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Services Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Services</h2>
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {services.map((service) => (
              <ServiceCard
                key={service.path}
                icon={service.icon}
                name={service.name}
                description={service.description}
                onClick={() => navigate(`/user/book/${service.path}`)}
              />
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            {recentBookings.length > 0 && (
              <button 
                className="text-sm text-primary font-medium flex items-center gap-1"
                onClick={() => navigate('/user/history')}
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border/50">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent bookings</p>
                <p className="text-xs text-muted-foreground mt-1">Your booking history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {booking.service_type.replace('_', ' ')} Service
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.address || format(new Date(booking.created_at), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        ₹{booking.final_price || booking.estimated_price || '—'}
                      </p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[booking.status] || 'bg-muted text-muted-foreground'}`}>
                        {statusLabels[booking.status] || booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserHome;
