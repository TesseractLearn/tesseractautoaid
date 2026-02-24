
-- Add symptom-related columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS selected_problems text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS estimated_price_min numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estimated_price_max numeric DEFAULT NULL;
