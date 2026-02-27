import React, { useState } from 'react';
import { Shield, CreditCard, Smartphone, Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePayment } from '@/hooks/usePayment';
import { calculatePricing } from '@/lib/pricing';
import PaymentBreakdownCard from './PaymentBreakdownCard';

interface PaymentCheckoutProps {
  bookingId: string;
  mechanicName: string;
  mechanicRating: number | null;
  serviceType: string;
  hourlyRate: number;
  estimatedHours: number;
  actualHours?: number;
  partsCost?: number;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  bookingId,
  mechanicName,
  mechanicRating,
  serviceType,
  hourlyRate,
  estimatedHours,
  actualHours,
  partsCost: initialPartsCost = 0,
  onPaymentComplete,
  onCancel,
}) => {
  const { loading, createPaymentOrder, verifyPayment } = usePayment();
  const [step, setStep] = useState<'quote' | 'paying' | 'success'>('quote');
  const [hours, setHours] = useState(actualHours ?? estimatedHours);
  const [rate, setRate] = useState(hourlyRate);
  const [partsCost, setPartsCost] = useState(initialPartsCost);

  const breakdown = calculatePricing(rate, hours, partsCost);

  const handlePay = async () => {
    setStep('paying');
    const order = await createPaymentOrder(bookingId, breakdown.laborCost, breakdown.partsCost);
    if (!order) {
      setStep('quote');
      return;
    }

    // Load Razorpay SDK if not loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    const options = {
      key: order.razorpayKeyId,
      amount: order.amountPaise,
      currency: 'INR',
      name: 'AutoAid',
      description: `${serviceType} - ${mechanicName}`,
      order_id: order.orderId,
      handler: async (response: any) => {
        const verified = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          transactionId: order.transactionId,
        });
        if (verified) {
          setStep('success');
          setTimeout(onPaymentComplete, 2000);
        } else {
          setStep('quote');
        }
      },
      modal: { ondismiss: () => setStep('quote') },
      prefill: {},
      theme: { color: '#2563EB' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
        <p className="text-sm text-muted-foreground text-center">
          ₹{breakdown.total} held securely.<br />
          Funds will be released when you confirm job completion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Secure Payment</h2>
        <p className="text-xs text-muted-foreground">Funds held safely until job is complete</p>
      </div>

      {/* Service info */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground capitalize">{serviceType.replace('_', ' ')}</span>
          <Badge variant="outline">{mechanicName}</Badge>
        </div>
        {mechanicRating && (
          <p className="text-xs text-muted-foreground">★ {Number(mechanicRating).toFixed(1)} rating</p>
        )}
      </div>

      {/* Pricing inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Rate (₹/hr)</label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Hours</label>
          <Input
            type="number"
            value={hours}
            onChange={(e) => setHours(Math.max(0.5, Number(e.target.value)))}
            min={0.5}
            step={0.5}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Parts Cost (₹)</label>
        <Input
          type="number"
          value={partsCost}
          onChange={(e) => setPartsCost(Math.max(0, Number(e.target.value)))}
          min={0}
        />
      </div>

      {/* Transparent breakdown */}
      <PaymentBreakdownCard
        laborCost={breakdown.laborCost}
        partsCost={breakdown.partsCost}
        subtotal={breakdown.subtotal}
        tax={breakdown.tax}
        platformFee={breakdown.platformFee}
        total={breakdown.total}
        mechanicShare={breakdown.mechanicShare}
        hours={hours}
        hourlyRate={rate}
      />

      {/* Payment methods hint */}
      <div className="flex items-center justify-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1 text-xs">
          <Smartphone className="w-4 h-4" /> UPI
        </div>
        <div className="flex items-center gap-1 text-xs">
          <CreditCard className="w-4 h-4" /> Card
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Wallet className="w-4 h-4" /> Wallet
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          onClick={handlePay}
          disabled={loading || breakdown.total <= 0}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Shield className="w-5 h-5 mr-2" />
          )}
          Pay ₹{breakdown.total} Securely
        </Button>
        <Button variant="ghost" className="w-full" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PaymentCheckout;
