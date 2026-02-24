import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, MapPin, Loader2, X, Star, Clock, CheckCircle2, User, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { useServiceRequests, NearbyMechanic } from '@/hooks/useServiceRequests';
import LocationPermission from '@/components/LocationPermission';
import LocationBar from '@/components/LocationBar';
import NearbyMechanicsMap from '@/components/NearbyMechanicsMap';
import SymptomPicker from '@/components/SymptomPicker';
import { computePriceEstimate, computeSeverity } from '@/data/vehicleSymptoms';
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
  onViewProfile?: () => void;
}> = ({ mechanic, onSelect, selecting, onViewProfile }) => (
  <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
    <div
      className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
      onClick={onViewProfile}
      title="View profile"
    >
      <User className="w-6 h-6 text-primary" />
    </div>
    <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewProfile}>
      <h3 className="font-semibold text-sm text-foreground truncate hover:underline">{mechanic.full_name}</h3>
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
  const { latitude, longitude, hasLocation, accuracy, source, loading: locationLoading, requestLocation, setManualLocation } = useGeolocation();
  const { placeName, isLoading: geocodeLoading } = useReverseGeocode(latitude, longitude);
  const {
    activeBooking,
    offers,
    nearbyMechanics,
    loading: requestLoading,
    dispatching,
    selecting,
    mechanicsLoading,
    createRequest,
    cancelRequest,
    selectMechanic,
    fetchNearbyMechanics,
  } = useServiceRequests();

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [step, setStep] = useState<'gps' | 'service' | 'waiting' | 'responses'>('gps');
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  // Fetch nearby mechanics as soon as we have GPS
  React.useEffect(() => {
    if (hasLocation && latitude && longitude && !activeBooking) {
      console.log('[FindMechanics] Has location, fetching nearby mechanics:', latitude, longitude);
      fetchNearbyMechanics(latitude, longitude);
    }
  }, [hasLocation, latitude, longitude, activeBooking, fetchNearbyMechanics]);

  // Debug: log mechanic list state
  React.useEffect(() => {
    console.log('[FindMechanics] nearbyMechanics updated:', nearbyMechanics.length, nearbyMechanics);
  }, [nearbyMechanics]);

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
    const price = computePriceEstimate(selectedSymptoms);
    const severity = computeSeverity(selectedSymptoms);
    const result = await createRequest({
      serviceType: selectedService,
      issueDescription: selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : undefined,
      latitude,
      longitude,
      selectedProblems: selectedSymptoms,
      severity,
      estimatedPriceMin: price.min || undefined,
      estimatedPriceMax: price.max || undefined,
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

  // Direct select (from service step - creates booking + assigns mechanic)
  const handleDirectSelect = async (mechanicId: string) => {
    console.log('[FindMechanics] User selected mechanic:', mechanicId, 'service:', selectedService);
    if (!latitude || !longitude || !selectedService) {
      toast.error('Please select a service type first');
      return;
    }
    const price = computePriceEstimate(selectedSymptoms);
    const severity = computeSeverity(selectedSymptoms);
    const booking = await createRequest({
      serviceType: selectedService,
      issueDescription: selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : undefined,
      latitude,
      longitude,
      selectedProblems: selectedSymptoms,
      severity,
      estimatedPriceMin: price.min || undefined,
      estimatedPriceMax: price.max || undefined,
    });
    if (booking) {
      // Now select the mechanic for this booking
      const { data, error } = await supabase.functions.invoke('user-select-mechanic', {
        body: { bookingId: booking.id, mechanicId },
      });
      if (error || data?.error) {
        toast.error('Failed to assign mechanic: ' + (data?.error || error?.message));
      } else {
        toast.success('Mechanic selected! They are on their way.');
        navigate('/user/track');
      }
    }
  };

  const onlineMechanics = nearbyMechanics.filter(m => m.is_available);
  const offlineMechanics = nearbyMechanics.filter(m => !m.is_available);
  const hasMechanics = nearbyMechanics.length > 0;

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
            <LocationBar
              latitude={latitude}
              longitude={longitude}
              accuracy={accuracy}
              source={source}
              placeName={placeName}
              loading={locationLoading}
              geocodeLoading={geocodeLoading}
              hasLocation={hasLocation}
              onRequestLocation={requestLocation}
              onManualLocation={setManualLocation}
            />

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
              <h2 className="text-base font-semibold text-foreground mb-2">What's wrong with your vehicle?</h2>
              <p className="text-xs text-muted-foreground mb-3">Select all symptoms so the mechanic comes prepared</p>
              <SymptomPicker
                selectedSymptoms={selectedSymptoms}
                onSymptomsChange={setSelectedSymptoms}
                serviceType={selectedService}
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-border h-48">
              <NearbyMechanicsMap mechanics={nearbyMechanics.map(m => ({
                id: m.id,
                full_name: m.full_name,
                phone: m.phone,
                specialization: m.specialization,
                latitude: m.latitude,
                longitude: m.longitude,
                address: null,
                rating: m.rating || 0,
                distance: m.distance,
              }))} />
            </div>

            {/* Nearby Mechanics List on Service Step */}
            {mechanicsLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Finding nearby mechanics...</span>
              </div>
            )}

            {/* Two clear options: Broadcast or Select */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="w-full"
                disabled={!selectedService || requestLoading || dispatching}
                onClick={() => setShowBroadcastConfirm(true)}
              >
                {(requestLoading || dispatching) ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {dispatching ? 'Sending...' : 'Broadcast'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                disabled={!selectedService || !hasMechanics}
                onClick={() => {
                  const el = document.getElementById('mechanic-list');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <User className="w-5 h-5 mr-2" />
                Select Manually
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border p-3">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <span><strong className="text-foreground">Broadcast</strong> — Send to all nearby mechanics, fastest response</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span><strong className="text-foreground">Select</strong> — Choose a specific mechanic from the list below</span>
                </div>
              </div>
            </div>

            {/* Nearby Mechanics List */}
            {mechanicsLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Finding nearby mechanics...</span>
              </div>
            )}

            {!mechanicsLoading && hasMechanics && (
              <div id="mechanic-list">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-foreground">Nearby Mechanics</h2>
                  <span className="text-xs text-muted-foreground">
                    {onlineMechanics.length} online · {nearbyMechanics.length} total
                  </span>
                </div>
                {!selectedService && (
                  <p className="text-xs text-destructive mb-3">⚠ Select a service above first</p>
                )}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {onlineMechanics.map(m => (
                    <MechanicCard
                      key={m.id}
                      mechanic={m}
                      onSelect={() => handleDirectSelect(m.id)}
                      selecting={selecting || !selectedService}
                      onViewProfile={() => navigate(`/user/mechanic/${m.id}`)}
                    />
                  ))}
                  {offlineMechanics.length > 0 && onlineMechanics.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-2">Currently offline</p>
                  )}
                  {offlineMechanics.map(m => (
                    <div key={m.id} className="opacity-50">
                      <MechanicCard mechanic={m} onSelect={() => {}} selecting={false} onViewProfile={() => navigate(`/user/mechanic/${m.id}`)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!mechanicsLoading && !hasMechanics && (
              <div className="text-center py-4 bg-card rounded-xl border border-border">
                <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No mechanics found nearby</p>
                <p className="text-xs text-muted-foreground mt-1">Try broadcasting your request — mechanics may respond</p>
              </div>
            )}

            {/* Broadcast Confirmation Dialog */}
            <AlertDialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Broadcast Service Request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send your <strong className="text-foreground">{selectedService}</strong> request to all nearby mechanics.
                    {selectedSymptoms.length > 0 && (
                      <span className="block mt-1">Issues: {selectedSymptoms.join(', ')}</span>
                    )}
                    {onlineMechanics.length > 0 && (
                      <span className="block mt-1">{onlineMechanics.length} mechanic{onlineMechanics.length > 1 ? 's' : ''} currently online nearby.</span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBroadcast}>
                    <Send className="w-4 h-4 mr-2" />
                    Confirm Broadcast
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                      onViewProfile={() => navigate(`/user/mechanic/${m.id}`)}
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
                        onViewProfile={() => navigate(`/user/mechanic/${m.id}`)}
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
