import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const PLATFORM_FEE_PERCENT = 0.15
const PLATFORM_FEE_CAP = 50 // min ₹50 flat

function calculateFees(mechanicQuote: number) {
  const platformFee = Math.max(Math.round(mechanicQuote * PLATFORM_FEE_PERCENT), PLATFORM_FEE_CAP)
  const userPaysTotal = mechanicQuote + platformFee
  const mechanicShare = mechanicQuote - platformFee
  return { platformFee, userPaysTotal, mechanicShare }
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
    const { bookingId, mechanicQuote } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!bookingId || typeof bookingId !== 'string' || !uuidRegex.test(bookingId)) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!mechanicQuote || typeof mechanicQuote !== 'number' || mechanicQuote < 50 || mechanicQuote > 500000) {
      return new Response(JSON.stringify({ error: 'Invalid quote amount (must be ₹50–₹5,00,000)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify booking belongs to this user and is accepted
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!booking.mechanic_id) {
      return new Response(JSON.stringify({ error: 'No mechanic assigned yet' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { platformFee, userPaysTotal, mechanicShare } = calculateFees(mechanicQuote)

    // Create Razorpay order
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: Math.round(userPaysTotal * 100), // Razorpay uses paise
        currency: 'INR',
        receipt: `booking_${bookingId}`,
        notes: {
          booking_id: bookingId,
          mechanic_quote: mechanicQuote.toString(),
          platform_fee: platformFee.toString(),
        },
      }),
    })

    const razorpayOrder = await razorpayRes.json()

    if (!razorpayRes.ok) {
      console.error('Razorpay error:', razorpayOrder)
      return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create transaction record
    const { data: transaction, error: txErr } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        mechanic_id: booking.mechanic_id,
        mechanic_quote: mechanicQuote,
        platform_fee: platformFee,
        user_paid_total: userPaysTotal,
        mechanic_share: mechanicShare,
        status: 'pending',
        razorpay_order_id: razorpayOrder.id,
      })
      .select()
      .single()

    if (txErr) {
      console.error('Transaction insert error:', txErr)
      return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update booking with quote info
    await supabase
      .from('bookings')
      .update({
        mechanic_quote: mechanicQuote,
        platform_fee: platformFee,
        payment_status: 'pending',
      })
      .eq('id', bookingId)

    return new Response(JSON.stringify({
      orderId: razorpayOrder.id,
      transactionId: transaction.id,
      amount: userPaysTotal,
      amountPaise: Math.round(userPaysTotal * 100),
      breakdown: {
        mechanicQuote,
        platformFee,
        userPaysTotal,
        mechanicShare,
      },
      razorpayKeyId: RAZORPAY_KEY_ID,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('create-payment-order error:', err)
    return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
