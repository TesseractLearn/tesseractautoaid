import React, { useState } from 'react';
import { MapPin, Loader2, ChevronRight, Edit3, Navigation, Signal, SignalLow, SignalMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationSource, getAccuracyLevel } from '@/hooks/useGeolocation';

interface LocationBarProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  source: LocationSource;
  placeName: string | null;
  loading: boolean;
  geocodeLoading: boolean;
  hasLocation: boolean;
  onRequestLocation: () => void;
  onManualLocation?: (lat: number, lng: number) => void;
  variant?: 'header' | 'inline';
}

const AccuracyBadge: React.FC<{ accuracy: number | null; source: LocationSource }> = ({ accuracy, source }) => {
  if (source === 'manual') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
        <Edit3 className="w-2.5 h-2.5" />
        Manual
      </span>
    );
  }

  if (source === 'ip') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
        <SignalLow className="w-2.5 h-2.5" />
        ~2km
      </span>
    );
  }

  const level = getAccuracyLevel(accuracy);
  const config = {
    good: { label: `${Math.round(accuracy || 0)}m`, icon: Signal, className: 'bg-success/10 text-success' },
    ok: { label: `${Math.round(accuracy || 0)}m`, icon: SignalMedium, className: 'bg-warning/10 text-warning' },
    poor: { label: `${Math.round(accuracy || 0)}m`, icon: SignalLow, className: 'bg-destructive/10 text-destructive' },
  }[level];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.className}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
};

const LocationBar: React.FC<LocationBarProps> = ({
  latitude,
  longitude,
  accuracy,
  source,
  placeName,
  loading,
  geocodeLoading,
  hasLocation,
  onRequestLocation,
  onManualLocation,
  variant = 'inline',
}) => {
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onManualLocation?.(lat, lng);
      setShowManual(false);
      setManualLat('');
      setManualLng('');
    }
  };

  const isLoading = loading || geocodeLoading;

  const locationDisplay = isLoading
    ? 'Getting location...'
    : placeName || (hasLocation ? `${latitude?.toFixed(4)}°N, ${longitude?.toFixed(4)}°E` : 'Tap to enable location');

  const accuracyLevel = getAccuracyLevel(accuracy);

  if (variant === 'header') {
    return (
      <div className="space-y-2">
        <button
          onClick={!hasLocation ? onRequestLocation : undefined}
          className="flex items-center gap-2 w-full bg-primary-foreground/10 rounded-xl px-4 py-3 text-left"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-primary-foreground/80 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 text-primary-foreground/80" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary-foreground/60">Your location</p>
            <p className="text-sm font-medium truncate">{locationDisplay}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {hasLocation && <AccuracyBadge accuracy={accuracy} source={source} />}
            <ChevronRight className="w-5 h-5 text-primary-foreground/60" />
          </div>
        </button>
      </div>
    );
  }

  // Inline variant (for FindMechanics page)
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
        hasLocation
          ? accuracyLevel === 'good'
            ? 'bg-success/10'
            : accuracyLevel === 'ok'
            ? 'bg-warning/10'
            : 'bg-destructive/10'
          : 'bg-muted'
      }`}>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <MapPin className={`w-5 h-5 ${
            hasLocation
              ? accuracyLevel === 'good' ? 'text-success' : accuracyLevel === 'ok' ? 'text-warning' : 'text-destructive'
              : 'text-muted-foreground'
          }`} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {source === 'gps' ? 'GPS Location' : source === 'ip' ? 'Approximate Location (IP)' : source === 'manual' ? 'Manual Location' : 'Location'}
            </p>
            {hasLocation && <AccuracyBadge accuracy={accuracy} source={source} />}
          </div>
          <p className="text-sm font-medium text-foreground truncate">{locationDisplay}</p>
        </div>
      </div>

      {/* Accuracy warning */}
      {hasLocation && source !== 'manual' && accuracyLevel === 'poor' && (
        <p className="text-xs text-destructive px-1">
          ⚠ Low accuracy — move to an open area or enter your location manually
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {(!hasLocation || source === 'ip') && (
          <Button size="sm" variant="outline" onClick={onRequestLocation} className="flex-1 text-xs">
            <Navigation className="w-3 h-3 mr-1" />
            {source === 'ip' ? 'Use GPS Instead' : 'Enable GPS'}
          </Button>
        )}
        {onManualLocation && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowManual(!showManual)}
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Manual Entry
          </Button>
        )}
      </div>

      {/* Manual entry form */}
      {showManual && onManualLocation && (
        <div className="bg-card rounded-xl border border-border p-3 space-y-2 animate-fade-in">
          <p className="text-xs font-medium text-foreground">Enter coordinates</p>
          <div className="flex gap-2">
            <Input
              placeholder="Latitude (e.g. 19.0760)"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="text-xs h-8"
              type="number"
              step="any"
            />
            <Input
              placeholder="Longitude (e.g. 72.8777)"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="text-xs h-8"
              type="number"
              step="any"
            />
          </div>
          <Button size="sm" onClick={handleManualSubmit} className="w-full text-xs h-8">
            Use This Location
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationBar;
