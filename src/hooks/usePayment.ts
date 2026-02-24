import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentBreakdown {
  mechanicQuote: number;
  platformFee: number;
  userPaysTotal: number;
  mechanicShare: number;
}

interface PaymentOrder {
  orderId: string;
  transactionId: string;
  amount: number;
  amountPaise: number;
  breakdown: PaymentBreakdown;
  razorpayKeyId: string;
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);

  const createPaymentOrder = useCallback(async (bookingId: string, mechanicQuote: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order', {
        body: { bookingId, mechanicQuote },
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
      toast.success('Payment verified! Funds held securely in escrow.');
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

  // Local calculation for preview (before API call)
  const calculateBreakdown = useCallback((mechanicQuote: number): PaymentBreakdown => {
    const platformFee = Math.max(Math.round(mechanicQuote * 0.15), 50);
    const userPaysTotal = mechanicQuote + platformFee;
    const mechanicShare = mechanicQuote - platformFee;
    return { mechanicQuote, platformFee, userPaysTotal, mechanicShare };
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
