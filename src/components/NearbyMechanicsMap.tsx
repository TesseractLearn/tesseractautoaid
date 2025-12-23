import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Loader2, MapPin, Navigation, RefreshCw, Phone, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Mechanic {
  id: string;
  full_name: string;
  phone: string | null;
  specialization: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number;
  distance?: number;
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const NearbyMechanicsMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const { latitude, longitude, error: geoError, loading: geoLoading, refresh: refreshLocation } = useGeolocation();
  
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
        toast.error('Failed to load map. Please try again.');
      }
    };
    fetchToken();
  }, []);

  // Fetch all registered mechanics (not just available ones)
  useEffect(() => {
    const fetchMechanics = async () => {
      if (!latitude || !longitude) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mechanics')
          .select('*');

        if (error) throw error;

        // Calculate distance for each mechanic and sort by distance
        const mechanicsWithDistance = (data || [])
          .map((m) => ({
            ...m,
            distance: calculateDistance(latitude, longitude, m.latitude, m.longitude),
          }))
          .sort((a, b) => a.distance - b.distance);

        setMechanics(mechanicsWithDistance);
      } catch (error) {
        console.error('Error fetching mechanics:', error);
        toast.error('Failed to load mechanics');
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, [latitude, longitude]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !latitude || !longitude) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker
    const userMarkerEl = document.createElement('div');
    userMarkerEl.className = 'user-marker';
    userMarkerEl.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `;

    new mapboxgl.Marker(userMarkerEl)
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, latitude, longitude]);

  // Add mechanic markers
  useEffect(() => {
    if (!map.current || !mechanics.length) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    mechanics.forEach((mechanic) => {
      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: #f97316;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
      `;

      markerEl.addEventListener('click', () => {
        setSelectedMechanic(mechanic);
        map.current?.flyTo({
          center: [mechanic.longitude, mechanic.latitude],
          zoom: 15,
        });
      });

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([mechanic.longitude, mechanic.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [mechanics]);

  if (geoLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Getting your location...</p>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4 text-center">
        <Navigation className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Location Access Required</h3>
        <p className="text-muted-foreground text-sm">{geoError}</p>
        <Button onClick={refreshLocation} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-180px)]">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Mechanics Count Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">
            {mechanics.length} mechanic{mechanics.length !== 1 ? 's' : ''} nearby
          </span>
        </div>
      </div>

      {/* Refresh Location Button */}
      <Button
        size="icon"
        variant="secondary"
        className="absolute top-4 right-16 z-10 shadow-lg"
        onClick={refreshLocation}
      >
        <Navigation className="h-4 w-4" />
      </Button>

      {/* Selected Mechanic Card */}
      {selectedMechanic && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 shadow-xl animate-fade-in">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedMechanic.full_name}</h3>
                {selectedMechanic.specialization && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Wrench className="h-3 w-3" />
                    <span>{selectedMechanic.specialization}</span>
                  </div>
                )}
                {selectedMechanic.address && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedMechanic.address}</span>
                  </div>
                )}
                {selectedMechanic.distance && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedMechanic.distance < 1
                      ? `${(selectedMechanic.distance * 1000).toFixed(0)}m away`
                      : `${selectedMechanic.distance.toFixed(1)}km away`}
                  </p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedMechanic(null)}
                className="shrink-0"
              >
                ✕
              </Button>
            </div>
            <div className="flex gap-2 mt-4">
              {selectedMechanic.phone && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`tel:${selectedMechanic.phone}`, '_self')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              <Button className="flex-1">
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Mechanics Message */}
      {!loading && mechanics.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Card className="mx-4 pointer-events-auto">
            <CardContent className="p-6 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No Mechanics Available</h3>
              <p className="text-sm text-muted-foreground mt-2">
                There are no mechanics available in your area right now.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NearbyMechanicsMap;
