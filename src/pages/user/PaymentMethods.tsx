import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreditCard, Smartphone, Plus, Trash2, Star, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  method_type: 'upi' | 'card';
  display_name: string;
  masked_identifier: string;
  is_default: boolean;
}

const PaymentMethods: React.FC = () => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [methodType, setMethodType] = useState<'upi' | 'card'>('upi');
  const [saving, setSaving] = useState(false);

  // Form state
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    fetchMethods();
  }, [user]);

  const fetchMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setMethods((data || []) as PaymentMethod[]);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUpiId('');
    setCardNumber('');
    setCardName('');
    setMethodType('upi');
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate
    if (methodType === 'upi' && !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID');
      return;
    }
    if (methodType === 'card' && (cardNumber.length < 16 || !cardName)) {
      toast.error('Please enter valid card details');
      return;
    }

    setSaving(true);
    try {
      let displayName: string;
      let maskedIdentifier: string;

      if (methodType === 'upi') {
        displayName = 'UPI';
        maskedIdentifier = upiId;
      } else {
        displayName = cardName;
        // Only store last 4 digits for security
        maskedIdentifier = '**** **** **** ' + cardNumber.slice(-4);
      }

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          method_type: methodType,
          display_name: displayName,
          masked_identifier: maskedIdentifier,
          is_default: methods.length === 0,
        });

      if (error) throw error;
      
      toast.success('Payment method added');
      setIsDialogOpen(false);
      resetForm();
      fetchMethods();
    } catch (err) {
      console.error('Error saving payment method:', err);
      toast.error('Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Payment method removed');
      fetchMethods();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      toast.error('Failed to remove payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Default payment method updated');
      fetchMethods();
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
          <h1 className="text-xl font-bold text-foreground">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">Manage your saved payment options securely</p>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Security Note */}
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Your data is secure</p>
            <p className="text-xs text-green-700 dark:text-green-300">
              We never store complete card numbers. Only masked identifiers are saved.
            </p>
          </div>
        </div>

        {methods.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No payment methods</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add a payment method for faster checkout.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          <>
            {/* Methods List */}
            <div className="space-y-4 mb-6">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className={`bg-card border rounded-xl p-4 ${
                    method.is_default ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      method.is_default ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {method.method_type === 'upi' ? (
                        <Smartphone className="w-6 h-6" />
                      ) : (
                        <CreditCard className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{method.display_name}</h3>
                        {method.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.masked_identifier}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this payment method?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(method.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Set as Default
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Button */}
            <Button onClick={() => setIsDialogOpen(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={methodType} onValueChange={(v) => setMethodType(v as 'upi' | 'card')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> UPI
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Debit/Credit Card
                </Label>
              </div>
            </RadioGroup>

            {methodType === 'upi' ? (
              <div>
                <Label>UPI ID</Label>
                <Input
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <Label>Card Number</Label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    maxLength={16}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only last 4 digits will be stored for security
                  </p>
                </div>
                <div>
                  <Label>Card Name (e.g., HDFC Debit Card)</Label>
                  <Input
                    placeholder="Bank Name + Card Type"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Payment Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethods;
