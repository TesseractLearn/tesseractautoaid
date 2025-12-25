import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, MapPin, CreditCard, Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPrefs {
  booking_updates: boolean;
  mechanic_arrival: boolean;
  payment_confirmations: boolean;
  promotional: boolean;
}

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    booking_updates: true,
    mechanic_arrival: true,
    payment_confirmations: true,
    promotional: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrefs({
          booking_updates: data.booking_updates,
          mechanic_arrival: data.mechanic_arrival,
          payment_confirmations: data.payment_confirmations,
          promotional: data.promotional,
        });
      } else {
        // Create default preferences
        await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            booking_updates: true,
            mechanic_arrival: true,
            payment_confirmations: true,
            promotional: false,
          });
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPrefs) => {
    if (!user) return;

    const newValue = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: newValue }));
    setSaving(true);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: newValue })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Preference updated');
    } catch (err) {
      console.error('Error updating preference:', err);
      // Revert on error
      setPrefs((prev) => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const notifications = [
    {
      key: 'booking_updates' as const,
      icon: Bell,
      title: 'Booking Updates',
      description: 'Get notified about booking confirmations and status changes',
    },
    {
      key: 'mechanic_arrival' as const,
      icon: MapPin,
      title: 'Mechanic Arrival Alerts',
      description: 'Know when your mechanic is on the way or has arrived',
    },
    {
      key: 'payment_confirmations' as const,
      icon: CreditCard,
      title: 'Payment Confirmations',
      description: 'Receive receipts and payment status updates',
    },
    {
      key: 'promotional' as const,
      icon: Megaphone,
      title: 'Promotional Notifications',
      description: 'Offers, discounts, and special promotions',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border safe-area-inset-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Control alerts and updates</p>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="space-y-4">
          {notifications.map(({ key, icon: Icon, title, description }) => (
            <div
              key={key}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key} className="font-semibold text-foreground cursor-pointer">
                      {title}
                    </Label>
                    <Switch
                      id={key}
                      checked={prefs[key]}
                      onCheckedChange={() => handleToggle(key)}
                      disabled={saving}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NotificationSettings;
