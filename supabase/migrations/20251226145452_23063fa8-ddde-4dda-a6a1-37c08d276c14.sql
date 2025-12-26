-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view registered mechanics" ON public.mechanics;

-- Create a function to check if user has active booking with mechanic
CREATE OR REPLACE FUNCTION public.has_active_booking_with_mechanic(_user_id uuid, _mechanic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE user_id = _user_id
      AND mechanic_id = _mechanic_id
      AND status IN ('pending', 'accepted', 'in_progress')
  )
$$;

-- Create a view for public mechanic data (non-sensitive fields only)
CREATE OR REPLACE VIEW public.mechanics_public AS
SELECT 
  id,
  full_name,
  rating,
  specialization,
  is_available,
  latitude,
  longitude,
  created_at
FROM public.mechanics;

-- Grant access to the view
GRANT SELECT ON public.mechanics_public TO anon, authenticated;

-- New policy: Users can view basic mechanic info (through the view)
-- For the actual table, only show full details if they have an active booking
CREATE POLICY "Users can view mechanics with active booking"
ON public.mechanics
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_active_booking_with_mechanic(auth.uid(), id)
);