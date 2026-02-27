
-- Add hourly_rate to mechanics
ALTER TABLE public.mechanics ADD COLUMN IF NOT EXISTS hourly_rate numeric DEFAULT 200;

-- Add pricing columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS parts_cost numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS labor_cost numeric DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT NULL;

-- Add tax_amount to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS labor_cost numeric DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS parts_cost numeric DEFAULT 0;
