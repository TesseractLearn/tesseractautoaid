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
    // Authenticate the user
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
    const { bookingId, mechanicId } = body

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

    // Verify booking belongs to this user and is still open
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .in('status', ['pending', 'offer_sent'])
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found or already claimed' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify mechanic exists and is available
    const { data: mechanic } = await supabase
      .from('mechanics')
      .select('id, full_name, is_available')
      .eq('id', mechanicId)
      .single()

    if (!mechanic) {
      return new Response(JSON.stringify({ error: 'Mechanic not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update booking: assign mechanic, set status to accepted
    await supabase
      .from('bookings')
      .update({ status: 'accepted', mechanic_id: mechanicId })
      .eq('id', bookingId)

    // Expire all existing offers for this booking
    await supabase
      .from('booking_offers')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId)

    // Create an accepted offer record for the selected mechanic
    await supabase
      .from('booking_offers')
      .insert({
        booking_id: bookingId,
        mechanic_id: mechanicId,
        status: 'accepted',
        score: 1,
        eta_minutes: null,
      })

    // Increment mechanic job counts
    const { data: mechFull } = await supabase
      .from('mechanics')
      .select('active_jobs_count, recent_jobs_count, total_jobs_count')
      .eq('id', mechanicId)
      .single()

    if (mechFull) {
      await supabase
        .from('mechanics')
        .update({
          active_jobs_count: (mechFull.active_jobs_count || 0) + 1,
          recent_jobs_count: (mechFull.recent_jobs_count || 0) + 1,
          total_jobs_count: (mechFull.total_jobs_count || 0) + 1,
        })
        .eq('id', mechanicId)
    }

    // Update linked service requests
    await supabase
      .from('service_requests')
      .update({ status: 'accepted', target_mechanic_id: mechanicId })
      .eq('user_id', userId)
      .eq('status', 'pending')

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Mechanic ${mechanic.full_name} selected!` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('user-select-mechanic error:', err)
    return new Response(JSON.stringify({ error: 'Failed to select mechanic' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
