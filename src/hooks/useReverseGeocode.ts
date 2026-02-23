import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReverseGeocode = (latitude: number | null, longitude: number | null) => {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (latitude === null || longitude === null) return;

    let cancelled = false;

    const fetchPlaceName = async () => {
      setIsLoading(true);
      try {
        // Get Mapbox token from edge function
        const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
        const token = tokenData?.token;
        if (!token) {
          setPlaceName(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
          return;
        }

        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=locality,place,neighborhood&limit=1`
        );
        const data = await res.json();

        if (!cancelled && data.features?.length > 0) {
          const feature = data.features[0];
          // e.g. "Koramangala, Bengaluru"
          setPlaceName(feature.place_name?.split(',').slice(0, 2).join(',').trim() || feature.text);
        } else if (!cancelled) {
          setPlaceName(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        }
      } catch {
        if (!cancelled) {
          setPlaceName(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPlaceName();
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  return { placeName, isLoading };
};
