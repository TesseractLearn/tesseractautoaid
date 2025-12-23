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
import { ArrowLeft, Search, CheckCircle, Clock, Shield, MapPin, Headphones } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ServiceItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
}

const services: ServiceItem[] = [
  { id: 'puncture', icon: <PunctureIcon size={28} />, name: 'Puncture Repair', description: 'Flat tire fix & tube repair' },
  { id: 'battery', icon: <BatteryIcon size={28} />, name: 'Battery Service', description: 'Jump start & replacement' },
  { id: 'towing', icon: <TowingIcon size={28} />, name: 'Towing Service', description: 'Vehicle breakdown towing' },
  { id: 'engine', icon: <EngineIcon size={28} />, name: 'Engine Repair', description: 'Engine diagnostics & repair' },
  { id: 'ac', icon: <ACIcon size={28} />, name: 'AC Service', description: 'AC gas refill & repair' },
  { id: 'brakes', icon: <BrakesIcon size={28} />, name: 'Brake Service', description: 'Brake pad & disc service' },
  { id: 'oil', icon: <OilIcon size={28} />, name: 'Oil Change', description: 'Engine oil replacement' },
  { id: 'general', icon: <WrenchIcon size={28} />, name: 'General Repair', description: 'All other repairs' },
];

const advantages = [
  { icon: <Clock className="w-5 h-5" />, title: 'Quick Response', description: 'Get help within minutes, not hours' },
  { icon: <MapPin className="w-5 h-5" />, title: 'Doorstep Service', description: 'Mechanics come to your location' },
  { icon: <Shield className="w-5 h-5" />, title: 'Trusted Mechanics', description: 'Verified and skilled professionals' },
  { icon: <Headphones className="w-5 h-5" />, title: '24/7 Support', description: 'Available anytime you need us' },
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

      <main className="px-4 py-6 space-y-8">
        {/* Services Grid */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 animate-fade-in">Our Services</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service, index) => (
              <button
                key={service.id}
                onClick={() => navigate(`/user/book/${service.id}`)}
                className="bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  {service.icon}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{service.name}</h3>
                <p className="text-xs text-muted-foreground">{service.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Why Choose AutoAid */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Why Choose AutoAid?</h2>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 border border-primary/20">
            <ul className="space-y-4">
              {advantages.map((advantage, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {advantage.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{advantage.title}</h4>
                    <p className="text-sm text-muted-foreground">{advantage.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Key Features */}
        <section className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">What We Offer</h2>
          <div className="space-y-3">
            {[
              'Instant mechanic booking at your location',
              'Real-time tracking of mechanic arrival',
              'Transparent and fair pricing',
              'Secure payment options',
              'Service history and records',
              'Customer support available round the clock'
            ].map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 animate-fade-in"
                style={{ animationDelay: `${1.0 + index * 0.08}s` }}
              >
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserServices;
