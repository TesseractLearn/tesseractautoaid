import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, MapPin, Wrench, Phone, User, Navigation, CheckCircle, CheckCircle2 } from 'lucide-react';
import autoaidLogo from '@/assets/autoaid-logo.png';

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().min(10, 'Enter a valid phone number').max(15),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),
  address: z.string().trim().min(5, 'Enter a valid address').max(300),
});

const specializations = [
  { id: 'general', label: 'General Mechanic' },
  { id: 'puncture', label: 'Puncture Repair' },
  { id: 'battery', label: 'Battery & Electrical' },
  { id: 'engine', label: 'Engine Specialist' },
  { id: 'ac_repair', label: 'AC Repair' },
  { id: 'denting', label: 'Denting & Painting' },
  { id: 'towing', label: 'Towing Service' },
  { id: 'oil_service', label: 'Oil & Lube Service' },
];

const ALL_IDS = specializations.map(s => s.id);

const MechanicRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude, requestLocation, loading: geoLoading, hasLocation, error: geoError } = useGeolocation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Pre-fill name from profile
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      setFullName(name);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    const result = registrationSchema.safeParse({ fullName, phone, specializations: selectedSpecs, address });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (!hasLocation) {
      setError('Location is required. Please enable location access.');
      return;
    }

    if (!user) {
      setError('You must be logged in.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase.from('mechanics').insert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        specialization: selectedSpecs.length === ALL_IDS.length ? 'All Services' : specializations.find(s => s.id === selectedSpecs[0])?.label || selectedSpecs[0],
        services_offered: selectedSpecs,
        address: address.trim(),
        latitude: latitude!,
        longitude: longitude!,
        is_available: true,
      });

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          toast.success('Profile already exists! Redirecting...');
          navigate('/mechanic', { replace: true });
          return;
        }
        throw insertError;
      }

      toast.success('Registration complete! Welcome to AutoAid.');
      navigate('/mechanic', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1526] to-[#000000] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <header className={`pt-12 pb-4 px-6 relative z-10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="flex flex-col items-center">
          <img src={autoaidLogo} alt="AutoAid" className="h-12 w-auto rounded-xl mb-4" />
          <h1 className="text-xl font-bold text-white tracking-tight">Complete Your Profile</h1>
          <p className="text-white/50 text-sm mt-1">Set up your mechanic account to start receiving jobs</p>
        </div>
      </header>

      {/* Form */}
      <main className={`flex-1 px-5 py-6 relative z-10 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <User className="w-4 h-4" /> Full Name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="bg-white/[0.08] border-white/[0.1] text-white placeholder:text-white/30 rounded-xl h-12"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              type="tel"
              maxLength={15}
              className="bg-white/[0.08] border-white/[0.1] text-white placeholder:text-white/30 rounded-xl h-12"
            />
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Specializations
            </label>
            <p className="text-xs text-white/40">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {/* All option */}
              <Badge
                variant={selectedSpecs.length === ALL_IDS.length ? 'default' : 'outline'}
                className={`cursor-pointer transition-all px-3 py-1.5 text-sm ${
                  selectedSpecs.length === ALL_IDS.length
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/[0.06] border-white/[0.15] text-white/70 hover:border-primary/50'
                }`}
                onClick={() => {
                  setSelectedSpecs(prev =>
                    prev.length === ALL_IDS.length ? [] : [...ALL_IDS]
                  );
                }}
              >
                {selectedSpecs.length === ALL_IDS.length && <CheckCircle2 className="w-3 h-3 mr-1" />}
                All Services
              </Badge>
              {specializations.map((s) => {
                const active = selectedSpecs.includes(s.id);
                return (
                  <Badge
                    key={s.id}
                    variant={active ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all px-3 py-1.5 text-sm ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/[0.06] border-white/[0.15] text-white/70 hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedSpecs(prev =>
                        prev.includes(s.id)
                          ? prev.filter(x => x !== s.id)
                          : [...prev, s.id]
                      );
                    }}
                  >
                    {active && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {s.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Workshop / Base Address
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your workshop or base location"
              className="bg-white/[0.08] border-white/[0.1] text-white placeholder:text-white/30 rounded-xl h-12"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Navigation className="w-4 h-4" /> GPS Location
            </label>
            {hasLocation ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300">Location captured successfully</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={requestLocation}
                disabled={geoLoading}
                className="w-full h-12 rounded-xl bg-white/[0.06] border-white/[0.1] text-white hover:bg-white/[0.1]"
              >
                {geoLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting location...</>
                ) : (
                  <><MapPin className="w-4 h-4 mr-2" /> Enable Location Access</>
                )}
              </Button>
            )}
            {geoError && <p className="text-xs text-red-400">{geoError}</p>}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || !hasLocation}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base shadow-lg shadow-orange-500/20"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Profile...</>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default MechanicRegistration;
