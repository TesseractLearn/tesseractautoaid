import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Search, 
  Bell, 
  AlertTriangle,
  ChevronRight,
  Star,
  Clock,
  Shield,
  Zap
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

  const nearbyMechanics = [
    { id: 1, name: 'Raju Kumar', rating: 4.8, jobs: 234, distance: '0.8 km', eta: '8 min', speciality: 'Engine Expert' },
    { id: 2, name: 'Suresh Sharma', rating: 4.6, jobs: 156, distance: '1.2 km', eta: '12 min', speciality: 'Battery Specialist' },
    { id: 3, name: 'Amit Patel', rating: 4.9, jobs: 312, distance: '1.5 km', eta: '15 min', speciality: 'All Rounder' },
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

      {/* Emergency Button */}
      <div className="px-4 -mt-4 relative z-10">
        <Button
          variant="emergency"
          size="lg"
          className="w-full shadow-xl"
          onClick={() => navigate('/user/emergency')}
        >
          <AlertTriangle className="w-5 h-5" />
          Emergency Roadside Assistance
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

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <Shield className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">500+</p>
            <p className="text-xs text-muted-foreground">Verified Mechanics</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <Zap className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">10 min</p>
            <p className="text-xs text-muted-foreground">Avg. Response</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">4.8</p>
            <p className="text-xs text-muted-foreground">User Rating</p>
          </div>
        </section>

        {/* Nearby Mechanics */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Nearby Mechanics</h2>
            <button 
              onClick={() => navigate('/user/find-mechanics')}
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              View map <MapPin className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {nearbyMechanics.map((mechanic, index) => (
              <button
                key={mechanic.id}
                className="w-full bg-card rounded-xl p-4 border border-border/50 flex items-center gap-4 hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/user/mechanic/${mechanic.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mechanic.name}`}
                    alt={mechanic.name}
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{mechanic.name}</h3>
                    <span className="flex items-center gap-0.5 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      {mechanic.rating}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{mechanic.speciality} • {mechanic.jobs} jobs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{mechanic.distance}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {mechanic.eta}
                  </p>
                </div>
              </button>
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
