
-- Create transactions table for payment tracking
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  user_id uuid NOT NULL,
  mechanic_id uuid NOT NULL REFERENCES public.mechanics(id),
  mechanic_quote numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  user_paid_total numeric NOT NULL DEFAULT 0,
  mechanic_share numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  dispute_reason text,
  dispute_photos text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  released_at timestamptz,
  disputed_at timestamptz,
  refunded_at timestamptz
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Mechanics can view their transactions"
  ON public.transactions FOR SELECT
  USING (mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid()));

-- Add quote columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS mechanic_quote numeric,
  ADD COLUMN IF NOT EXISTS platform_fee numeric,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
