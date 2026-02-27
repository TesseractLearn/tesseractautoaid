import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculatePricing, type PricingBreakdown } from '@/lib/pricing';

export type { PricingBreakdown };

interface PaymentOrder {
  orderId: string;
  transactionId: string;
  amount: number;
  amountPaise: number;
  breakdown: {
    laborCost: number;
    partsCost: number;
    subtotal: number;
    tax: number;
    platformFee: number;
    total: number;
    mechanicShare: number;
  };
  razorpayKeyId: string;
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);

  const createPaymentOrder = useCallback(async (
    bookingId: string,
    laborCost: number,
    partsCost: number = 0,
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order', {
        body: { bookingId, laborCost, partsCost },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPaymentOrder(data);
      return data as PaymentOrder;
    } catch (err: any) {
      toast.error('Failed to create payment: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    transactionId: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Payment verified! Funds held securely.');
      return true;
    } catch (err: any) {
      toast.error('Payment verification failed: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const releasePayment = useCallback(async (transactionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-payment', {
        body: { transactionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Payment released! Mechanic receives ₹${data.mechanicShare}`);
      return true;
    } catch (err: any) {
      toast.error('Failed to release payment: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const raiseDispute = useCallback(async (transactionId: string, reason: string, photos?: string[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('raise-dispute', {
        body: { transactionId, reason, photos },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.info('Dispute raised. Funds held until resolution.');
      return true;
    } catch (err: any) {
      toast.error('Failed to raise dispute: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Local calculation for previews
  const calculateBreakdown = useCallback((
    hourlyRate: number,
    hours: number,
    partsCost: number = 0,
  ): PricingBreakdown => {
    return calculatePricing(hourlyRate, hours, partsCost);
  }, []);

  return {
    loading,
    paymentOrder,
    createPaymentOrder,
    verifyPayment,
    releasePayment,
    raiseDispute,
    calculateBreakdown,
  };
};
