import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MapPin, Loader2, X, Star, Clock, CheckCircle2, User, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useServiceRequests, NearbyMechanic } from '@/hooks/useServiceRequests';
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

const MechanicCard: React.FC<{
  mechanic: NearbyMechanic;
  onSelect: () => void;
  selecting: boolean;
}> = ({ mechanic, onSelect, selecting }) => (
  <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <User className="w-6 h-6 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-sm text-foreground truncate">{mechanic.full_name}</h3>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        {mechanic.rating != null && mechanic.rating > 0 && (
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {Number(mechanic.rating).toFixed(1)}
          </span>
        )}
        <span>{mechanic.distance}km</span>
        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          ~{mechanic.eta_minutes}min
        </span>
      </div>
      {mechanic.specialization && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{mechanic.specialization}</p>
      )}
    </div>
    <div className="flex flex-col items-end gap-1">
      {mechanic.is_available && (
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      )}
      <Button size="sm" onClick={onSelect} disabled={selecting} className="text-xs h-8">
        {selecting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Select'}
      </Button>
    </div>
  </div>
);

const FindMechanics: React.FC = () => {
  const navigate = useNavigate();
  const { latitude, longitude, hasLocation } = useGeolocation();
  const {
    activeBooking,
    offers,
    nearbyMechanics,
    loading: requestLoading,
    dispatching,
    selecting,
    createRequest,
    cancelRequest,
    selectMechanic,
  } = useServiceRequests();

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

  const handleSelectMechanic = (mechanicId: string) => {
    selectMechanic(mechanicId);
  };

  const onlineMechanics = nearbyMechanics.filter(m => m.is_available);
  const offlineMechanics = nearbyMechanics.filter(m => !m.is_available);

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

      <main className="p-4 space-y-5 pb-24">
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
          <div className="space-y-6">
            {/* Status Header */}
            <div className="text-center py-6 space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {activeBooking?.status === 'offer_sent' ? 'Offers sent to mechanics!' : 'Searching for mechanics...'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your <span className="font-medium text-primary">{activeBooking?.service_type}</span> request is live
                </p>
              </div>

              {/* Live Stats */}
              <div className="flex justify-center gap-4">
                <div className="bg-card rounded-lg px-4 py-2 border border-border">
                  <p className="text-lg font-bold text-foreground">{nearbyMechanics.length}</p>
                  <p className="text-[10px] text-muted-foreground">Nearby</p>
                </div>
                <div className="bg-card rounded-lg px-4 py-2 border border-border">
                  <p className="text-lg font-bold text-emerald-600">{onlineMechanics.length}</p>
                  <p className="text-[10px] text-muted-foreground">Online</p>
                </div>
              </div>

              {activeBooking?.status === 'accepted' && (
                <div className="bg-success/10 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                  <p className="text-sm font-medium text-foreground">Mechanic assigned! Redirecting...</p>
                </div>
              )}
            </div>

            {/* Nearby Mechanics List */}
            {nearbyMechanics.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-foreground">Nearby Mechanics</h3>
                  <span className="text-xs text-muted-foreground">{nearbyMechanics.length} found</span>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  Select a mechanic manually or wait for one to accept your request
                </p>

                <div className="space-y-3">
                  {onlineMechanics.map(m => (
                    <MechanicCard
                      key={m.id}
                      mechanic={m}
                      onSelect={() => handleSelectMechanic(m.id)}
                      selecting={selecting}
                    />
                  ))}
                  {offlineMechanics.length > 0 && onlineMechanics.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-2">Offline mechanics</p>
                  )}
                  {offlineMechanics.map(m => (
                    <div key={m.id} className="opacity-50">
                      <MechanicCard
                        mechanic={m}
                        onSelect={() => {}}
                        selecting={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={handleCancel} className="w-full">
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
