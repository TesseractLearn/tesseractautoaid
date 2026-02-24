
-- Add new columns to mechanics table
ALTER TABLE public.mechanics
  ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_url text,
  ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS services_offered text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avg_response_time double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_eta double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rating_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Create transactions table for mechanic earnings
CREATE TABLE IF NOT EXISTS public.mechanic_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id uuid NOT NULL REFERENCES public.mechanics(id),
  booking_id uuid REFERENCES public.bookings(id),
  amount numeric NOT NULL DEFAULT 0,
  transaction_type text NOT NULL DEFAULT 'payment',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mechanic_transactions ENABLE ROW LEVEL SECURITY;

-- Mechanics can view their own transactions
CREATE POLICY "Mechanics can view their own transactions"
  ON public.mechanic_transactions
  FOR SELECT
  USING (mechanic_id IN (
    SELECT id FROM public.mechanics WHERE user_id = auth.uid()
  ));

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.mechanic_transactions;
