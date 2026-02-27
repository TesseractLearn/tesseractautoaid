import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Algorithm weights from the AutoAid research paper
const WEIGHTS = { distance: 0.45, rating: 0.25, workload: 0.15, fairness: 0.15 }
const TOP_K = 3
const INITIAL_RADIUS_KM = 150
const AVERAGE_SPEED_KMH = 30 // for ETA approximation

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function computeMechanicScore(params: {
  etaMinutes: number
  rating: number
  activeJobsCount: number
  recentJobsCount: number
  totalJobsCount: number
}): number {
  const distanceFactor = Math.exp(-params.etaMinutes / 10)
  const ratingFactor = params.rating > 0 ? params.rating / 5 : 1
  const workloadFactor = 1 / (1 + (params.activeJobsCount || 0))
  const fairnessRatio = params.totalJobsCount > 0
    ? (params.recentJobsCount || 0) / params.totalJobsCount
    : 0
  const fairnessFactor = 1 - Math.min(1, fairnessRatio)

  return (
    WEIGHTS.distance * distanceFactor +
    WEIGHTS.rating * ratingFactor +
    WEIGHTS.workload * workloadFactor +
    WEIGHTS.fairness * fairnessFactor
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Auth: allow user (JWT) OR internal service-role calls ──
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    let callerId: string | null = null
    const isServiceCall = token === serviceRoleKey

    if (!isServiceCall) {
      // Validate JWT for normal user calls
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
      if (claimsErr || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      callerId = claims.claims.sub as string
    }

    const body = await req.json()
    const { bookingId, radiusKm, excludeMechanicIds } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!bookingId || typeof bookingId !== 'string' || !uuidRegex.test(bookingId)) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (radiusKm !== undefined && (typeof radiusKm !== 'number' || radiusKm < 1 || radiusKm > 500)) {
      return new Response(JSON.stringify({ error: 'Invalid radius' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (excludeMechanicIds !== undefined && (!Array.isArray(excludeMechanicIds) || excludeMechanicIds.length > 50 || !excludeMechanicIds.every((id: unknown) => typeof id === 'string' && uuidRegex.test(id)))) {
      return new Response(JSON.stringify({ error: 'Invalid exclude list' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const radius = radiusKm || INITIAL_RADIUS_KM
    const excludeIds: string[] = excludeMechanicIds || []

    // Load booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Ownership check: user calls must own the booking ──
    if (callerId && booking.user_id !== callerId) {
      return new Response(JSON.stringify({ error: 'Booking not found or access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Query available AND verified mechanics only
    const { data: mechanics, error: mechErr } = await supabase
      .from('mechanics')
      .select('*')
      .eq('is_available', true)
      .eq('is_verified', true)
    if (mechErr) throw mechErr

    // Filter by radius and exclude already-offered mechanics
    const candidates = (mechanics || [])
      .filter(m => !excludeIds.includes(m.id))
      .map(m => {
        const distKm = haversineDistance(booking.latitude, booking.longitude, m.latitude, m.longitude)
        const etaMinutes = (distKm / AVERAGE_SPEED_KMH) * 60
        return { ...m, distKm, etaMinutes }
      })
      .filter(m => m.distKm <= radius)

    if (candidates.length === 0) {
      await supabase
        .from('bookings')
        .update({ status: 'no_mechanic_found' })
        .eq('id', bookingId)

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'no_mechanic_found',
        message: 'No available mechanics in range' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Score and sort
    const scored = candidates.map(m => ({
      mechanicId: m.id,
      score: computeMechanicScore({
        etaMinutes: m.etaMinutes,
        rating: Number(m.rating) || 0,
        activeJobsCount: m.active_jobs_count || 0,
        recentJobsCount: m.recent_jobs_count || 0,
        totalJobsCount: m.total_jobs_count || 0,
      }),
      etaMinutes: m.etaMinutes,
      fullName: m.full_name,
    })).sort((a, b) => b.score - a.score).slice(0, TOP_K)

    // Insert booking_offers
    const offers = scored.map(s => ({
      booking_id: bookingId,
      mechanic_id: s.mechanicId,
      status: 'pending',
      score: s.score,
      eta_minutes: Math.round(s.etaMinutes),
    }))

    const { error: offerErr } = await supabase
      .from('booking_offers')
      .insert(offers)

    if (offerErr) throw offerErr

    // Update booking status
    await supabase
      .from('bookings')
      .update({ status: 'offer_sent' })
      .eq('id', bookingId)

    return new Response(JSON.stringify({
      success: true,
      status: 'offer_sent',
      offersCount: scored.length,
      candidates: scored,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('dispatch-booking error:', err)
    return new Response(JSON.stringify({ error: 'Failed to dispatch booking' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
