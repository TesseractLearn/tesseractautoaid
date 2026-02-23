
-- Add missing columns to mechanics table
ALTER TABLE public.mechanics 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS active_jobs_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS recent_jobs_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_jobs_count integer DEFAULT 0;

-- Add priority column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Create booking_offers table
CREATE TABLE public.booking_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  mechanic_id uuid NOT NULL REFERENCES public.mechanics(id),
  status text NOT NULL DEFAULT 'pending',
  score double precision NOT NULL DEFAULT 0,
  eta_minutes double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on booking_offers
ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;

-- Mechanics can view their own offers
CREATE POLICY "Mechanics can view their offers"
ON public.booking_offers
FOR SELECT
USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

-- Users can view offers for their bookings
CREATE POLICY "Users can view offers for their bookings"
ON public.booking_offers
FOR SELECT
USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

-- Service role can manage all offers (for edge functions)
CREATE POLICY "Service role can manage offers"
ON public.booking_offers
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for booking_offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_offers;

-- Add trigger for updated_at on booking_offers
CREATE TRIGGER update_booking_offers_updated_at
BEFORE UPDATE ON public.booking_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
