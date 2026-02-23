import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MapPin, Loader2, X, Star, Phone, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import LocationPermission from '@/components/LocationPermission';
import NearbyMechanicsMap from '@/components/NearbyMechanicsMap';
import {
  PunctureIcon,
  TowingIcon,
  EngineIcon,
  BatteryIcon,
  WrenchIcon,
} from '@/components/icons/ServiceIcons';

const serviceOptions = [
  { id: 'puncture', name: 'Puncture', icon: <PunctureIcon size={20} /> },
  { id: 'battery', name: 'Battery', icon: <BatteryIcon size={20} /> },
  { id: 'towing', name: 'Towing', icon: <TowingIcon size={20} /> },
  { id: 'engine', name: 'Engine', icon: <EngineIcon size={20} /> },
  { id: 'general', name: 'General', icon: <WrenchIcon size={20} /> },
];

const FindMechanics: React.FC = () => {
  const navigate = useNavigate();
  const { latitude, longitude, hasLocation } = useGeolocation();
  const { activeBooking, offers, loading: requestLoading, dispatching, createRequest, cancelRequest } = useServiceRequests();

  const [selectedService, setSelectedService] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [step, setStep] = useState<'gps' | 'service' | 'waiting' | 'responses'>('gps');

  React.useEffect(() => {
    if (hasLocation && step === 'gps') setStep('service');
  }, [hasLocation, step]);

  React.useEffect(() => {
    if (activeBooking) {
      if (activeBooking.status === 'accepted') {
        navigate('/user/track');
      } else if (activeBooking.status === 'no_mechanic_found') {
        setStep('service');
      } else {
        setStep('waiting');
      }
    }
  }, [activeBooking, navigate]);

  const handleBroadcast = async () => {
    if (!latitude || !longitude || !selectedService) return;
    const result = await createRequest({
      serviceType: selectedService,
      issueDescription: issueDescription || undefined,
      latitude,
      longitude,
    });
    if (result) setStep('waiting');
  };

  const handleCancel = () => {
    if (activeBooking) {
      cancelRequest(activeBooking.id);
      setStep('service');
    }
  };

  // GPS permission step
  if (step === 'gps' && !hasLocation) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background border-b border-border safe-area-inset-top sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Find Mechanics</h1>
          </div>
        </header>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <LocationPermission
            onLocationGranted={() => setStep('service')}
            onPermissionDenied={() => {}}
            className="max-w-sm w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border safe-area-inset-top sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {step === 'service' ? 'Request Service' : 'Finding Mechanics...'}
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {step === 'service' && (
          <>
            <div className="flex items-center gap-2 bg-success/10 rounded-xl px-4 py-3">
              <MapPin className="w-5 h-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">GPS Location Active</p>
                <p className="text-sm font-medium text-foreground">
                  {latitude?.toFixed(4)}°, {longitude?.toFixed(4)}°
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">What do you need?</h2>
              <div className="grid grid-cols-3 gap-3">
                {serviceOptions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      selectedService === s.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                      {s.icon}
                    </div>
                    <span className="text-sm font-medium">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground mb-2">Describe your issue (optional)</h2>
              <Textarea
                placeholder="e.g. Front left tire is flat, need immediate help..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-border h-48">
              <NearbyMechanicsMap />
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!selectedService || requestLoading || dispatching}
              onClick={handleBroadcast}
            >
              {(requestLoading || dispatching) ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {dispatching ? 'Finding Best Mechanics...' : 'Send Request to Nearby Mechanics'}
            </Button>
          </>
        )}

        {step === 'waiting' && (
          <div className="text-center py-12 space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                {activeBooking?.status === 'offer_sent' ? 'Offers sent to mechanics!' : 'Searching for mechanics...'}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your <span className="font-medium text-primary">{activeBooking?.service_type}</span> request has been sent to the best-matched mechanics nearby.
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Waiting for a mechanic to accept...
              </p>
            </div>

            {activeBooking?.status === 'accepted' && (
              <div className="bg-success/10 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Mechanic assigned! Redirecting...</p>
              </div>
            )}

            <Button variant="outline" onClick={handleCancel} className="mt-4">
              <X className="w-4 h-4 mr-2" />
              Cancel Request
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default FindMechanics;
