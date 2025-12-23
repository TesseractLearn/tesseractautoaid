import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PunctureIcon, 
  TowingIcon, 
  EngineIcon, 
  BatteryIcon, 
  ACIcon,
  BrakesIcon,
  OilIcon,
  WrenchIcon 
} from '@/components/icons/ServiceIcons';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ServiceItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  price: string;
  duration: string;
}

const services: ServiceItem[] = [
  { id: 'puncture', icon: <PunctureIcon size={28} />, name: 'Puncture Repair', description: 'Flat tire fix & tube repair', price: '₹150-350', duration: '20-30 min' },
  { id: 'battery', icon: <BatteryIcon size={28} />, name: 'Battery Service', description: 'Jump start & replacement', price: '₹200-2500', duration: '15-45 min' },
  { id: 'towing', icon: <TowingIcon size={28} />, name: 'Towing Service', description: 'Vehicle breakdown towing', price: '₹500-2000', duration: 'Varies' },
  { id: 'engine', icon: <EngineIcon size={28} />, name: 'Engine Repair', description: 'Engine diagnostics & repair', price: '₹500-5000', duration: '1-4 hrs' },
  { id: 'ac', icon: <ACIcon size={28} />, name: 'AC Service', description: 'AC gas refill & repair', price: '₹800-3000', duration: '1-2 hrs' },
  { id: 'brakes', icon: <BrakesIcon size={28} />, name: 'Brake Service', description: 'Brake pad & disc service', price: '₹500-2500', duration: '1-2 hrs' },
  { id: 'oil', icon: <OilIcon size={28} />, name: 'Oil Change', description: 'Engine oil replacement', price: '₹800-2000', duration: '30-45 min' },
  { id: 'general', icon: <WrenchIcon size={28} />, name: 'General Repair', description: 'All other repairs', price: 'Varies', duration: 'Varies' },
];

const UserServices: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border safe-area-inset-top sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">All Services</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search services..."
              className="pl-10 h-10 rounded-xl"
            />
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {services.map((service, index) => (
            <button
              key={service.id}
              onClick={() => navigate(`/user/book/${service.id}`)}
              className="bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                {service.icon}
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{service.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary font-medium">{service.price}</span>
                <span className="text-muted-foreground">{service.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default UserServices;
