import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';

interface PaymentBreakdownCardProps {
  mechanicQuote: number;
  platformFee: number;
  userPaysTotal: number;
  mechanicShare: number;
  status?: string;
  compact?: boolean;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  paid: { label: 'In Escrow', className: 'bg-warning/10 text-warning' },
  paid_escrow: { label: 'In Escrow', className: 'bg-warning/10 text-warning' },
  released_to_mechanic: { label: 'Released', className: 'bg-success/10 text-success' },
  released: { label: 'Released', className: 'bg-success/10 text-success' },
  disputed: { label: 'Disputed', className: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'Refunded', className: 'bg-primary/10 text-primary' },
};

const PaymentBreakdownCard: React.FC<PaymentBreakdownCardProps> = ({
  mechanicQuote,
  platformFee,
  userPaysTotal,
  mechanicShare,
  status,
  compact = false,
}) => {
  const statusInfo = status ? statusLabels[status] || statusLabels.pending : null;

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground font-medium">₹{userPaysTotal}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>₹{mechanicQuote} service</span>
          <ArrowRight className="w-3 h-3" />
          <span>₹{platformFee} fee</span>
        </div>
        {statusInfo && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Payment Breakdown
        </h3>
        {statusInfo && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Mechanic Quote</span>
          <span className="text-foreground">₹{mechanicQuote}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform Fee (15%)</span>
          <span className="text-foreground">₹{platformFee}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="font-semibold text-foreground">You Pay</span>
          <span className="text-lg font-bold text-foreground">₹{userPaysTotal}</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="w-3 h-3 text-success" />
          Mechanic receives ₹{mechanicShare}
        </div>
      </div>
    </div>
  );
};

export default PaymentBreakdownCard;
