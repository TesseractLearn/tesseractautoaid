import React from 'react';
import { MapPin, Navigation, AlertCircle, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation, PermissionState } from '@/hooks/useGeolocation';

interface LocationPermissionProps {
  onLocationGranted?: (latitude: number, longitude: number) => void;
  onPermissionDenied?: () => void;
  showInline?: boolean;
  className?: string;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationGranted,
  onPermissionDenied,
  showInline = false,
  className = '',
}) => {
  const {
    latitude,
    longitude,
    loading,
    error,
    errorCode,
    permissionState,
    requestLocation,
    hasLocation,
  } = useGeolocation();

  React.useEffect(() => {
    if (hasLocation && latitude && longitude && onLocationGranted) {
      onLocationGranted(latitude, longitude);
    }
  }, [hasLocation, latitude, longitude, onLocationGranted]);

  React.useEffect(() => {
    if (permissionState === 'denied' && onPermissionDenied) {
      onPermissionDenied();
    }
  }, [permissionState, onPermissionDenied]);

  // If permission already granted and has location, don't show anything
  if (permissionState === 'granted' && hasLocation && !showInline) {
    return null;
  }

  const renderContent = () => {
    // Loading state
    if (loading) {
      return (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Getting your location...
            </h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we access your GPS
            </p>
          </div>
        </div>
      );
    }

    // Permission denied state
    if (permissionState === 'denied' || errorCode === 'PERMISSION_DENIED') {
      return (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Location Access Required
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              To find nearby mechanics and provide accurate service, we need access to your location.
            </p>
          </div>
          <div className="space-y-3 w-full max-w-xs">
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-foreground mb-2">
                To enable location:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your device Settings</li>
                <li>Go to Privacy &amp; Security → Location</li>
                <li>Enable location for your browser</li>
                <li>Return here and tap the button below</li>
              </ol>
            </div>
            <Button
              onClick={requestLocation}
              className="w-full"
              variant="default"
            >
              <Settings className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    // GPS/Location unavailable
    if (errorCode === 'POSITION_UNAVAILABLE') {
      return (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
            <Navigation className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Enable Location Services
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your device's GPS or location services appear to be turned off. Please enable them to continue.
            </p>
          </div>
          <Button onClick={requestLocation} className="w-full max-w-xs">
            <Navigation className="w-4 h-4 mr-2" />
            Retry Location
          </Button>
        </div>
      );
    }

    // Timeout error
    if (errorCode === 'TIMEOUT') {
      return (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Location Request Timed Out
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't get your location in time. Please ensure you're in an area with GPS signal and try again.
            </p>
          </div>
          <Button onClick={requestLocation} className="w-full max-w-xs">
            <Navigation className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    // Not supported
    if (errorCode === 'NOT_SUPPORTED') {
      return (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Location Not Supported
            </h3>
            <p className="text-sm text-muted-foreground">
              Your browser or device doesn't support location services. Please try using a different browser or device.
            </p>
          </div>
        </div>
      );
    }

    // Initial prompt state
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Enable Location Access
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            We use your location to find nearby mechanics and provide accurate roadside assistance.
          </p>
          <p className="text-xs text-muted-foreground">
            Your location is only used when you need service and is never stored without your consent.
          </p>
        </div>
        <Button
          onClick={requestLocation}
          size="lg"
          className="w-full max-w-xs mt-2"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Allow Location Access
        </Button>
      </div>
    );
  };

  if (showInline) {
    return <div className={className}>{renderContent()}</div>;
  }

  return (
    <div className={`bg-card border border-border rounded-2xl shadow-lg ${className}`}>
      {renderContent()}
    </div>
  );
};

export default LocationPermission;
