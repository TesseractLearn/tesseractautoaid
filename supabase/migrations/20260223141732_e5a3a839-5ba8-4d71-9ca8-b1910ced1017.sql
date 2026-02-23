
-- Service requests table: stores broadcast/direct requests from users to mechanics
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  issue_description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  radius_km DOUBLE PRECISION DEFAULT 10,
  target_mechanic_id UUID REFERENCES public.mechanics(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.service_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own requests (e.g. cancel)
CREATE POLICY "Users can update their own requests"
ON public.service_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Mechanics can view requests targeted to them or broadcast requests nearby
CREATE POLICY "Mechanics can view relevant requests"
ON public.service_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mechanics
    WHERE mechanics.user_id = auth.uid()
      AND mechanics.is_available = true
  )
  AND (
    target_mechanic_id IS NULL
    OR target_mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid())
  )
  AND status = 'pending'
);

-- Mechanic responses table
CREATE TABLE public.service_request_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, mechanic_id)
);

ALTER TABLE public.service_request_responses ENABLE ROW LEVEL SECURITY;

-- Mechanics can insert responses
CREATE POLICY "Mechanics can respond to requests"
ON public.service_request_responses
FOR INSERT
WITH CHECK (
  mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid())
);

-- Mechanics can view their own responses
CREATE POLICY "Mechanics can view their responses"
ON public.service_request_responses
FOR SELECT
USING (
  mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid())
);

-- Mechanics can update their responses
CREATE POLICY "Mechanics can update their responses"
ON public.service_request_responses
FOR UPDATE
USING (
  mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid())
);

-- Users can view responses to their requests
CREATE POLICY "Users can view responses to their requests"
ON public.service_request_responses
FOR SELECT
USING (
  request_id IN (SELECT id FROM public.service_requests WHERE user_id = auth.uid())
);

-- Triggers for updated_at
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_request_responses_updated_at
BEFORE UPDATE ON public.service_request_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_request_responses;
