import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Search, 
  Bell, 
  ChevronRight,
  Clock,
  Wrench
} from 'lucide-react';
import { 
  PunctureIcon, 
  TowingIcon, 
  EngineIcon, 
  BatteryIcon, 
  EmergencyIcon,
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

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location] = useState('Bandra West, Mumbai');

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
            <div className="flex items-center gap-2">
              <img src={autoaidLogo} alt="AutoAid" className="h-8 w-8" />
              <span className="font-bold text-lg">AutoAid</span>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Bell className="w-5 h-5" />
            </Button>
          </div>

          {/* Location Bar */}
          <button className="flex items-center gap-2 w-full bg-primary-foreground/10 rounded-xl px-4 py-3 text-left">
            <MapPin className="w-5 h-5 text-primary-foreground/80" />
            <div className="flex-1">
              <p className="text-xs text-primary-foreground/60">Your location</p>
              <p className="text-sm font-medium">{location}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary-foreground/60" />
          </button>
        </div>
      </header>

      {/* Find Mechanics Button - Uber style */}
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
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="text-center py-6">
              <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent bookings</p>
              <p className="text-xs text-muted-foreground mt-1">Your booking history will appear here</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserHome;
