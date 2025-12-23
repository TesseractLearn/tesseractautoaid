import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  Star,
  Clock,
  ChevronRight,
  Navigation,
  CheckCircle
} from 'lucide-react';

const serviceDetails: Record<string, { name: string; basePrice: number; description: string }> = {
  puncture: { name: 'Puncture Repair', basePrice: 250, description: 'Professional flat tire repair service' },
  battery: { name: 'Battery Service', basePrice: 350, description: 'Battery jump start and replacement' },
  towing: { name: 'Towing Service', basePrice: 800, description: 'Safe vehicle towing to nearest garage' },
  engine: { name: 'Engine Repair', basePrice: 1000, description: 'Engine diagnostics and repair' },
  ac: { name: 'AC Service', basePrice: 1200, description: 'AC gas refill and compressor service' },
  brakes: { name: 'Brake Service', basePrice: 800, description: 'Brake pad replacement and disc service' },
  oil: { name: 'Oil Change', basePrice: 1000, description: 'Engine oil and filter change' },
  general: { name: 'General Repair', basePrice: 500, description: 'General vehicle repair and maintenance' },
};

const nearbyMechanics = [
  { id: 1, name: 'Raju Kumar', rating: 4.8, jobs: 234, distance: '0.8 km', eta: '8 min', speciality: 'Engine Expert', avatar: 'raju' },
  { id: 2, name: 'Suresh Sharma', rating: 4.6, jobs: 156, distance: '1.2 km', eta: '12 min', speciality: 'Battery Specialist', avatar: 'suresh' },
  { id: 3, name: 'Amit Patel', rating: 4.9, jobs: 312, distance: '1.5 km', eta: '15 min', speciality: 'All Rounder', avatar: 'amit' },
];

const BookService: React.FC = () => {
  const navigate = useNavigate();
  const { serviceType } = useParams<{ serviceType: string }>();
  const [step, setStep] = useState<'details' | 'mechanic' | 'confirm'>('details');
  const [description, setDescription] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState<number | null>(null);
  const [location] = useState('Bandra West, Mumbai');

  const service = serviceDetails[serviceType || 'general'] || serviceDetails.general;

  const handleConfirmBooking = () => {
    // In real app, this would create a booking
    navigate('/user/track');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border safe-area-inset-top sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (step === 'mechanic') setStep('details');
            else if (step === 'confirm') setStep('mechanic');
            else navigate(-1);
          }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">{service.name}</h1>
            <p className="text-xs text-muted-foreground">
              {step === 'details' ? 'Describe your issue' : step === 'mechanic' ? 'Choose a mechanic' : 'Confirm booking'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className={`flex-1 h-1 rounded-full ${step === 'details' || step === 'mechanic' || step === 'confirm' ? 'bg-primary' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'mechanic' || step === 'confirm' ? 'bg-primary' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-border'}`} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        {step === 'details' && (
          <div className="space-y-6 animate-fade-in">
            {/* Location */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Your Location</label>
              <button className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{location}</p>
                  <p className="text-xs text-muted-foreground">Tap to change location</p>
                </div>
                <Navigation className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Issue Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Describe Your Issue</label>
              <Textarea
                placeholder="Tell us more about your vehicle issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] rounded-xl resize-none"
              />
            </div>

            {/* Add Photos */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Add Photos (Optional)</label>
              <button className="w-full flex items-center justify-center gap-2 p-6 bg-card rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors">
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-muted-foreground">Tap to add photos</span>
              </button>
            </div>

            {/* Price Estimate */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Price</span>
                <span className="text-lg font-bold text-foreground">₹{service.basePrice}+</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Final price may vary based on actual work</p>
            </div>
          </div>
        )}

        {step === 'mechanic' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">Select a mechanic based on ratings and proximity</p>
            
            {nearbyMechanics.map((mechanic, index) => (
              <button
                key={mechanic.id}
                onClick={() => setSelectedMechanic(mechanic.id)}
                className={`w-full bg-card rounded-xl p-4 border-2 transition-all animate-fade-in ${
                  selectedMechanic === mechanic.id 
                    ? 'border-primary shadow-md' 
                    : 'border-border/50 hover:border-primary/30'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mechanic.avatar}`}
                      alt={mechanic.name}
                      className="w-14 h-14 rounded-full"
                    />
                    {selectedMechanic === mechanic.id && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
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
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {mechanic.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA {mechanic.eta}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'confirm' && selectedMechanic && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Confirm Your Booking</h2>
              <p className="text-sm text-muted-foreground mt-1">Review the details before confirming</p>
            </div>

            {/* Booking Summary */}
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Service</p>
                <p className="font-semibold text-foreground">{service.name}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="font-medium text-foreground">{location}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Mechanic</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nearbyMechanics.find(m => m.id === selectedMechanic)?.avatar}`}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-foreground">{nearbyMechanics.find(m => m.id === selectedMechanic)?.name}</p>
                    <p className="text-xs text-muted-foreground">ETA: {nearbyMechanics.find(m => m.id === selectedMechanic)?.eta}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Estimated Price</p>
                  <p className="text-xl font-bold text-foreground">₹{service.basePrice}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action */}
      <div className="p-4 bg-card border-t border-border safe-area-inset-bottom">
        {step === 'details' && (
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={() => setStep('mechanic')}
          >
            Find Nearby Mechanics
          </Button>
        )}
        {step === 'mechanic' && (
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={() => setStep('confirm')}
            disabled={!selectedMechanic}
          >
            Continue with Selected Mechanic
          </Button>
        )}
        {step === 'confirm' && (
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={handleConfirmBooking}
          >
            Confirm Booking • ₹{service.basePrice}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookService;
