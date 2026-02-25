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

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = claimsData.claims.sub as string
    const body = await req.json()
    const { transactionId, reason, photos } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!transactionId || typeof transactionId !== 'string' || !uuidRegex.test(transactionId)) {
      return new Response(JSON.stringify({ error: 'Invalid transaction ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!reason || typeof reason !== 'string' || reason.length < 10 || reason.length > 2000) {
      return new Response(JSON.stringify({ error: 'Reason must be 10–2000 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (photos !== undefined && photos !== null && (!Array.isArray(photos) || photos.length > 10 || !photos.every((p: unknown) => typeof p === 'string' && p.length <= 500))) {
      return new Response(JSON.stringify({ error: 'Invalid photos (max 10 URLs)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify transaction belongs to user and is in paid status
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('status', 'paid')
      .single()

    if (!tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found or cannot be disputed' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update transaction to disputed
    await supabase
      .from('transactions')
      .update({
        status: 'disputed',
        dispute_reason: reason,
        dispute_photos: photos || [],
        disputed_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    // Update booking
    await supabase
      .from('bookings')
      .update({ payment_status: 'disputed' })
      .eq('id', tx.booking_id)

    return new Response(JSON.stringify({
      success: true,
      message: 'Dispute raised. Funds held until resolution.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('raise-dispute error:', err)
    return new Response(JSON.stringify({ error: 'Failed to raise dispute' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
