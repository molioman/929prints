import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// Stripe needs the raw, unparsed body to verify the signature.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (!orderId) {
      console.error('No order_id in session metadata')
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()
    const addr = session.customer_details?.address

    // Mark the pending order as paid and attach the shipping address.
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        shipping_address: addr
          ? {
              full_name: session.customer_details?.name ?? '',
              address_line1: addr.line1 ?? '',
              address_line2: addr.line2 ?? '',
              city: addr.city ?? '',
              state: addr.state ?? '',
              zip: addr.postal_code ?? '',
              country: addr.country ?? 'US',
            }
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Decrement stock for each item in the order.
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    for (const item of orderItems ?? []) {
      if (item.product_id) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_qty: item.quantity,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
