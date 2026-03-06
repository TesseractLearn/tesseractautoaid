
-- Create messages table for in-app chat between user and mechanic
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages for their own bookings
CREATE POLICY "Users can view messages for their bookings"
  ON public.messages FOR SELECT
  USING (
    booking_id IN (SELECT get_user_booking_ids(auth.uid()))
  );

-- Mechanics can read messages for bookings they are assigned to
CREATE POLICY "Mechanics can view messages for assigned bookings"
  ON public.messages FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      INNER JOIN public.mechanics m ON m.id = b.mechanic_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Users can insert messages for their own bookings
CREATE POLICY "Users can send messages for their bookings"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND booking_id IN (SELECT get_user_booking_ids(auth.uid()))
  );

-- Mechanics can insert messages for bookings they are assigned to
CREATE POLICY "Mechanics can send messages for assigned bookings"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND booking_id IN (
      SELECT b.id FROM public.bookings b
      INNER JOIN public.mechanics m ON m.id = b.mechanic_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
