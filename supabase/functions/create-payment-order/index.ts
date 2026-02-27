import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const GST_RATE = 0.18
const PLATFORM_FEE_RATE = 0.15
const MINIMUM_CHARGE = 200

function calculateFees(laborCost: number, partsCost: number) {
  const subtotal = Math.max(laborCost + partsCost, MINIMUM_CHARGE)
  const tax = Math.round(subtotal * GST_RATE)
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE)
  const total = subtotal + tax + platformFee
  const mechanicShare = subtotal - platformFee
  return { laborCost, partsCost, subtotal, tax, platformFee, total, mechanicShare }
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
    const { bookingId, laborCost, partsCost = 0, mechanicQuote } = body

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!bookingId || typeof bookingId !== 'string' || !uuidRegex.test(bookingId)) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Support both new (laborCost+partsCost) and legacy (mechanicQuote) params
    const effectiveLaborCost = laborCost ?? mechanicQuote ?? 0
    const effectivePartsCost = partsCost ?? 0

    if (typeof effectiveLaborCost !== 'number' || effectiveLaborCost < 0 || effectiveLaborCost > 500000) {
      return new Response(JSON.stringify({ error: 'Invalid labor cost' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify booking belongs to this user
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

    const fees = calculateFees(effectiveLaborCost, effectivePartsCost)

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
        amount: Math.round(fees.total * 100), // paise
        currency: 'INR',
        receipt: `booking_${bookingId}`,
        notes: {
          booking_id: bookingId,
          labor_cost: fees.laborCost.toString(),
          parts_cost: fees.partsCost.toString(),
          tax: fees.tax.toString(),
          platform_fee: fees.platformFee.toString(),
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
        mechanic_quote: fees.subtotal,
        labor_cost: fees.laborCost,
        parts_cost: fees.partsCost,
        tax_amount: fees.tax,
        platform_fee: fees.platformFee,
        user_paid_total: fees.total,
        mechanic_share: fees.mechanicShare,
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

    // Update booking with pricing info
    await supabase
      .from('bookings')
      .update({
        mechanic_quote: fees.subtotal,
        labor_cost: fees.laborCost,
        parts_cost: fees.partsCost,
        tax_amount: fees.tax,
        platform_fee: fees.platformFee,
        payment_status: 'pending',
      })
      .eq('id', bookingId)

    return new Response(JSON.stringify({
      orderId: razorpayOrder.id,
      transactionId: transaction.id,
      amount: fees.total,
      amountPaise: Math.round(fees.total * 100),
      breakdown: {
        laborCost: fees.laborCost,
        partsCost: fees.partsCost,
        subtotal: fees.subtotal,
        tax: fees.tax,
        platformFee: fees.platformFee,
        total: fees.total,
        mechanicShare: fees.mechanicShare,
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
