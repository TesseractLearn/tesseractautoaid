import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXPANDED_RADIUS_KM = 30

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { bookingId } = await req.json()

    // Check booking status
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking || booking.status === 'accepted' || booking.status === 'completed') {
      return new Response(JSON.stringify({ success: true, message: 'Booking already handled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if any offer was accepted
    const { data: acceptedOffer } = await supabase
      .from('booking_offers')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'accepted')
      .limit(1)
      .single()

    if (acceptedOffer) {
      return new Response(JSON.stringify({ success: true, message: 'Already accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Expire all pending offers
    await supabase
      .from('booking_offers')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')

    // Get already-offered mechanic IDs
    const { data: existingOffers } = await supabase
      .from('booking_offers')
      .select('mechanic_id')
      .eq('booking_id', bookingId)

    const excludeIds = (existingOffers || []).map(o => o.mechanic_id)

    // Call dispatch-booking with expanded radius and exclusions
    const dispatchUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/dispatch-booking`
    const dispatchRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        bookingId,
        radiusKm: EXPANDED_RADIUS_KM,
        excludeMechanicIds: excludeIds,
      }),
    })

    const result = await dispatchRes.json()

    return new Response(JSON.stringify({
      success: true,
      expanded: true,
      result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
