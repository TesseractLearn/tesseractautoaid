import React, { useState, useEffect } from 'react';
import { useMechanicProfile } from '@/hooks/useMechanicProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  User, Phone, MapPin, Star, Shield, ShieldCheck,
  Loader2, Save, Navigation, Clock, LogOut,
} from 'lucide-react';
import ServicesPicker from '@/components/mechanic/ServicesPicker';
import { useAuth } from '@/contexts/AuthContext';


const ProfileTab: React.FC = () => {
  const { logout } = useAuth();
  const { data: mechanic, refetch } = useMechanicProfile();
  const { latitude, longitude, hasLocation, requestLocation, loading: geoLoading } = useGeolocation();
  const { placeName } = useReverseGeocode(latitude, longitude);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    if (!mechanic) return;
    setFullName(mechanic.full_name || '');
    setPhone(mechanic.phone || '');
    setExperienceYears((mechanic as any).experience_years || 0);
    setServicesOffered((mechanic as any).services_offered || []);
    setIsOnline(mechanic.is_available ?? false);
  }, [mechanic]);


  const handleToggleOnline = async (checked: boolean) => {
    if (!mechanic) return;
    setTogglingOnline(true);
    try {
      const update: any = { is_available: checked };
      if (checked && latitude && longitude) {
        update.latitude = latitude;
        update.longitude = longitude;
      }
      await supabase.from('mechanics').update(update).eq('id', mechanic.id);
      setIsOnline(checked);
      refetch();
      toast.success(checked ? 'You are now online!' : 'You are now offline.');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleSave = async () => {
    if (!mechanic) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('mechanics').update({
        full_name: fullName,
        phone,
        experience_years: experienceYears,
        services_offered: servicesOffered,
        ...(hasLocation ? { latitude, longitude } : {}),
      }).eq('id', mechanic.id);
      if (error) throw error;
      refetch();
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!mechanic) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const rating = mechanic.rating ? Number(mechanic.rating) : 0;
  const ratingCount = (mechanic as any).total_rating_count || 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mechanic.full_name}`}
          alt="Profile"
          className="w-16 h-16 rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{mechanic.full_name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-foreground font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({ratingCount} ratings)</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {mechanic.is_verified ? (
            <ShieldCheck className="w-6 h-6 text-success" />
          ) : (
            <Shield className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {mechanic.is_verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </div>

      {/* Online toggle */}
      <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'}`} />
          <div>
            <p className="text-sm font-medium text-foreground">{isOnline ? 'Online' : 'Offline'}</p>
            <p className="text-xs text-muted-foreground">{isOnline ? 'Receiving job requests' : 'Not visible to users'}</p>
          </div>
        </div>
        <Switch checked={isOnline} onCheckedChange={handleToggleOnline} disabled={togglingOnline} />
      </div>

      {/* Editable fields */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
            <User className="w-4 h-4 text-muted-foreground" /> Full Name
          </label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" /> Phone
          </label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" /> Experience (years)
          </label>
          <Input
            type="number"
            min={0}
            max={50}
            value={experienceYears}
            onChange={e => setExperienceYears(Number(e.target.value))}
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Current Location
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground">
              {geoLoading ? 'Getting location...' : placeName || (hasLocation ? 'Location found' : 'Location unavailable')}
            </div>
            <Button variant="outline" size="icon" onClick={requestLocation} disabled={geoLoading}>
              {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Services offered */}
      <ServicesPicker selected={servicesOffered} onChange={setServicesOffered} />

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Changes
      </Button>

      <Button variant="destructive" onClick={logout} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
};

export default ProfileTab;
