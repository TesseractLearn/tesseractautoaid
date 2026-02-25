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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!transactionId || typeof transactionId !== 'string' || !uuidRegex.test(transactionId)) {
      return new Response(JSON.stringify({ error: 'Invalid transaction ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!razorpay_order_id || typeof razorpay_order_id !== 'string' || razorpay_order_id.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid order ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!razorpay_payment_id || typeof razorpay_payment_id !== 'string' || razorpay_payment_id.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid payment ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!razorpay_signature || typeof razorpay_signature !== 'string' || razorpay_signature.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify signature using Razorpay's method
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const encoder = new TextEncoder()
    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
    const key = encoder.encode(RAZORPAY_KEY_SECRET)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, data)
    const expectedSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    if (expectedSig !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Update transaction
    await supabase
      .from('transactions')
      .update({
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('user_id', userId)

    // Get transaction to update booking
    const { data: tx } = await supabase
      .from('transactions')
      .select('booking_id')
      .eq('id', transactionId)
      .single()

    if (tx) {
      await supabase
        .from('bookings')
        .update({ payment_status: 'paid_escrow' })
        .eq('id', tx.booking_id)
    }

    return new Response(JSON.stringify({ success: true, message: 'Payment verified and held in escrow' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('verify-payment error:', err)
    return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
