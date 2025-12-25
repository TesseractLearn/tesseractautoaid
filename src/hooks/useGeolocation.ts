import { useState, useEffect, useCallback } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  errorCode: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | null;
  loading: boolean;
  permissionState: PermissionState;
  timestamp: number | null;
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
  maximumAge: 0,
  watchPosition: false,
};

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
  });

  // Check permission status
  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (!navigator.geolocation) {
      return 'unavailable';
    }

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state as PermissionState;
      } catch {
        // Permissions API not supported, assume prompt
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

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        permission.onchange = () => {
          setState(prev => ({ ...prev, permissionState: permission.state as PermissionState }));
        };
      }).catch(() => {
        // Permissions API not supported
      });
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
    }));
  }, []);

  // Error handler
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get your location';
    let errorCode: GeolocationState['errorCode'] = null;
    let permState: PermissionState = state.permissionState;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access is required to continue. Please enable location in your device settings.';
        errorCode = 'PERMISSION_DENIED';
        permState = 'denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is currently unavailable. Please check if GPS/Location services are enabled.';
        errorCode = 'POSITION_UNAVAILABLE';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        errorCode = 'TIMEOUT';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      errorCode,
      loading: false,
      permissionState: permState,
    }));
  }, [state.permissionState]);

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

  // Check if we can open settings (mobile browsers may support this)
  const openSettings = useCallback(() => {
    // On most mobile browsers, we can't directly open settings
    // But we can show instructions
    return false;
  }, []);

  return {
    ...state,
    requestLocation,
    refresh,
    openSettings,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
};
