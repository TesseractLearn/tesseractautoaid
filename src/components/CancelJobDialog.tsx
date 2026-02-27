import React, { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancelJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  role: 'user' | 'mechanic';
}

const USER_REASONS = [
  'Too expensive',
  'Mechanic too far away',
  'Changed my mind',
  'Found another service',
  'Taking too long',
];

const MECHANIC_REASONS = [
  'Too far from customer',
  'Unable to service this vehicle',
  'Emergency / personal issue',
  'Parts not available',
  'Customer not responding',
];

const CancelJobDialog: React.FC<CancelJobDialogProps> = ({ open, onOpenChange, onConfirm, role }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = role === 'user' ? USER_REASONS : MECHANIC_REASONS;

  const handleConfirm = async () => {
    const reason = selected === 'Other' ? otherText.trim() : selected;
    if (!reason) return;
    setSubmitting(true);
    try {
      await onConfirm(reason);
    } finally {
      setSubmitting(false);
      setSelected(null);
      setOtherText('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" /> Cancel Job
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please select a reason for cancellation. The other party will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          {[...reasons, 'Other'].map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                selected === reason
                  ? 'border-destructive bg-destructive/10 text-destructive font-medium'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              )}
            >
              {reason}
            </button>
          ))}

          {selected === 'Other' && (
            <Textarea
              placeholder="Tell us more..."
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              className="mt-2"
              rows={2}
            />
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Go Back</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selected || (selected === 'Other' && !otherText.trim()) || submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Confirm Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelJobDialog;
