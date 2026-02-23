import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MapPin, Loader2, X, Star, Phone, CheckCircle2 } from 'lucide-react';
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
  const { latitude, longitude, hasLocation, permissionState, requestLocation, loading: gpsLoading } = useGeolocation();
  const { activeRequest, responses, loading: requestLoading, createRequest, cancelRequest, acceptResponse } = useServiceRequests();

  const [selectedService, setSelectedService] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [step, setStep] = useState<'gps' | 'service' | 'waiting' | 'responses'>('gps');

  // Auto-advance from GPS step once location is available
  React.useEffect(() => {
    if (hasLocation && step === 'gps') {
      setStep('service');
    }
  }, [hasLocation, step]);

  // If there's already an active request, go to waiting
  React.useEffect(() => {
    if (activeRequest) {
      setStep(responses.length > 0 ? 'responses' : 'waiting');
    }
  }, [activeRequest, responses.length]);

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
    if (activeRequest) {
      cancelRequest(activeRequest.id);
      setStep('service');
    }
  };

  const handleAcceptMechanic = (responseId: string, mechanicId: string) => {
    if (activeRequest) {
      acceptResponse(responseId, mechanicId, activeRequest.id);
      navigate('/user/track');
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
      {/* Header */}
      <header className="bg-background border-b border-border safe-area-inset-top sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {step === 'service' ? 'Request Service' : step === 'waiting' ? 'Finding Mechanics...' : 'Mechanic Responses'}
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* Service selection step */}
        {step === 'service' && (
          <>
            {/* Location indicator */}
            <div className="flex items-center gap-2 bg-success/10 rounded-xl px-4 py-3">
              <MapPin className="w-5 h-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">GPS Location Active</p>
                <p className="text-sm font-medium text-foreground">
                  {latitude?.toFixed(4)}°, {longitude?.toFixed(4)}°
                </p>
              </div>
            </div>

            {/* Service type selection */}
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

            {/* Issue description */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-2">Describe your issue (optional)</h2>
              <Textarea
                placeholder="e.g. Front left tire is flat, need immediate help..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Map preview */}
            <div className="rounded-xl overflow-hidden border border-border h-48">
              <NearbyMechanicsMap />
            </div>

            {/* Broadcast button */}
            <Button
              size="lg"
              className="w-full"
              disabled={!selectedService || requestLoading}
              onClick={handleBroadcast}
            >
              {requestLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Send Request to Nearby Mechanics
            </Button>
          </>
        )}

        {/* Waiting for responses */}
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
              <h2 className="text-xl font-bold text-foreground">Looking for mechanics...</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your request for <span className="font-medium text-primary">{activeRequest?.service_type}</span> has been sent to nearby mechanics.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be notified when a mechanic responds
              </p>
            </div>

            <Button variant="outline" onClick={handleCancel} className="mt-4">
              <X className="w-4 h-4 mr-2" />
              Cancel Request
            </Button>
          </div>
        )}

        {/* Mechanic responses */}
        {step === 'responses' && (
          <div className="space-y-4">
            <div className="bg-success/10 rounded-xl px-4 py-3 text-center">
              <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
              <p className="text-sm font-medium text-foreground">
                {responses.length} mechanic{responses.length > 1 ? 's' : ''} responded!
              </p>
            </div>

            {responses
              .filter((r) => r.status === 'accepted')
              .map((response) => (
                <div
                  key={response.id}
                  className="bg-card rounded-xl p-4 border-2 border-success/30 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${response.mechanic?.full_name}`}
                      alt={response.mechanic?.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{response.mechanic?.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{response.mechanic?.specialization || 'General Mechanic'}</p>
                    </div>
                    {response.mechanic?.rating && (
                      <div className="flex items-center gap-1 text-warning">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{response.mechanic.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {response.mechanic?.phone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${response.mechanic.phone}`}>
                          <Phone className="w-4 h-4 mr-1" /> Call
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAcceptMechanic(response.id, response.mechanic_id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                    </Button>
                  </div>
                </div>
              ))}

            <Button variant="outline" onClick={handleCancel} className="w-full mt-2">
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
