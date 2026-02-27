
-- Create security definer functions to break RLS recursion between bookings ↔ booking_offers

-- Function: get booking IDs that have offers for a given mechanic user
CREATE OR REPLACE FUNCTION public.get_booking_ids_for_mechanic(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT bo.booking_id
  FROM booking_offers bo
  INNER JOIN mechanics m ON m.id = bo.mechanic_id
  WHERE m.user_id = _user_id;
$$;

-- Function: get booking IDs owned by a user (for booking_offers policy)
CREATE OR REPLACE FUNCTION public.get_user_booking_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM bookings WHERE user_id = _user_id;
$$;

-- Function: get mechanic IDs for a user (used in multiple policies)
CREATE OR REPLACE FUNCTION public.get_mechanic_ids_for_user(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM mechanics WHERE user_id = _user_id;
$$;

-- Fix bookings policies
DROP POLICY IF EXISTS "Mechanics can view bookings with their offers" ON public.bookings;
CREATE POLICY "Mechanics can view bookings with their offers"
  ON public.bookings AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_booking_ids_for_mechanic(auth.uid())));

DROP POLICY IF EXISTS "Mechanics can view assigned bookings" ON public.bookings;
CREATE POLICY "Mechanics can view assigned bookings"
  ON public.bookings AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (mechanic_id IN (SELECT public.get_mechanic_ids_for_user(auth.uid())));

DROP POLICY IF EXISTS "Mechanics can update assigned bookings" ON public.bookings;
CREATE POLICY "Mechanics can update assigned bookings"
  ON public.bookings AS PERMISSIVE
  FOR UPDATE TO authenticated
  USING (mechanic_id IN (SELECT public.get_mechanic_ids_for_user(auth.uid())));

-- Fix booking_offers policies to use security definer
DROP POLICY IF EXISTS "Users can view offers for their bookings" ON public.booking_offers;
CREATE POLICY "Users can view offers for their bookings"
  ON public.booking_offers AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (booking_id IN (SELECT public.get_user_booking_ids(auth.uid())));

DROP POLICY IF EXISTS "Mechanics can view their offers" ON public.booking_offers;
CREATE POLICY "Mechanics can view their offers"
  ON public.booking_offers AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (mechanic_id IN (SELECT public.get_mechanic_ids_for_user(auth.uid())));

DROP POLICY IF EXISTS "Mechanics can update their offers" ON public.booking_offers;
CREATE POLICY "Mechanics can update their offers"
  ON public.booking_offers AS PERMISSIVE
  FOR UPDATE TO authenticated
  USING (mechanic_id IN (SELECT public.get_mechanic_ids_for_user(auth.uid())));
