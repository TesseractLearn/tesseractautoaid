
CREATE TABLE public.mechanic_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id),
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mechanic_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reviews"
  ON public.mechanic_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON public.mechanic_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.mechanic_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_mechanic_reviews_mechanic_id ON public.mechanic_reviews(mechanic_id);
