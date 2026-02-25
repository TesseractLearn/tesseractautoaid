
-- Create a public view that excludes sensitive mechanic data (phone, documents_url)
CREATE OR REPLACE VIEW public.mechanics_public AS
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
  total_earnings,
  experience_years,
  avg_response_time,
  avg_eta,
  total_rating_count,
  address,
  services_offered,
  profile_photo_url,
  created_at,
  updated_at
FROM public.mechanics;

-- Enable RLS on the view
ALTER VIEW public.mechanics_public SET (security_invoker = true);

-- Grant access
GRANT SELECT ON public.mechanics_public TO authenticated;
GRANT SELECT ON public.mechanics_public TO anon;
