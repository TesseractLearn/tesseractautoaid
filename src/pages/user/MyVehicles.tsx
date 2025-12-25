import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Car, Bike, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  vehicle_type: 'bike' | 'car';
  vehicle_number: string;
  brand: string;
  model: string;
  fuel_type: string;
  is_default: boolean;
}

const MyVehicles: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vehicle_type: 'car' as 'bike' | 'car',
    vehicle_number: '',
    brand: '',
    model: '',
    fuel_type: 'petrol',
    is_default: false,
  });

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setVehicles((data || []) as Vehicle[]);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_type: 'car',
      vehicle_number: '',
      brand: '',
      model: '',
      fuel_type: 'petrol',
      is_default: false,
    });
    setEditingVehicle(null);
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        vehicle_type: vehicle.vehicle_type,
        vehicle_number: vehicle.vehicle_number,
        brand: vehicle.brand,
        model: vehicle.model,
        fuel_type: vehicle.fuel_type,
        is_default: vehicle.is_default,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.vehicle_number.trim() || !formData.brand.trim() || !formData.model.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update({
            vehicle_type: formData.vehicle_type,
            vehicle_number: formData.vehicle_number.toUpperCase(),
            brand: formData.brand,
            model: formData.model,
            fuel_type: formData.fuel_type,
            is_default: formData.is_default,
          })
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success('Vehicle updated successfully');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert({
            user_id: user.id,
            vehicle_type: formData.vehicle_type,
            vehicle_number: formData.vehicle_number.toUpperCase(),
            brand: formData.brand,
            model: formData.model,
            fuel_type: formData.fuel_type,
            is_default: vehicles.length === 0 ? true : formData.is_default,
          });

        if (error) throw error;
        toast.success('Vehicle added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      toast.error('Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      toast.error('Failed to delete vehicle');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Default vehicle updated');
      fetchVehicles();
    } catch (err) {
      console.error('Error setting default:', err);
      toast.error('Failed to set default');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border safe-area-inset-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">My Vehicles</h1>
          <p className="text-sm text-muted-foreground">Manage your registered vehicles</p>
        </div>
      </header>

      <main className="px-4 py-6">
        {vehicles.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Car className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No vehicles added yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add a vehicle to book services faster and get personalized assistance.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        ) : (
          <>
            {/* Vehicle List */}
            <div className="space-y-4 mb-6">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`bg-card border rounded-xl p-4 ${
                    vehicle.is_default ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      vehicle.is_default ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {vehicle.vehicle_type === 'bike' ? (
                        <Bike className="w-6 h-6" />
                      ) : (
                        <Car className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        {vehicle.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{vehicle.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {vehicle.vehicle_type} • {vehicle.fuel_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(vehicle)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {vehicle.brand} {vehicle.model}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(vehicle.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {!vehicle.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleSetDefault(vehicle.id)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Set as Default
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Button */}
            <Button onClick={() => handleOpenDialog()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(v) => setFormData({ ...formData, vehicle_type: v as 'bike' | 'car' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Vehicle Number</Label>
              <Input
                placeholder="e.g., MH12AB1234"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              />
            </div>

            <div>
              <Label>Brand</Label>
              <Input
                placeholder="e.g., Honda, Toyota"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div>
              <Label>Model</Label>
              <Input
                placeholder="e.g., City, Camry"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div>
              <Label>Fuel Type</Label>
              <Select
                value={formData.fuel_type}
                onValueChange={(v) => setFormData({ ...formData, fuel_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyVehicles;
