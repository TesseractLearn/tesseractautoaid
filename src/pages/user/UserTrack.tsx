import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, MessageCircle, Clock, CheckCircle2, Search, Wrench, Navigation, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ActiveBooking {
  id: string;
  status: string;
  service_type: string;
  latitude: number;
  longitude: number;
  mechanic: {
    id: string;
    full_name: string;
    phone: string;
    specialization: string;
    rating: number;
    latitude: number;
    longitude: number;
  } | null;
}

const POLL_INTERVAL = 5000; // 5 seconds

const UserTrack: React.FC = () => {
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mechanicMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeAdded = useRef(false);

  // Fetch mapbox token
  useEffect(() => {
    supabase.functions.invoke('get-mapbox-token').then(({ data }) => {
      if (data?.token) setMapboxToken(data.token);
    });
  }, []);

  const fetchActiveBooking = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, service_type, mechanic_id, latitude, longitude')
        .eq('user_id', user.id)
        .in('status', ['accepted', 'mechanic_arriving', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.mechanic_id) {
        const { data: mech } = await supabase
          .from('mechanics')
          .select('id, full_name, phone, specialization, rating, latitude, longitude')
          .eq('id', data.mechanic_id)
          .maybeSingle();

        setActiveBooking({ ...data, mechanic: mech });
      } else {
        setActiveBooking(null);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchActiveBooking();

    const channel = supabase
      .channel('track-booking-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchActiveBooking();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchActiveBooking]);

  // Poll mechanic location every 5s
  useEffect(() => {
    if (!activeBooking?.mechanic) return;

    const interval = setInterval(async () => {
      const { data: mech } = await supabase
        .from('mechanics')
        .select('latitude, longitude')
        .eq('id', activeBooking.mechanic!.id)
        .maybeSingle();

      if (mech) {
        setActiveBooking(prev => {
          if (!prev || !prev.mechanic) return prev;
          return {
            ...prev,
            mechanic: { ...prev.mechanic, latitude: mech.latitude, longitude: mech.longitude },
          };
        });
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeBooking?.mechanic?.id]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !activeBooking) return;
    if (mapRef.current) return; // already initialized

    mapboxgl.accessToken = mapboxToken;

    const userLng = activeBooking.longitude;
    const userLat = activeBooking.latitude;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLng, userLat],
      zoom: 13,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // User marker (blue dot)
    const userEl = document.createElement('div');
    userEl.innerHTML = `<div style="width:18px;height:18px;background:hsl(217,91%,50%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`;
    userMarkerRef.current = new mapboxgl.Marker(userEl)
      .setLngLat([userLng, userLat])
      .addTo(mapRef.current);

    // Mechanic marker (orange wrench)
    if (activeBooking.mechanic) {
      const mechEl = document.createElement('div');
      mechEl.innerHTML = `<div style="width:40px;height:40px;background:hsl(25,95%,53%);border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>`;
      mechanicMarkerRef.current = new mapboxgl.Marker(mechEl)
        .setLngLat([activeBooking.mechanic.longitude, activeBooking.mechanic.latitude])
        .addTo(mapRef.current);

      // Fit bounds to show both
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([userLng, userLat]);
      bounds.extend([activeBooking.mechanic.longitude, activeBooking.mechanic.latitude]);
      mapRef.current.fitBounds(bounds, { padding: 80 });
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      routeAdded.current = false;
    };
  }, [mapboxToken, activeBooking?.id]);

  // Update mechanic marker position smoothly + draw route
  useEffect(() => {
    if (!mapRef.current || !activeBooking?.mechanic) return;
    const { longitude: mLng, latitude: mLat } = activeBooking.mechanic;
    const { longitude: uLng, latitude: uLat } = activeBooking;

    // Animate marker
    if (mechanicMarkerRef.current) {
      mechanicMarkerRef.current.setLngLat([mLng, mLat]);
    }

    // Draw/update route line
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    const routeCoords: [number, number][] = [[mLng, mLat], [uLng, uLat]];
    const geojson: GeoJSON.Feature<GeoJSON.Geometry> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routeCoords },
    };

    if (map.getSource('mechanic-route')) {
      (map.getSource('mechanic-route') as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('mechanic-route', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'mechanic-route-line',
        type: 'line',
        source: 'mechanic-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-dasharray': [2, 2] },
      });
    }
  }, [activeBooking?.mechanic?.latitude, activeBooking?.mechanic?.longitude]);

  // --- Status helpers ---
  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Mechanic accepted your request';
      case 'mechanic_arriving': return 'Mechanic is on the way';
      case 'in_progress': return 'Repair in progress';
      default: return 'Processing...';
    }
  };

  const getEta = (mech: ActiveBooking['mechanic'], booking: ActiveBooking) => {
    if (!mech) return '--';
    const R = 6371;
    const dLat = (booking.latitude - mech.latitude) * Math.PI / 180;
    const dLon = (booking.longitude - mech.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(mech.latitude * Math.PI / 180) * Math.cos(booking.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const mins = Math.max(1, Math.round((dist / 20) * 60));
    return `~${mins} min`;
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading tracking...</p>
        </div>
      </div>
    );
  }

  // --- No active booking ---
  if (!activeBooking) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6 animate-pulse">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">No Active Booking</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-xs">
            You haven't hired any mechanic yet. Find nearby mechanics and book a service.
          </p>
          <Button onClick={() => navigate('/user/find-mechanics')} className="gap-2" size="lg">
            <Wrench className="w-5 h-5" />
            Find Mechanics
          </Button>
        </div>
      </div>
    );
  }

  // --- Active booking with map ---
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Map */}
      <div className="relative h-[50vh] bg-secondary">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Status chip */}
        <div className="absolute top-4 left-4 z-10 glass rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground">{getStatusText(activeBooking.status)}</span>
        </div>

        {/* Re-center button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 z-10 shadow-lg"
          onClick={() => {
            if (mapRef.current && activeBooking.mechanic) {
              const bounds = new mapboxgl.LngLatBounds();
              bounds.extend([activeBooking.longitude, activeBooking.latitude]);
              bounds.extend([activeBooking.mechanic.longitude, activeBooking.mechanic.latitude]);
              mapRef.current.fitBounds(bounds, { padding: 80 });
            }
          }}
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-card rounded-t-3xl -mt-6 relative z-10 flex-1 animate-slide-up">
        <div className="w-12 h-1 bg-border rounded-full mx-auto mt-3" />

        <div className="p-5 space-y-5">
          {/* ETA Banner */}
          {activeBooking.mechanic && activeBooking.status !== 'in_progress' && (
            <div className="bg-primary/10 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Estimated Arrival</p>
                <p className="text-lg font-bold text-primary">{getEta(activeBooking.mechanic, activeBooking)}</p>
              </div>
            </div>
          )}

          {activeBooking.status === 'in_progress' && (
            <div className="bg-emerald-500/10 rounded-xl p-4 flex items-center gap-3">
              <Wrench className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">Repair In Progress</p>
                <p className="text-xs text-muted-foreground">Your mechanic is working on it</p>
              </div>
            </div>
          )}

          {/* Mechanic Info */}
          {activeBooking.mechanic && (
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeBooking.mechanic.full_name}`}
                  alt="Mechanic"
                  className="w-12 h-12 rounded-full bg-card"
                />
                <div>
                  <p className="font-semibold text-foreground">{activeBooking.mechanic.full_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {activeBooking.mechanic.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {Number(activeBooking.mechanic.rating).toFixed(1)}
                      </span>
                    )}
                    {activeBooking.mechanic.specialization && (
                      <span>• {activeBooking.mechanic.specialization}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {activeBooking.mechanic.phone && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={`tel:${activeBooking.mechanic.phone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-3">
            <ProgressStep
              label="Booking confirmed"
              done={true}
              active={false}
            />
            <ProgressStep
              label="Mechanic on the way"
              done={activeBooking.status === 'in_progress'}
              active={activeBooking.status === 'mechanic_arriving' || activeBooking.status === 'accepted'}
            />
            <ProgressStep
              label="Repair in progress"
              done={false}
              active={activeBooking.status === 'in_progress'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressStep: React.FC<{ label: string; done: boolean; active: boolean }> = ({ label, done, active }) => (
  <div className="flex items-center gap-3">
    {done ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    ) : active ? (
      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-border" />
    )}
    <span className={`text-sm ${done ? 'text-foreground' : active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
      {label}
    </span>
  </div>
);

export default UserTrack;
