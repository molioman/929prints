import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe'
import { PLATFORM_FEE_PERCENT } from '@/lib/connect'

// ===========================================================================
// POST /api/connect/checkout
// Sell a single product using a DESTINATION CHARGE with an application fee.
//
// How the money flows:
//  - The customer pays the platform.
//  - `transfer_data.destination` forwards the funds to the connected account.
//  - `application_fee_amount` is kept by the platform as its cut.
//
// We use Stripe-hosted Checkout for simplicity.
// ===========================================================================
export async function POST(req: NextRequest) {
  try {
    const { priceId, unitAmount, connectedAccountId } = await req.json()

    if (!priceId || !unitAmount || !connectedAccountId) {
      return NextResponse.json(
        { error: 'priceId, unitAmount and connectedAccountId are required' },
        { status: 400 }
      )
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    // Platform fee = PLATFORM_FEE_PERCENT of the price (in cents, rounded).
    const applicationFeeAmount = Math.round((unitAmount * PLATFORM_FEE_PERCENT) / 100)

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          // Reuse the product's existing default price.
          price: priceId,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // The platform's cut of this transaction.
        application_fee_amount: applicationFeeAmount,
        // Route the remainder to the seller's connected account.
        transfer_data: {
          destination: connectedAccountId,
        },
      },
      success_url: `${origin}/connect/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/connect/storefront`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Connect checkout error:', err)
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 })
  }
}
