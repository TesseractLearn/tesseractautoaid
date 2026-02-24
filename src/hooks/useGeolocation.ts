import { useState, useEffect, useCallback } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';
export type LocationSource = 'gps' | 'ip' | 'manual' | null;

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  errorCode: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | null;
  loading: boolean;
  permissionState: PermissionState;
  timestamp: number | null;
  source: LocationSource;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 30000,
  watchPosition: false,
};

/** Returns accuracy quality: 'good' (<30m), 'ok' (30-100m), 'poor' (>100m) */
export const getAccuracyLevel = (accuracy: number | null): 'good' | 'ok' | 'poor' => {
  if (accuracy === null) return 'poor';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 100) return 'ok';
  return 'poor';
};

/** Fetch approximate location from IP (free API, ~2km accuracy) */
async function fetchIPLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lng: data.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    errorCode: null,
    loading: false,
    permissionState: 'prompt',
    timestamp: null,
    source: null,
  });

  // Check permission status
  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (!navigator.geolocation) return 'unavailable';
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state as PermissionState;
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  }, []);

  // Update permission state on mount and listen for changes
  useEffect(() => {
    const updatePermissionState = async () => {
      const permState = await checkPermission();
      setState(prev => ({ ...prev, permissionState: permState }));
    };
    updatePermissionState();

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        permission.onchange = () => {
          setState(prev => ({ ...prev, permissionState: permission.state as PermissionState }));
        };
      }).catch(() => {});
    }
  }, [checkPermission]);

  // Success handler
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      errorCode: null,
      loading: false,
      permissionState: 'granted',
      timestamp: position.timestamp,
      source: 'gps',
    }));
  }, []);

  // IP Fallback
  const tryIPFallback = useCallback(async () => {
    const result = await fetchIPLocation();
    if (result) {
      setState(prev => ({
        ...prev,
        latitude: result.lat,
        longitude: result.lng,
        accuracy: 2000, // ~2km IP-based accuracy
        error: null,
        errorCode: null,
        loading: false,
        timestamp: Date.now(),
        source: 'ip',
      }));
      return true;
    }
    return false;
  }, []);

  // Error handler with IP fallback
  const handleError = useCallback(async (error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get your location';
    let errorCode: GeolocationState['errorCode'] = null;
    let permState: PermissionState = state.permissionState;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access is required. Please enable location in your device settings.';
        errorCode = 'PERMISSION_DENIED';
        permState = 'denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'GPS unavailable. Trying IP-based location...';
        errorCode = 'POSITION_UNAVAILABLE';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Trying fallback...';
        errorCode = 'TIMEOUT';
        break;
    }

    // Try IP fallback for non-permission errors
    if (error.code !== error.PERMISSION_DENIED) {
      const ipSuccess = await tryIPFallback();
      if (ipSuccess) return;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      errorCode,
      loading: false,
      permissionState: permState,
    }));
  }, [state.permissionState, tryIPFallback]);

  // Request location permission and get current position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser or device.',
        errorCode: 'NOT_SUPPORTED',
        loading: false,
        permissionState: 'unavailable',
      }));
      return;
    }
    setState(prev => ({ ...prev, loading: true, error: null, errorCode: null }));
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [handleSuccess, handleError, mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  // Set manual location
  const setManualLocation = useCallback((lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      accuracy: null,
      error: null,
      errorCode: null,
      loading: false,
      timestamp: Date.now(),
      source: 'manual',
    }));
  }, []);

  // Watch position for continuous updates
  useEffect(() => {
    if (!mergedOptions.watchPosition || !navigator.geolocation || state.permissionState !== 'granted') {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [mergedOptions.watchPosition, mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge, handleSuccess, handleError, state.permissionState]);

  // Refresh location
  const refresh = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const openSettings = useCallback(() => {
    return false;
  }, []);

  return {
    ...state,
    requestLocation,
    setManualLocation,
    refresh,
    openSettings,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    hasLocation: state.latitude !== null && state.longitude !== null,
    accuracyLevel: getAccuracyLevel(state.accuracy),
  };
};
