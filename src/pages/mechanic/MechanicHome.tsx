import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { useMechanicRequests } from '@/hooks/useMechanicRequests';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import CancelJobDialog from '@/components/CancelJobDialog';
import { 
  MapPin, 
  Bell, 
  ChevronRight,
  Clock,
  Loader2,
  Radio,
  Star,
  Navigation,
  Check,
  X,
  Eye
} from 'lucide-react';
import { 
  PunctureIcon, 
  TowingIcon, 
  EngineIcon, 
  BatteryIcon,
  WrenchIcon 
} from '@/components/icons/ServiceIcons';
import autoaidLogo from '@/assets/autoaid-logo.png';
import { toast } from 'sonner';

const serviceIconMap: Record<string, React.ReactNode> = {
  puncture: <PunctureIcon size={18} />,
  battery: <BatteryIcon size={18} />,
  towing: <TowingIcon size={18} />,
  engine: <EngineIcon size={18} />,
  general: <WrenchIcon size={18} />,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MechanicHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: mechanic, refetch: refetchProfile } = useMechanicProfile();
  const { requests, acceptRequest, declineRequest } = useMechanicRequests();
  const { 
    latitude, 
    longitude, 
    accuracy,
    loading: locationLoading, 
    permissionState, 
    hasLocation,
    requestLocation,
    accuracyLevel 
  } = useGeolocation();
  const { placeName, isLoading: geocodeLoading } = useReverseGeocode(latitude, longitude);

  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);

  const handleCancelJob = async (jobId: string, reason: string) => {
    try {
      const { error } = await supabase.from('bookings').update({
        status: 'mechanic_cancelled',
        issue_description: `[MECHANIC_CANCELLED] ${reason}`,
      }).eq('id', jobId);
      if (error) throw error;
      toast.success('Job cancelled');
      setCancellingJobId(null);
      // Refresh recent jobs
      if (mechanic?.id) {
        const { data } = await supabase
          .from('bookings')
          .select('id, service_type, status, created_at, final_price, estimated_price, address')
          .eq('mechanic_id', mechanic.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentJobs(data || []);
      }
    } catch {
      toast.error('Failed to cancel job');
      throw new Error('cancel failed');
    }
  };

  const firstName = mechanic?.full_name?.split(' ')[0] || 'Mechanic';

  // Sync online state from profile
  useEffect(() => {
    if (mechanic) {
      setIsOnline(mechanic.is_available ?? false);
    }
  }, [mechanic]);

  // Silently request location if permission already granted
  useEffect(() => {
    if (permissionState === 'granted' && !hasLocation) {
      requestLocation();
    }
  }, [permissionState, hasLocation, requestLocation]);

  const handleToggleOnline = async (checked: boolean) => {
    if (!mechanic) return;
    setTogglingOnline(true);
    
    try {
      const updateData: any = { is_available: checked };
      
      // Update location when going online
      if (checked && latitude && longitude) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
      }

      await supabase
        .from('mechanics')
        .update(updateData)
        .eq('id', mechanic.id);

      setIsOnline(checked);
      refetchProfile();
      toast.success(checked ? 'You are now online! You will receive job requests.' : 'You are now offline.');
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleLocationClick = () => {
    if (!hasLocation) {
      requestLocation();
    }
  };

  const locationDisplay = locationLoading || geocodeLoading
    ? 'Getting location...'
    : placeName || (hasLocation ? 'Location found' : 'Tap to enable location');

  // Dynamic services from mechanic profile
  const serviceLabels: Record<string, { name: string; description: string }> = {
    puncture: { name: 'Puncture', description: 'Flat tire fix' },
    battery: { name: 'Battery', description: 'Jump start' },
    towing: { name: 'Towing', description: 'Vehicle tow' },
    engine: { name: 'Engine', description: 'Engine issues' },
    general: { name: 'General', description: 'All repairs' },
    ac_repair: { name: 'AC Repair', description: 'Cooling fix' },
    oil_service: { name: 'Oil & Lube', description: 'Oil change' },
    denting: { name: 'Denting', description: 'Body work' },
  };

  const serviceIconComponents: Record<string, React.ReactNode> = {
    puncture: <PunctureIcon size={24} />,
    battery: <BatteryIcon size={24} />,
    towing: <TowingIcon size={24} />,
    engine: <EngineIcon size={24} />,
    general: <WrenchIcon size={24} />,
    ac_repair: <WrenchIcon size={24} />,
    oil_service: <WrenchIcon size={24} />,
    denting: <WrenchIcon size={24} />,
  };

  const services = useMemo(() => {
    const offered = mechanic?.services_offered as string[] | null;
    if (offered && offered.length > 0) {
      return offered.map(id => ({
        icon: serviceIconComponents[id] || <WrenchIcon size={24} />,
        name: serviceLabels[id]?.name || id,
        description: serviceLabels[id]?.description || '',
      }));
    }
    // Fallback for mechanics without services_offered set
    return Object.entries(serviceLabels).slice(0, 5).map(([id, info]) => ({
      icon: serviceIconComponents[id],
      name: info.name,
      description: info.description,
    }));
  }, [mechanic?.services_offered]);

  // Fetch recent jobs
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    if (!mechanic?.id) return;
    const fetchRecentJobs = async () => {
      setJobsLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('id, service_type, status, created_at, final_price, estimated_price, address')
        .eq('mechanic_id', mechanic.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentJobs(data || []);
      setJobsLoading(false);
    };
    fetchRecentJobs();
  }, [mechanic?.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground safe-area-inset-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-sm text-primary-foreground/80">
                Hi, {firstName}
              </span>
              <div className="flex items-center gap-2">
                <img src={autoaidLogo} alt="AutoAid" className="h-8 w-8" />
                <span className="font-bold text-lg">AutoAid</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 relative">
                <Bell className="w-5 h-5" />
                {requests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {requests.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="flex items-center justify-between bg-primary-foreground/10 rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
              <div>
                <p className="text-sm font-medium">
                  {isOnline ? 'Online — Accepting Jobs' : 'Offline'}
                </p>
                <p className="text-xs text-primary-foreground/60">
                  {isOnline ? 'You will receive nearby requests' : 'Toggle on to receive job requests'}
                </p>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              disabled={togglingOnline}
            />
          </div>

          {/* Location Bar */}
          <button 
            onClick={handleLocationClick}
            className="flex items-center gap-2 w-full bg-primary-foreground/10 rounded-xl px-4 py-3 text-left"
          >
            {locationLoading || geocodeLoading ? (
              <Loader2 className="w-5 h-5 text-primary-foreground/80 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 text-primary-foreground/80" />
            )}
            <div className="flex-1">
              <p className="text-xs text-primary-foreground/60">Your location</p>
              <p className="text-sm font-medium">{locationDisplay}</p>
            </div>
            {hasLocation && accuracy && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                accuracyLevel === 'good' ? 'bg-emerald-500/20 text-emerald-300' :
                accuracyLevel === 'ok' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                ±{accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`}
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-primary-foreground/60" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Incoming Requests Section */}
        {requests.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary animate-pulse" />
                Incoming Requests
              </h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {requests.length} new
              </span>
            </div>

            <div className="space-y-3">
              {requests.map((request) => {
                const serviceType = request.booking?.service_type || 'general';
                const serviceIcon = serviceIconMap[serviceType] || <WrenchIcon size={18} />;
                const isExpanded = expandedRequest === request.id;
                
                // Calculate distance if we have location
                let distanceText = '';
                if (latitude && longitude && request.booking) {
                  const dist = haversineDistance(
                    latitude, longitude,
                    request.booking.latitude, request.booking.longitude
                  );
                  distanceText = dist < 1 
                    ? `${(dist * 1000).toFixed(0)}m away` 
                    : `${dist.toFixed(1)}km away`;
                }

                return (
                  <div
                    key={request.id}
                    className="bg-card rounded-xl border-2 border-primary/20 overflow-hidden shadow-sm"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {serviceIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-foreground capitalize">
                              {serviceType.replace('_', ' ')} Service
                            </h3>
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">New</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            From: {request.user_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {distanceText && (
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {distanceText}
                              </span>
                            )}
                            {request.eta_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ~{Math.round(request.eta_minutes)}min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && request.booking?.issue_description && (
                        <div className="mt-3 bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Issue Description:</p>
                          <p className="text-sm text-foreground">{request.booking.issue_description}</p>
                        </div>
                      )}

                      {isExpanded && request.booking && (
                        <div className="mt-2 bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Location:</p>
                          <p className="text-sm text-foreground">
                            {request.booking.address || `${request.booking.latitude.toFixed(4)}°, ${request.booking.longitude.toFixed(4)}°`}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 h-9"
                          onClick={() => acceptRequest(request.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Claim Job
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9"
                          onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 text-muted-foreground"
                          onClick={() => declineRequest(request.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Specializations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Specializations</h2>
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {services.map((service) => (
              <button
                key={service.name}
                className="service-card flex flex-col items-center text-center p-4 min-w-[100px]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 text-primary">
                  {service.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{service.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{service.description}</span>
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
            {jobsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent jobs</p>
                <p className="text-xs text-muted-foreground mt-1">Your job history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => {
                  const isActive = ['accepted', 'mechanic_arriving', 'in_progress'].includes(job.status);
                  return (
                    <div key={job.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {serviceIconMap[job.service_type] || <WrenchIcon size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">{job.service_type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.address || 'No address'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">₹{job.final_price || job.estimated_price || '—'}</p>
                          <p className={`text-[10px] font-medium capitalize ${job.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {job.status.replace('_', ' ')}
                          </p>
                        </div>
                        {isActive && job.status !== 'in_progress' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7 px-2"
                            onClick={() => setCancellingJobId(job.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <CancelJobDialog
        open={!!cancellingJobId}
        onOpenChange={(open) => { if (!open) setCancellingJobId(null); }}
        onConfirm={(reason) => handleCancelJob(cancellingJobId!, reason)}
        role="mechanic"
      />
    </div>
  );
};

export default MechanicHome;
