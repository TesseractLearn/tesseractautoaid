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
    const { transactionId } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!transactionId || typeof transactionId !== 'string' || !uuidRegex.test(transactionId)) {
      return new Response(JSON.stringify({ error: 'Invalid transaction ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get transaction
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('status', 'paid')
      .single()

    if (!tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found or not in paid status' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Release: update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'released_to_mechanic',
        released_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    // Update booking payment status
    await supabase
      .from('bookings')
      .update({
        payment_status: 'released',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', tx.booking_id)

    // Credit mechanic earnings
    await supabase.rpc('increment_mechanic_earnings', {
      _mechanic_id: tx.mechanic_id,
      _amount: tx.mechanic_share,
    }).catch(() => {
      // If RPC doesn't exist, update directly
      return supabase
        .from('mechanics')
        .update({
          total_earnings: tx.total_earnings + tx.mechanic_share,
        })
        .eq('id', tx.mechanic_id)
    })

    // Add to mechanic_transactions
    await supabase
      .from('mechanic_transactions')
      .insert({
        mechanic_id: tx.mechanic_id,
        booking_id: tx.booking_id,
        amount: tx.mechanic_share,
        transaction_type: 'payment',
        description: `Payment for booking - ₹${tx.mechanic_share} (after platform fee)`,
      })

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment released to mechanic',
      mechanicShare: tx.mechanic_share,
      platformFee: tx.platform_fee,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('release-payment error:', err)
    return new Response(JSON.stringify({ error: 'Failed to release payment' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
