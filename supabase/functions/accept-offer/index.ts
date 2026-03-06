import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate the mechanic
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = userData.user.id

    // Use service role for transactional operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { bookingId, mechanicId, quotedPrice } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!bookingId || typeof bookingId !== 'string' || !uuidRegex.test(bookingId)) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!mechanicId || typeof mechanicId !== 'string' || !uuidRegex.test(mechanicId)) {
      return new Response(JSON.stringify({ error: 'Invalid mechanic ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (quotedPrice !== undefined && quotedPrice !== null && (typeof quotedPrice !== 'number' || quotedPrice < 50 || quotedPrice > 500000)) {
      return new Response(JSON.stringify({ error: 'Invalid quoted price' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify caller is this mechanic
    const { data: mechanic } = await supabase
      .from('mechanics')
      .select('id, recent_jobs_count, total_jobs_count')
      .eq('id', mechanicId)
      .eq('user_id', userId)
      .single()

    if (!mechanic) {
      return new Response(JSON.stringify({ error: 'Not authorized for this mechanic' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Enforce max active jobs based on actual booking states (avoid stale counter blocking)
    const activeStatuses = ['accepted', 'on_way', 'repair_in_progress', 'in_progress']
    const { count: activeBookingsCount, error: activeCountError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('mechanic_id', mechanicId)
      .in('status', activeStatuses)

    if (activeCountError) throw activeCountError

    if ((activeBookingsCount || 0) >= 3) {
      return new Response(JSON.stringify({ error: 'Max 3 active jobs allowed. Complete or cancel an existing job first.' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check booking is still available
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .in('status', ['offer_sent', 'pending'])
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking already taken or expired' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify there's a pending offer for this mechanic
    const { data: offer } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('mechanic_id', mechanicId)
      .eq('status', 'pending')
      .single()

    if (!offer) {
      return new Response(JSON.stringify({ error: 'No pending offer found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Accept: update booking with quote
    const platformFee = quotedPrice ? Math.max(Math.round(quotedPrice * 0.15), 50) : null
    await supabase
      .from('bookings')
      .update({
        status: 'accepted',
        mechanic_id: mechanicId,
        mechanic_quote: quotedPrice || null,
        platform_fee: platformFee,
        payment_status: 'unpaid',
      })
      .eq('id', bookingId)

    // Mark this offer as accepted
    await supabase
      .from('booking_offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id)

    // Expire all other offers for this booking
    await supabase
      .from('booking_offers')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId)
      .neq('id', offer.id)

    // Increment mechanic job counts properly
    await supabase
      .from('mechanics')
      .update({
        active_jobs_count: (activeBookingsCount || 0) + 1,
        recent_jobs_count: (mechanic.recent_jobs_count || 0) + 1,
        total_jobs_count: (mechanic.total_jobs_count || 0) + 1,
      })
      .eq('id', mechanicId)

    // Also update service_requests if linked
    await supabase
      .from('service_requests')
      .update({ status: 'accepted', target_mechanic_id: mechanicId })
      .eq('user_id', booking.user_id)
      .eq('status', 'pending')

    return new Response(JSON.stringify({ success: true, message: 'Offer accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('accept-offer error:', err)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
