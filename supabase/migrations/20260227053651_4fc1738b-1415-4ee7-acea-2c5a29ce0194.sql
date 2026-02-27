
-- ============================================================
-- FIX 1: Restrict mechanics_public view to authenticated users
-- ============================================================

-- Drop and recreate mechanics_public view WITHOUT sensitive fields
DROP VIEW IF EXISTS public.mechanics_public;

CREATE VIEW public.mechanics_public AS
SELECT
  id,
  user_id,
  full_name,
  specialization,
  latitude,
  longitude,
  rating,
  is_available,
  is_verified,
  active_jobs_count,
  recent_jobs_count,
  total_jobs_count,
  experience_years,
  avg_response_time,
  avg_eta,
  total_rating_count,
  services_offered,
  profile_photo_url,
  address,
  created_at,
  updated_at
FROM public.mechanics;

-- Note: total_earnings, phone, documents_url are excluded from view

-- Enable RLS on the view
ALTER VIEW public.mechanics_public SET (security_invoker = on);

-- ============================================================
-- FIX 2: Lock down mechanic_reviews
-- ============================================================

-- Make booking_id required (clean up any NULL booking_ids first)
DELETE FROM public.mechanic_reviews WHERE booking_id IS NULL;

ALTER TABLE public.mechanic_reviews
  ALTER COLUMN booking_id SET NOT NULL;

-- Add unique constraint: one review per booking
ALTER TABLE public.mechanic_reviews
  DROP CONSTRAINT IF EXISTS unique_review_per_booking;

ALTER TABLE public.mechanic_reviews
  ADD CONSTRAINT unique_review_per_booking UNIQUE (booking_id, user_id);

-- Replace INSERT policy to require completed booking
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.mechanic_reviews;

CREATE POLICY "Users can insert reviews for completed bookings"
  ON public.mechanic_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = mechanic_reviews.booking_id
        AND bookings.user_id = auth.uid()
        AND bookings.mechanic_id = mechanic_reviews.mechanic_id
        AND bookings.status = 'completed'
        AND bookings.completed_at IS NOT NULL
    )
  );
