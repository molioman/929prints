import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { CartItem } from '@/lib/types'

const SHIPPING_CENTS = 999

export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json()) as { items: CartItem[] }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const subtotal = items.reduce((s, { product, quantity }) => s + product.price * quantity, 0)
    const shipping = SHIPPING_CENTS / 100
    const total = subtotal + shipping

    // 1. Create a pending order up front so we never lose order data.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        subtotal,
        shipping_cost: shipping,
        tax: 0,
        total,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create pending order:', orderError)
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
    }

    // 2. Save the line items.
    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] ?? null,
        quantity,
        unit_price: product.price,
        total_price: product.price * quantity,
      }))
    )

    if (itemsError) {
      console.error('Failed to create order items:', itemsError)
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    // 3. Create the Stripe Checkout session, carrying only the order id.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            images: product.images?.length ? [product.images[0]] : undefined,
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: SHIPPING_CENTS, currency: 'usd' },
            display_name: 'Standard shipping',
          },
        },
      ],
      metadata: { order_id: order.id },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
