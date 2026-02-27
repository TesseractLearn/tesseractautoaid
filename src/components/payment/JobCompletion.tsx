import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePayment } from '@/hooks/usePayment';
import PaymentBreakdownCard from './PaymentBreakdownCard';

interface JobCompletionProps {
  transactionId: string;
  mechanicName: string;
  laborCost: number;
  partsCost: number;
  subtotal: number;
  tax: number;
  platformFee: number;
  total: number;
  mechanicShare: number;
  hours?: number;
  hourlyRate?: number;
  onPaymentReleased: () => void;
  onDispute: () => void;
}

const JobCompletion: React.FC<JobCompletionProps> = ({
  transactionId,
  mechanicName,
  laborCost,
  partsCost,
  subtotal,
  tax,
  platformFee,
  total,
  mechanicShare,
  hours,
  hourlyRate,
  onPaymentReleased,
  onDispute,
}) => {
  const { loading, releasePayment, raiseDispute } = usePayment();
  const [step, setStep] = useState<'confirm' | 'rating' | 'dispute' | 'done'>('confirm');
  const [rating, setRating] = useState(5);
  const [disputeReason, setDisputeReason] = useState('');

  const handleRelease = async () => {
    const success = await releasePayment(transactionId);
    if (success) setStep('rating');
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    const success = await raiseDispute(transactionId, disputeReason);
    if (success) onDispute();
  };

  if (step === 'rating') {
    return (
      <div className="space-y-6 py-4 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Payment Released!</h2>
          <p className="text-sm text-muted-foreground mt-1">₹{mechanicShare} sent to {mechanicName}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">Rate {mechanicName}</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                <Star className={`w-8 h-8 ${star <= rating ? 'text-warning fill-warning' : 'text-border'}`} />
              </button>
            ))}
          </div>
          <Button onClick={() => { setStep('done'); onPaymentReleased(); }} className="w-full">
            Submit Rating
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'dispute') {
    return (
      <div className="space-y-6 py-4 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Raise a Dispute</h2>
          <p className="text-sm text-muted-foreground">Funds will be held until resolved</p>
        </div>
        <Textarea placeholder="Describe the issue..." value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={4} />
        <div className="space-y-3">
          <Button variant="destructive" className="w-full" onClick={handleDispute} disabled={loading || !disputeReason.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Dispute
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep('confirm')}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="text-center py-12 animate-fade-in">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">All Done!</h2>
        <p className="text-sm text-muted-foreground">Thank you for using AutoAid</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Job Completed!</h2>
        <p className="text-sm text-muted-foreground mt-1">{mechanicName} marked the job as complete</p>
      </div>

      {/* Full invoice breakdown */}
      <PaymentBreakdownCard
        laborCost={laborCost}
        partsCost={partsCost}
        subtotal={subtotal}
        tax={tax}
        platformFee={platformFee}
        total={total}
        mechanicShare={mechanicShare}
        hours={hours}
        hourlyRate={hourlyRate}
      />

      {/* Actions */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleRelease} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          Release Payment ₹{mechanicShare}
        </Button>
        <Button variant="outline" className="w-full text-destructive border-destructive/30" onClick={() => setStep('dispute')} disabled={loading}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Raise Dispute
        </Button>
      </div>
    </div>
  );
};

export default JobCompletion;
