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

    // Verify booking belongs to this user and is still open for requests
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, user_id, status')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .in('status', ['pending', 'offer_sent'])
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found or already claimed' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify mechanic exists and can currently receive requests
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

    if (mechanic.is_available !== true) {
      return new Response(JSON.stringify({ error: 'Selected mechanic is currently offline' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Optional targeting behavior: expire other pending offers so only selected mechanic is notified
    await supabase
      .from('booking_offers')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .neq('mechanic_id', mechanicId)

    // Ensure selected mechanic has a pending offer (request to accept/reject)
    const { data: existingOffer } = await supabase
      .from('booking_offers')
      .select('id, status')
      .eq('booking_id', bookingId)
      .eq('mechanic_id', mechanicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingOffer) {
      if (existingOffer.status !== 'pending') {
        await supabase
          .from('booking_offers')
          .update({ status: 'pending', score: 1, eta_minutes: null })
          .eq('id', existingOffer.id)
      }
    } else {
      await supabase
        .from('booking_offers')
        .insert({
          booking_id: bookingId,
          mechanic_id: mechanicId,
          status: 'pending',
          score: 1,
          eta_minutes: null,
        })
    }

    // Keep booking open until mechanic accepts
    await supabase
      .from('bookings')
      .update({ status: 'offer_sent', mechanic_id: null })
      .eq('id', bookingId)

    // Keep related service requests pending and targeted to the selected mechanic
    await supabase
      .from('service_requests')
      .update({ status: 'pending', target_mechanic_id: mechanicId })
      .eq('user_id', userId)
      .eq('status', 'pending')

    return new Response(JSON.stringify({
      success: true,
      message: `Request sent to ${mechanic.full_name}. Waiting for accept/reject.`
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
