import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  Star,
  Clock,
  ChevronRight,
  Navigation,
  CheckCircle,
  Loader2
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

interface NearbyMechanic {
  id: string;
  full_name: string;
  rating: number;
  total_jobs_count: number;
  specialization: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  eta: string;
}

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const BookService: React.FC = () => {
  const navigate = useNavigate();
  const { serviceType } = useParams<{ serviceType: string }>();
  const [step, setStep] = useState<'details' | 'mechanic' | 'confirm'>('details');
  const [description, setDescription] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);

  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { placeName } = useReverseGeocode(latitude, longitude);
  const location = placeName || 'Getting location...';

  const [mechanics, setMechanics] = useState<NearbyMechanic[]>([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);

  const service = serviceDetails[serviceType || 'general'] || serviceDetails.general;

  // Fetch nearby mechanics when moving to mechanic step
  useEffect(() => {
    if (step !== 'mechanic' || !latitude || !longitude) return;

    const fetchMechanics = async () => {
      setMechanicsLoading(true);
      try {
        const { data, error } = await supabase
          .from('mechanics_public')
          .select('id, full_name, specialization, latitude, longitude, rating, is_available, total_jobs_count');

        if (error) throw error;

        const nearby = (data || [])
          .filter(m => m.is_available && m.latitude && m.longitude)
          .map(m => {
            const dist = haversineDistance(latitude, longitude, m.latitude!, m.longitude!);
            const etaMin = Math.round((dist / 30) * 60); // ~30 km/h avg
            return {
              id: m.id!,
              full_name: m.full_name || 'Unknown',
              rating: Number(m.rating) || 0,
              total_jobs_count: m.total_jobs_count || 0,
              specialization: m.specialization,
              latitude: m.latitude!,
              longitude: m.longitude!,
              distance: dist,
              eta: etaMin < 60 ? `${etaMin} min` : `${(etaMin / 60).toFixed(1)} hr`,
            } as NearbyMechanic;
          })
          .sort((a, b) => a.distance - b.distance);

        setMechanics(nearby);
      } catch (err) {
        console.error('Failed to fetch mechanics:', err);
      } finally {
        setMechanicsLoading(false);
      }
    };

    fetchMechanics();
  }, [step, latitude, longitude]);

  const selectedMech = mechanics.find(m => m.id === selectedMechanic);

  const handleConfirmBooking = () => {
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
                  <p className="font-medium text-foreground">{geoLoading ? 'Getting location...' : location}</p>
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

            {mechanicsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Finding nearby mechanics...</p>
              </div>
            ) : mechanics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <MapPin className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No mechanics available nearby right now. Try again later.</p>
              </div>
            ) : (
              mechanics.map((mechanic, index) => (
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
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mechanic.full_name}`}
                        alt={mechanic.full_name}
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
                        <h3 className="font-semibold text-foreground">{mechanic.full_name}</h3>
                        <span className="flex items-center gap-0.5 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          {mechanic.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mechanic.specialization || 'General'} • {mechanic.total_jobs_count} jobs
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {mechanic.distance < 1
                            ? `${(mechanic.distance * 1000).toFixed(0)}m`
                            : `${mechanic.distance.toFixed(1)} km`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ETA {mechanic.eta}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {step === 'confirm' && selectedMech && (
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
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMech.full_name}`}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-foreground">{selectedMech.full_name}</p>
                    <p className="text-xs text-muted-foreground">ETA: {selectedMech.eta}</p>
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
