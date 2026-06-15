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
    const supabase = createAdminClient()

    type CartLine = { id: string; name: string; image: string | null; price: number; quantity: number }
    let cart: CartLine[] = []
    try {
      cart = JSON.parse(session.metadata?.cart ?? '[]')
    } catch {
      cart = []
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    const shipping = (session.shipping_cost?.amount_total ?? 0) / 100
    const total = (session.amount_total ?? 0) / 100

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'processing',
        subtotal,
        shipping_cost: shipping,
        tax: 0,
        total,
        shipping_address: session.customer_details?.address
          ? {
              full_name: session.customer_details.name ?? '',
              address_line1: session.customer_details.address.line1 ?? '',
              address_line2: session.customer_details.address.line2 ?? '',
              city: session.customer_details.address.city ?? '',
              state: session.customer_details.address.state ?? '',
              zip: session.customer_details.address.postal_code ?? '',
              country: session.customer_details.address.country ?? 'US',
            }
          : null,
        notes: `Stripe session ${session.id}`,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }

    // Create order items
    if (cart.length > 0) {
      await supabase.from('order_items').insert(
        cart.map(i => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          product_image: i.image,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        }))
      )

      // Decrement stock for each product
      for (const i of cart) {
        await supabase.rpc('decrement_stock', { p_product_id: i.id, p_qty: i.quantity })
      }
    }
  }

  return NextResponse.json({ received: true })
}
